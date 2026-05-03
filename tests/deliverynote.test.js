import request from "supertest";
import mongoose from "mongoose";
import Client from "../src/models/client.models.js";
import Project from "../src/models/project.models.js";
import DeliveryNote from "../src/models/deliverynote.models.js";
import { userData, guestData, userOnboardingData, companyOnboardingData, clientData, projectData, 
  deliveryNoteData, deliveryNoteData2, invalidDeliveryNoteData } from "./testData.js";
import { connectDB, closeDB, ioMock } from "./setup.js";
import { setupMock } from "./mocks.js";

await setupMock();

const { default: app } = await import("../src/app.js");

let token;
let user;
let company;
let projectId;
let clientId;

const validPngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64");

beforeAll(async () => {
  await connectDB();

  app.set("io", ioMock);
});

afterAll(async () => {
  await closeDB();
});

describe("Delivery Note Endpoints", () => {

  beforeEach(async () => {

    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }

    const registerUser = await request(app)
        .post("/api/user/register")
        .send(userData)

    token = registerUser.body.accessToken

    const onboardingUser = await request(app)
        .put('/api/user/register')
        .set("Authorization", `Bearer ${token}`)
        .send(userOnboardingData)

    const onboardingCompany = await request(app)
        .patch('/api/user/company')
        .set("Authorization", `Bearer ${token}`)
        .send(companyOnboardingData)
    
    await request(app)
      .post("/api/client")
      .set("Authorization", `Bearer ${token}`)
      .send(clientData);

    const client = await Client.findOne({ cif: clientData.cif });
    clientId = client._id;

    await request(app)
      .post("/api/project")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...projectData, client: clientId });

    const project = await Project.findOne({ projectCode: projectData.projectCode });
    projectId = project._id;

  })

  describe("POST /api/deliverynote", () => {

    it("✅ should create delivery note", async () => {
      const res = await request(app)
        .post("/api/deliverynote")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...deliveryNoteData, project: projectId });

      expect(res.statusCode).toBe(201);
    });

    it("❌ should fail invalid project", async () => {
      const res = await request(app)
        .post("/api/deliverynote")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...deliveryNoteData, project: new mongoose.Types.ObjectId() });

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail wrong workers hours", async () => {
      const res = await request(app)
        .post("/api/deliverynote")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...invalidDeliveryNoteData,
          project: projectId,
        });

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail without token", async () => {
      const res = await request(app).post("/api/deliverynote");
      expect(res.statusCode).toBe(401);
    });

    it("❌ should fail if guest", async () => {

      await request(app)
        .put("/api/user/invite")
        .set("Authorization", `Bearer ${token}`)
        .send(guestData);

      const login = await request(app)
        .post("/api/user/login")
        .send(guestData);

      token = login.body.accessToken;

      const res = await request(app)
        .post("/api/deliverynote")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...deliveryNoteData, project: projectId });

      expect(res.statusCode).toBe(403);
    });

  });

  describe("GET /api/deliverynote", () => {

    beforeEach(async () => {
      await request(app)
        .post("/api/deliverynote")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...deliveryNoteData, project: projectId });

      await request(app)
        .post("/api/deliverynote")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...deliveryNoteData2, project: projectId });
    });

    it("✅ should get delivery notes", async () => {
      const res = await request(app)
        .get("/api/deliverynote")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.deliveryNotes.length).toBe(2);
    });

    it("✅ should filter by project", async () => {
      const res = await request(app)
        .get(`/api/deliverynote?project=${projectId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.deliveryNotes.length).toBeGreaterThan(0);
    });

    it("✅ should paginate", async () => {
      const res = await request(app)
        .get("/api/deliverynote?page=2&limit=1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.deliveryNotes.length).toBe(1);
    });

    it("❌ should fail invalid query", async () => {
      const res = await request(app)
        .get("/api/deliverynote?fake=field")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
    });

  });

  describe("GET /api/deliverynote/:id", () => {

    beforeEach(async () => {
      await request(app)
        .post("/api/deliverynote")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...deliveryNoteData, project: projectId });

      const dn = await DeliveryNote.findOne({});
      deliveryNoteId = dn._id;
    });

    it("✅ should get delivery note", async () => {
      const res = await request(app)
        .get(`/api/deliverynote/${deliveryNoteId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it("❌ should fail not found", async () => {
      const res = await request(app)
        .get(`/api/deliverynote/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

    it("❌ should fail invalid id", async () => {
      const res = await request(app)
        .get(`/api/deliverynote/FA:KE_ID`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
    });

  });

  describe("GET /api/deliverynote/pdf/:id", () => {

    beforeEach(async () => {
      await request(app)
        .post("/api/deliverynote")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...deliveryNoteData, project: projectId });

      const dn = await DeliveryNote.findOne({});
      deliveryNoteId = dn._id;
    });

    it("✅ should get pdf", async () => {
      const res = await request(app)
        .get(`/api/deliverynote/pdf/${deliveryNoteId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("application/pdf");
    });

    it("❌ should fail invalid id", async () => {
      const res = await request(app)
        .get(`/api/deliverynote/pdf/FA:KE_ID`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail not found", async () => {
      const res = await request(app)
        .get(`/api/deliverynote/pdf/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

  });

  describe("PATCH /api/deliverynote/:id/sign", () => {

    beforeEach(async () => {
      await request(app)
        .post("/api/deliverynote")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...deliveryNoteData, project: projectId });

      const dn = await DeliveryNote.findOne({});
      deliveryNoteId = dn._id;
    });

    it("❌ should fail without file", async () => {
      const res = await request(app)
        .patch(`/api/deliverynote/${deliveryNoteId}/sign`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail not found", async () => {
      const res = await request(app)
        .patch(`/api/deliverynote/${new mongoose.Types.ObjectId()}/sign`)
        .set("Authorization", `Bearer ${token}`)
        .attach("signature", Buffer.from("fake"), "signature.png");

      expect(res.statusCode).toBe(404);
    });

    it("❌ should fail invalid id", async () => {
      const res = await request(app)
        .patch(`/api/deliverynote/FA:KE_ID/sign`)
        .set("Authorization", `Bearer ${token}`)
        .attach("signature", Buffer.from("fake"), "signature.png")

      expect(res.statusCode).toBe(400);
    });

    it("✅ should sign delivery note", async () => {
      const res = await request(app)
        .patch(`/api/deliverynote/${deliveryNoteId}/sign`)
        .set("Authorization", `Bearer ${token}`)
        .attach("signature", validPngBuffer, {
            filename: "signature.png",
            contentType: "image/png"
        });

      expect(res.statusCode).toBe(200);
    });
    
    it("❌ should fail if guest", async () => {

      await request(app)
        .put("/api/user/invite")
        .set("Authorization", `Bearer ${token}`)
        .send(guestData);

      const login = await request(app)
        .post("/api/user/login")
        .send(guestData);

      token = login.body.accessToken;

      const res = await request(app)
        .patch(`/api/deliverynote/${deliveryNoteId}/sign`)
        .set("Authorization", `Bearer ${token}`)
        .attach("signature", Buffer.from("fake"), "signature.png");

      expect(res.statusCode).toBe(403);
    });
  });

  describe("DELETE /api/deliverynote/:id", () => {

    beforeEach(async () => {
      await request(app)
        .post("/api/deliverynote")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...deliveryNoteData, project: projectId });

      const dn = await DeliveryNote.findOne({});
      deliveryNoteId = dn._id;
    });

    it("✅ should soft delete", async () => {
      const res = await request(app)
        .delete(`/api/deliverynote/${deliveryNoteId}?soft=true`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it("✅ should delete delivery note", async () => {
      const res = await request(app)
        .delete(`/api/deliverynote/${deliveryNoteId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it("❌ should fail if invalid query", async () => {
      const res = await request(app)
        .delete(`/api/project/${projectId}?paca=vaca`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail invalid id", async () => {
      const res = await request(app)
        .delete(`/api/deliverynote/FA:KE_ID`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail if not found", async () => {
      const res = await request(app)
        .delete(`/api/project/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

    it("❌ should fail without token", async () => {
      const res = await request(app)
        .delete(`/api/deliverynote/${deliveryNoteId}`);

      expect(res.statusCode).toBe(401);
    });

    it("❌ should fail if guest", async () => {

      await request(app)
        .put("/api/user/invite")
        .set("Authorization", `Bearer ${token}`)
        .send(guestData);

      const login = await request(app)
        .post("/api/user/login")
        .send(guestData);

      token = login.body.accessToken;

      const res = await request(app)
        .delete(`/api/deliverynote/${deliveryNoteId}`)
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(403);
    });

  });

});