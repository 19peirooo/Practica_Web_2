import request from "supertest";
import mongoose from "mongoose";
import User from "../src/models/user.models.js";
import Company from "../src/models/company.models.js"
import RefreshToken from "../src/models/refreshtoken.models.js";
import cloudinaryService from "../src/services/cloudinary.service.js";
import { userData, adminData, guestData, userOnboardingData, companyOnboardingData, invalidUserData } from "./testData.js";
import { connectDB, closeDB } from "./setup.js";
import { setupMock } from "./mocks.js";

let accessToken
let refreshToken
let adminUser
let code

await setupMock();

const { default: app } = await import("../src/app.js");

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await closeDB();
});

describe("User Endpoints", () => {

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  })

  describe("POST /api/user/register", () => {

    it("✅ should register a new user", async () => {
      const res = await request(app)
        .post("/api/user/register")
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body.email).toBe(userData.email);
    });

    it("❌ should not register duplicate user", async () => {

      await request(app)
        .post("/api/user/register")
        .send(userData)

      const res = await request(app)
        .post("/api/user/register")
        .send(userData);

      expect(res.statusCode).toBe(409);
    });

    it("❌ Should no register invalid user", async () => {

      const res = await request(app)
        .post("/api/user/register")
        .send(invalidUserData);

      expect(res.statusCode).toBe(400);
    })

  });

  describe("PUT /api/user/validation", () => {
    beforeEach(async () => {
      const res = await request(app).
      post("/api/user/register")
      .send(userData);

      accessToken = res.body.accessToken;

      const user = await User.findOne({ email: userData.email });
      code = user.verificationCode;
    });

    it("✅ should validate email", async() => {
      const res = await request(app)
      .put("/api/user/validation")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({verificationCode: code})

      expect(res.statusCode).toBe(200)
    })

    it("❌ should fail without token", async () => {
      const res = await request(app).put("/api/user/validation");
      expect(res.statusCode).toBe(401)
    });

    it("❌ should fail with invalid code", async () => {
      const res = await request(app)
      .put("/api/user/validation")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({verificationCode: "000000"})

      expect(res.statusCode).toBe(400)

    })

    it("❌ too many verification requests", async () => {

      for (let i = 0; i < 2; i++) {
        await request(app)
          .put("/api/user/validation")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({verificationCode: "000000"});
      }

      const res = await request(app)
        .put("/api/user/validation")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({verificationCode: "000000"});

      expect(res.statusCode).toBe(429);
    });

    it ("❌ user is all ready verified", async () => {
      await request(app)
      .put("/api/user/validation")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({verificationCode: code})

      const res = await request(app)
      .put("/api/user/validation")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({verificationCode: code})

      expect(res.statusCode).toBe(400)
    })
  })

  describe("POST /api/user/login", () => {

    beforeEach(async () => {
      await request(app).post("/api/user/register").send(userData);
    });

    it("✅ should login user", async () => {
      const res = await request(app)
        .post("/api/user/login")
        .send(userData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("accessToken");

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it("❌ should fail with wrong password", async () => {
      const res = await request(app)
        .post("/api/user/login")
        .send({ ...userData, password: "87654321" });

      expect(res.statusCode).toBe(401);
    });

    it("❌ should fail if user not found", async () => {
      const res = await request(app)
        .post("/api/user/login")
        .send({ email: "no@user.com", password: "12345678" });

      expect(res.statusCode).toBe(404);
    });

  });

  describe("PUT /api/user/register", () => {
    beforeEach(async () => {
      await request(app).post("/api/user/register").send(userData);
      const login = await request(app).post("/api/user/login").send(userData);
      accessToken = login.body.accessToken;
    })

    it("✅ should complete onboarding", async () => {

      const res = await request(app)
        .put('/api/user/register')
        .set("Authorization", `Bearer ${accessToken}`)
        .send(userOnboardingData)
      
      expect(res.statusCode).toBe(200)

    })

    it("❌ cannot onboard invalid user", async () => {
      const res = await request(app)
        .put('/api/user/register')
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Paco"
        })
      
      expect(res.statusCode).toBe(400)
    })

    it("❌ cannot onboard invalid cif", async () => {
      const res = await request(app)
        .put('/api/user/register')
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Test",
          lastName: "User",
          nif: "123456A",
          address: {
            street: "Travesia de Antonio Nebrija",
            number: 4,
            postal: "28040",
            city:"Madrid",
            province: "Madrid"
          }
        })
      
      expect(res.statusCode).toBe(400)
    })

    it("❌ should fail without token", async () => {
      const res = await request(app).put("/api/user/register");
      expect(res.statusCode).toBe(401);
    })

  })

  describe("PATCH /api/user/company", () => {

    beforeEach(async () => {
      await request(app).post("/api/user/register").send(userData);
      const login = await request(app).post("/api/user/login").send(userData);
      accessToken = login.body.accessToken;
    })

    it("✅ should complete company onboarding", async () => {
      const res = await request(app)
        .patch('/api/user/company')
        .set("Authorization", `Bearer ${accessToken}`)
        .send(companyOnboardingData)
      
      expect(res.statusCode).toBe(200)
    })

    it("✅ should complete freelance onboarding", async () => {

      await request(app)
        .put('/api/user/register')
        .set("Authorization", `Bearer ${accessToken}`)
        .send(userOnboardingData)

      const res = await request(app)
        .patch('/api/user/company')
        .set("Authorization", `Bearer ${accessToken}`)
        .send({isFreelance: true})
      
      expect(res.statusCode).toBe(200)
    })

    it("✅ should complete company onboarding as guest", async () => {

      const company = await Company.create({
        ...companyOnboardingData,
        owner: new mongoose.Types.ObjectId()
      });

      const res = await request(app)
        .patch("/api/user/company")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(companyOnboardingData)

      expect(res.statusCode).toBe(200);

      const user = await User.findOne({ email: userData.email });

      expect(user.company.toString()).toBe(company._id.toString());
      expect(user.role).toBe("guest");

    })

    it("❌ should fail without token", async () => {
      const res = await request(app).patch("/api/user/company");
      expect(res.statusCode).toBe(401);
    })

  })

  describe("GET /api/user", () => {

    beforeEach(async () => {
      await request(app).post("/api/user/register").send(userData);
      const login = await request(app).post("/api/user/login").send(userData);
      accessToken = login.body.accessToken;
    });

    it("✅ should get current user", async () => {
      const res = await request(app)
        .get("/api/user")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("email");
    });

    it("❌ should fail without token", async () => {
      const res = await request(app).get("/api/user");
      expect(res.statusCode).toBe(401);
    });

  });

  describe("POST /api/user/refresh", () => {

    beforeEach(async () => {
      await request(app).post("/api/user/register").send(userData);
      const login = await request(app).post("/api/user/login").send(userData);
      refreshToken = login.body.refreshToken;
    });

    it("✅ should refresh access token", async () => {
      const res = await request(app)
        .post("/api/user/refresh")
        .send({ refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
    });

    it("❌ should fail with invalid refresh token", async () => {
      const res = await request(app)
        .post("/api/user/refresh")
        .send({ refreshToken: "invalid" });

      expect(res.statusCode).toBe(401);
    });

  });

  describe("POST /api/user/logout", () => {

    beforeEach(async () => {
      await request(app).post("/api/user/register").send(userData);
      const login = await request(app).post("/api/user/login").send(userData);
      accessToken = login.body.accessToken;
    });

    it("✅ should logout user", async () => {
      const res = await request(app)
        .post("/api/user/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
    });

  });

  describe("PUT /api/user/password", () => {

    beforeEach(async () => {
      await request(app).post("/api/user/register").send(userData);
      const login = await request(app).post("/api/user/login").send(userData);
      accessToken = login.body.accessToken;
    });

    it("✅ should change password", async () => {
      const res = await request(app)
        .put("/api/user/password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          oldPassword: "12345678",
          newPassword: "87654321"
        });

      expect(res.statusCode).toBe(200);
    });

    it("❌ should fail with wrong old password", async () => {
      const res = await request(app)
        .put("/api/user/password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          oldPassword: "wrong",
          newPassword: "87654321"
        });

      expect(res.statusCode).toBe(400);
    });

  });

  describe("DELETE /api/user", () => {

    beforeEach(async () => {
      await request(app).post("/api/user/register").send(userData);
      const login = await request(app).post("/api/user/login").send(userData);
      accessToken = login.body.accessToken;
    });

    it("✅ should delete user (hard)", async () => {
      const res = await request(app)
        .delete("/api/user")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
    });

  });

  describe("PUT /api/user/invite", () => {
    
    beforeEach(async () => {

      const register = await request(app)
        .post("/api/user/register")
        .send(adminData);

      accessToken = register.body.accessToken;

      await request(app)
        .put("/api/user/register")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(userOnboardingData);

      await request(app)
        .patch("/api/user/company")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(companyOnboardingData);

      adminUser = await User.findOne({ email: adminData.email });
    })

    it("✅ should invite a new user", async () => {
      const res = await request(app)
        .put("/api/user/invite")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(guestData);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Usuario Invitado");

      const guest = await User.findOne({ email: guestData.email });

      expect(guest).toBeTruthy();
      expect(guest.company.toString()).toBe(adminUser.company.toString());
      expect(guest.role).toBe("guest");
    });

    it("❌ should fail if user already exists", async () => {

      await User.create({
        email: guestData.email,
        password: "hashed"
      });

      const res = await request(app)
        .put("/api/user/invite")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(guestData);

      expect(res.statusCode).toBe(409);
    });

    it("❌ should fail if admin has no company", async () => {

      const register = await request(app)
        .post("/api/user/register")
        .send({
          email: "no-company@test.com",
          password: "12345678"
        });

      const token = register.body.accessToken;

      const res = await request(app)
        .put("/api/user/invite")
        .set("Authorization", `Bearer ${token}`)
        .send(guestData);

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail with invalid body", async () => {
      const res = await request(app)
        .put("/api/user/invite")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ email: "bademail" });

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail if user is not admin", async () => {

      const register = await request(app)
        .post("/api/user/register")
        .send({
          email: "guest2@test.com",
          password: "12345678"
        });

      const guestToken = register.body.accessToken;

      await request(app)
        .put("/api/user/register")
        .set("Authorization", `Bearer ${guestToken}`)
        .send({
          name: "Guest",
          lastName: "User",
          nif: "87654321B",
          address: {
            street: "Calle B",
            number: "2",
            postal: "28003",
            city: "Madrid",
            province: "Madrid"
          }
        });

      await request(app)
        .patch("/api/user/company")
        .set("Authorization", `Bearer ${guestToken}`)
        .send(companyOnboardingData);

      const res = await request(app)
        .put("/api/user/invite")
        .set("Authorization", `Bearer ${guestToken}`)
        .send({
          email: "otro@test.com",
          password: "12345678"
        });

      expect(res.statusCode).toBe(403);
    });

  })

  describe("PATCH /api/user/logo", () => {

    beforeEach(async () => {
      // Registrar usuario admin
      await request(app).post("/api/user/register").send(adminData);

      const login = await request(app)
        .post("/api/user/login")
        .send(adminData);

      accessToken = login.body.accessToken;

      // Onboarding usuario
      await request(app)
        .put("/api/user/register")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(userOnboardingData);

      // Crear compañía
      await request(app)
        .patch("/api/user/company")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(companyOnboardingData);
    });

    it("✅ should upload company logo", async () => {

      const res = await request(app)
        .patch("/api/user/logo")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("logo", Buffer.from("fake image"), "logo.png");

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("logo");
      expect(res.body.message).toBe("Avatar actualizado");

      const user = await User.findOne({ email: adminData.email });
      const company = await Company.findById(user.company);

      expect(company.logo).toBeTruthy();
    });

    it("❌ should fail without token", async () => {

      const res = await request(app)
        .patch("/api/user/logo")
        .attach("logo", Buffer.from("fake image"), "logo.png");

      expect(res.statusCode).toBe(401);
    });

    it("❌ should fail without file", async () => {

      const res = await request(app)
        .patch("/api/user/logo")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail if user has no company", async () => {

      // Nuevo usuario sin company
      const register = await request(app)
        .post("/api/user/register")
        .send({
          email: "no-company@test.com",
          password: "12345678"
        });

      const token = register.body.accessToken;

      const res = await request(app)
        .patch("/api/user/logo")
        .set("Authorization", `Bearer ${token}`)
        .attach("logo", Buffer.from("fake image"), "logo.png");

      expect(res.statusCode).toBe(400);
    });

    it("❌ should fail if user is not admin", async () => {

      const register = await request(app)
        .post("/api/user/register")
        .send({
          email: "guest2@test.com",
          password: "12345678"
        });

      const guestToken = register.body.accessToken;

      await request(app)
        .put("/api/user/register")
        .set("Authorization", `Bearer ${guestToken}`)
        .send({
          name: "Guest",
          lastName: "User",
          nif: "87654321B",
          address: {
            street: "Calle B",
            number: "2",
            postal: "28003",
            city: "Madrid",
            province: "Madrid"
          }
        });

      await request(app)
        .patch("/api/user/company")
        .set("Authorization", `Bearer ${guestToken}`)
        .send(companyOnboardingData);

      const res = await request(app)
        .patch("/api/user/logo")
        .set("Authorization", `Bearer ${guestToken}`)
        .attach("logo", Buffer.from("fake image"), "logo.png");

      expect(res.statusCode).toBe(403);
    });

  });

});