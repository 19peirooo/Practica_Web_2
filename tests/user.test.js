import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/user.models.js";
import Company from "../src/models/company.models.js"
import RefreshToken from "../src/models/refreshtoken.models.js";
import { userData, adminData, guestData, userOnboardingData, companyOnboardingData, invalidUserData } from "./testData.js";

let accessToken
let refreshToken
let adminUser
let code

describe("User Endpoints", () => {

  beforeEach(async () => {
    await User.deleteMany();
    await RefreshToken.deleteMany();
    await Company.deleteMany();
  });

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
        name: "Empresa Existente",
        cif: "B-99999999",
        address: { street: "X", number: "1", postal: "1", city: "X", province: "X" }
      });

      const res = await request(app)
        .patch("/api/user/company")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Otra Empresa",
          cif: "B-99999999",
          address: {
            street: "X",
            number: "1",
            postal: "1",
            city: "X",
            province: "X"
          },
          isFreelance: false
        });

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
        .send({
          name: "Admin",
          lastName: "User",
          nif: "12345678A",
          address: {
            street: "Calle A",
            number: "1",
            postal: "28001",
            city: "Madrid",
            province: "Madrid"
          }
        });

      await request(app)
        .patch("/api/user/company")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Empresa Admin",
          cif: "B12345678",
          address: {
            street: "Empresa",
            number: "1",
            postal: "28002",
            city: "Madrid",
            province: "Madrid"
          },
          isFreelance: false
        });

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
        .send({
          name: "Empresa Admin",
          cif: "B12345678",
          address: {
            street: "Empresa",
            number: "1",
            postal: "28002",
            city: "Madrid",
            province: "Madrid"
          },
          isFreelance: false
        });

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

});