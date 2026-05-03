import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import Client from "../src/models/client.models.js";
import Project from "../src/models/project.models.js";
import User from "../src/models/user.models.js";
import Company from "../src/models/company.models.js";  
import { userData, guestData, userOnboardingData, companyOnboardingData, clientData, projectData, projectData2} from "./testData.js";
import { connectDB, closeDB, ioMock } from "./setup.js";

let token;
let user;
let company;
let projectId;
let clientId;

beforeAll(async () => {
  await connectDB();

  app.set("io", ioMock);
});

afterAll(async () => {
  await closeDB();
});

describe("Project Endpoints", () => {

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

  })

  describe("POST /api/project", () => {

    it("✅ should create a project", async () => {
      const res = await request(app)
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData, client: clientId });

      expect(res.statusCode).toBe(201);
    });

    it("❌ should fail duplicate projectCode", async () => {
      await request(app)
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData, client: clientId });

      const res = await request(app)
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData, client: clientId });

      expect(res.statusCode).toBe(409);
    });

    it("❌ should fail if client not exists", async () => {
      const res = await request(app)
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData, client: new mongoose.Types.ObjectId() });

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail without token", async () => {
      const res = await request(app).post("/api/project");
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
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData, client: clientId });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("PUT /api/project/:id", () => {

    beforeEach(async () => {
      await request(app)
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData, client: clientId });

      const project = await Project.findOne({ projectCode: projectData.projectCode });
      projectId = project._id;
    });

    it("✅ should update project", async () => {
      const res = await request(app)
        .put(`/api/project/${projectId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated" });

      expect(res.statusCode).toBe(200);
    });

    it("❌ should fail invalid field", async () => {
      const res = await request(app)
        .put(`/api/project/${projectId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ fake: "field" });

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail invalid id", async () => {
      const res = await request(app)
        .put(`/api/project/FA:KE_ID`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated" });

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail not found", async () => {
      const res = await request(app)
        .put(`/api/project/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated" });

      expect(res.statusCode).toBe(404);
    });

    it("❌ should fail without token", async () => {
      const res = await request(app).put(`/api/project/${projectId}`);
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
        .put(`/api/project/${projectId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData, client: clientId });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/project", () => {

    beforeEach(async () => {
      await request(app)
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData, client: clientId });

      await request(app)
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData2, client: clientId });
    });

    it("✅ should get projects", async () => {
      const res = await request(app)
        .get("/api/project")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.projects.length).toBe(2);
    });

    it("✅ should filter by name", async () => {
      const res = await request(app)
        .get(`/api/project?name=${projectData.name}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.projects.length).toBe(1);
    });

    it("✅ should filter by client", async () => {
      const res = await request(app)
        .get(`/api/project?client=${clientId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.projects.length).toBe(2);
    });

    it("✅ should filter by name", async () => {
      const res = await request(app)
        .get(`/api/project?name=${projectData.name}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.projects.length).toBe(1);
    });

    it("✅ should filter by active", async () => {
      const res = await request(app)
        .get(`/api/project?active=true`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.projects.length).toBe(1);
    });

    it("✅ should sort by createdAt", async () => {
      const res = await request(app)
        .get(`/api/project?sort=-createdAt`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.projects.length).toBe(2);
    });

    it("✅ should paginate", async () => {
      const res = await request(app)
        .get("/api/project?page=2&limit=1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.projects.length).toBe(1);
    });

    it("❌ should fail invalid query", async () => {
      const res = await request(app)
        .get("/api/project?paco=pepe")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail without token", async () => {
      const res = await request(app).get("/api/project");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/project/:id", () => {

    beforeEach(async () => {
      await request(app)
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData, client: clientId });

      const project = await Project.findOne({ projectCode: projectData.projectCode });
      projectId = project._id;
    });

    it("✅ should get project", async () => {
      const res = await request(app)
        .get(`/api/project/${projectId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it("❌ should fail not found", async () => {
      const res = await request(app)
        .get(`/api/project/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

    it("❌ should fail invalid id", async () => {
      const res = await request(app)
        .get(`/api/project/FA:KE_ID`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
    });
  });

  describe("DELETE /api/project/:id", () => {

    beforeEach(async () => {
      await request(app)
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData, client: clientId });

      const project = await Project.findOne({ projectCode: projectData.projectCode });
      projectId = project._id;
    });

    it("✅ should soft delete", async () => {
      const res = await request(app)
        .delete(`/api/project/${projectId}?soft=true`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it("✅ should hard delete", async () => {
      const res = await request(app)
        .delete(`/api/project/${projectId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it("❌ should fail invalid id", async () => {
      const res = await request(app)
        .delete(`/api/project/FA:KE_ID`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail without token", async () => {
      const res = await request(app).delete(`/api/project/${projectId}`);
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
        .put(`/api/project/${projectId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData, client: clientId });

      expect(res.statusCode).toBe(403);
    });

  });

  describe("GET /api/project/archived", () => {

    beforeEach(async () => {
      await request(app)
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData, client: clientId });

      const project = await Project.findOne({ projectCode: projectData.projectCode });
      projectId = project._id;

      await request(app)
        .delete(`/api/project/${projectId}?soft=true`)
        .set("Authorization", `Bearer ${token}`);
    });

    it("✅ should get archived", async () => {
      const res = await request(app)
        .get("/api/project/archived")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.projects.length).toBeGreaterThan(0);
    });

    it("❌ should fail without token", async () => {
      const res = await request(app).get("/api/project/archived");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("PATCH /api/project/:id/restore", () => {

    beforeEach(async () => {
      await request(app)
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData, client: clientId });

      const project = await Project.findOne({ projectCode: projectData.projectCode });
      projectId = project._id;

      await request(app)
        .delete(`/api/project/${projectId}?soft=true`)
        .set("Authorization", `Bearer ${token}`);
    });

    it("✅ should restore project", async () => {
      const res = await request(app)
        .patch(`/api/project/${projectId}/restore`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it("❌ should fail not found", async () => {
      const res = await request(app)
        .patch(`/api/project/${new mongoose.Types.ObjectId()}/restore`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

    it("❌ should fail invalid id", async () => {
      const res = await request(app)
        .patch(`/api/project/FA:KE_ID/restore`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
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
        .put(`/api/project/${projectId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ ...projectData, client: clientId });

      expect(res.statusCode).toBe(403);
    });

  });

});