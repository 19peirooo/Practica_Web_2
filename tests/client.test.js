import request from "supertest";
import mongoose from "mongoose";
import Client from "../src/models/client.models.js";
import User from "../src/models/user.models.js";
import Company from "../src/models/company.models.js";  
import { userData, guestData, userOnboardingData, companyOnboardingData, clientData, clientData2 } from "./testData.js";
import { connectDB, closeDB, ioMock } from "./setup.js";
import { setupMock } from "./mocks.js";

let token;
let user;
let company;
let clientId;

await setupMock();

const { default: app } = await import("../src/app.js");

beforeAll(async () => {
  await connectDB();

  app.set("io", ioMock);
});

afterAll(async () => {
  await closeDB();
})

describe("Client Endpoints", () => {

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

  })

  describe("POST /api/client", () => {
    it("✅ should create a client", async () => {
      const res = await request(app)
        .post("/api/client")
        .set("Authorization", `Bearer ${token}`)
        .send(clientData);

      expect(res.statusCode).toBe(201);
    });

    it("❌ should fail if duplicate CIF", async () => {
      await request(app)
        .post("/api/client")
        .set("Authorization", `Bearer ${token}`)
        .send(clientData);

      const res = await request(app)
        .post("/api/client")
        .set("Authorization", `Bearer ${token}`)
        .send(clientData);

      expect(res.statusCode).toBe(409);
    });

    it("❌ should fail if invalid user", async () => {

      const res = await request(app)
        .post("/api/client")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Invalid",
          cif: "CIF ERRONEO"
        });

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail without token", async () => {
      const res = await request(app).post("/api/client");
      expect(res.statusCode).toBe(401)
    });

    it ("❌ should fail if guest", async () => {
      const guest = await request(app).put('/api/user/invite')
      .set("Authorization", `Bearer ${token}`)
      .send(guestData)

      const login = await request(app).post('/api/user/login').send(guestData)
      token = login.body.accessToken
      
      const res = await request(app)
        .post("/api/client")
        .set("Authorization", `Bearer ${token}`)
        .send(clientData);

      expect(res.statusCode).toBe(403)

    });
  })

  describe("PUT /api/client/:id", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/client")
        .set("Authorization", `Bearer ${token}`)
        .send(clientData);

      const client = await Client.findOne({cif: clientData.cif})
      clientId = client._id
    });

    it("✅ should update client", async () => {
      const res = await request(app)
        .put(`/api/client/${clientId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated" });

      expect(res.statusCode).toBe(200);
    });

    it("❌ should fail if invalid field", async () => {
      const res = await request(app)
        .put(`/api/client/${clientId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ fakeField: "Updated" });

      expect(res.statusCode).toBe(400);
    })

    it("❌ should fail in invalid id", async () => {
      const res = await request(app)
        .put(`/api/client/FA:KE_ID`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated" });

      expect(res.statusCode).toBe(400);
    })

    it("❌ should fail if client not found", async () => {
      const res = await request(app)
        .put(`/api/client/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated" });

      expect(res.statusCode).toBe(404);
    });

    it("❌ should fail without token", async () => {
      const res = await request(app).put(`/api/client/${clientId}`);
      expect(res.statusCode).toBe(401)
    });

    it ("❌ should fail if guest", async () => {
      const guest = await request(app)
      .put('/api/user/invite')
      .set("Authorization", `Bearer ${token}`)
      .send(guestData)

      const login = await request(app).post('/api/user/login').send(guestData)
      token = login.body.accessToken
      
      const res = await request(app)
        .put(`/api/client/${clientId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({name: 'Updated'});

      expect(res.statusCode).toBe(403)

    });
  });

  describe("GET /api/client", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/client")
        .set("Authorization", `Bearer ${token}`)
        .send(clientData);

        await request(app)
        .post("/api/client")
        .set("Authorization", `Bearer ${token}`)
        .send(clientData2);
    });

    it("✅ should get clients list", async () => {
      const res = await request(app)
        .get("/api/client")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.clients.length).toBe(2);
    });

    it("✅ should filter by name", async () => {
      const res = await request(app)
        .get("/api/client?name=test")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.clients.length).toBe(1);
      expect(res.body.clients[0].name).toBe("testClient")
    });

    it("✅ should use page and limit", async () => {
      const res = await request(app)
        .get("/api/client?page=2&limit=1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.clients.length).toBe(1);
      expect(res.body.clients[0].name).toBe("paco")
    })

    it("✅ should sort by createdAt", async () => {
      const res = await request(app)
        .get("/api/client?sort=createdAt")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.clients.length).toBe(2);
      expect(res.body.clients[0].name).toBe("testClient")
    })

    it("❌ should fail if invalid filter", async () => {
      const res = await request(app)
        .get("/api/client?paca=vaca")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
    })

    it("❌ should fail without token", async () => {
      const res = await request(app).get("/api/client");
      expect(res.statusCode).toBe(401)
    });

  });

  describe("GET /api/client/:id", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/client")
        .set("Authorization", `Bearer ${token}`)
        .send(clientData);

      const client = await Client.findOne({cif: clientData.cif})
      clientId = client._id
    });

    it("✅ should get client by id", async () => {
      const res = await request(app)
        .get(`/api/client/${clientId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(clientId.toString());
    });

    it("❌ should fail if not found", async () => {
      const res = await request(app)
        .get(`/api/client/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

    it("❌ should fail in invalid id", async () => {
      const res = await request(app)
        .get(`/api/client/FA:KE_ID`)
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(400);
    })

    it("❌ should fail without token", async () => {
      const res = await request(app).get(`/api/client/${clientId}`);
      expect(res.statusCode).toBe(401)
    });
  });

  describe("DELETE /api/client/:id", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/client")
        .set("Authorization", `Bearer ${token}`)
        .send(clientData);

      const client = await Client.findOne({cif: clientData.cif})
      clientId = client._id
    });

    it("✅ should soft delete client", async () => {
      const res = await request(app)
        .delete(`/api/client/${clientId}?soft=true`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it("✅ should hard delete client", async () => {
      const res = await request(app)
        .delete(`/api/client/${clientId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it("❌ should fail if invalid query", async () => {
      const res = await request(app)
        .delete(`/api/client/${clientId}?paca=vaca`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail in invalid id", async () => {
      const res = await request(app)
        .delete(`/api/client/FA:KE_ID`)
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(400);
    })

    it("❌ should fail if not found", async () => {
      const res = await request(app)
        .delete(`/api/client/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

    it("❌ should fail without token", async () => {
      const res = await request(app).delete(`/api/client/${clientId}`);
      expect(res.statusCode).toBe(401)
    });

    it ("❌ should fail if guest", async () => {
      const guest = await request(app)
      .put('/api/user/invite')
      .set("Authorization", `Bearer ${token}`)
      .send(guestData)

      const login = await request(app).post('/api/user/login').send(guestData)
      token = login.body.accessToken
      
      const res = await request(app)
        .delete(`/api/client/${clientId}`)
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(403)

    });
  });

  describe("GET /api/client/archived", () => {

    beforeEach(async () => {
      await request(app)
        .post("/api/client")
        .set("Authorization", `Bearer ${token}`)
        .send(clientData);

      const client = await Client.findOne({cif: clientData.cif})
      clientId = client._id

      await request(app)
        .delete(`/api/client/${clientId}?soft=true`)
        .set("Authorization", `Bearer ${token}`);

    });

    it("✅ should get archived clients", async () => {
      
      const res = await request(app)
        .get("/api/client/archived")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.clients.length).toBeGreaterThan(0);
    });

    it("❌ should fail without token", async () => {
      const res = await request(app).get("/api/client/archived");
      expect(res.statusCode).toBe(401)
    });
  });

  describe("PATCH /api/client/:id/restore", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/client")
        .set("Authorization", `Bearer ${token}`)
        .send(clientData);

      const client = await Client.findOne({cif: clientData.cif})
      clientId = client._id

      await request(app)
        .delete(`/api/client/${clientId}?soft=true`)
        .set("Authorization", `Bearer ${token}`);

    });

    it("✅ should restore client", async () => {
      const res = await request(app)
        .patch(`/api/client/${clientId}/restore`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Cliente Recuperado");
    });

    it("❌ should fail if not found", async () => {
      const res = await request(app)
        .patch(`/api/client/${new mongoose.Types.ObjectId()}/restore`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

    it("❌ should fail without token", async () => {
      const res = await request(app).patch(`/api/client/${clientId}/restore`);
      expect(res.statusCode).toBe(401)
    });

    it ("❌ should fail if guest", async () => {
      const guest = await request(app)
      .put('/api/user/invite')
      .set("Authorization", `Bearer ${token}`)
      .send(guestData)

      const login = await request(app).post('/api/user/login').send(guestData)
      token = login.body.accessToken
      
      const res = await request(app)
        .patch(`/api/client/${clientId}/restore`)
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(403)

    });

    it("❌ should fail in invalid id", async () => {
      const res = await request(app)
        .patch(`/api/client/FA:KE_ID/restore`)
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(400);
    })

  });

})