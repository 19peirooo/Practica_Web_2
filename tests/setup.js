import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { jest } from "@jest/globals";

process.env.JWT_SECRET = "testsecret";

let mongo;

export const ioMock = {
  to: jest.fn(() => ({
    emit: jest.fn()
  }))
};

export const connectDB = async () => {
  
  await jest.unstable_mockModule("../src/services/cloudinary.service.js", () => ({
  default: {
    uploadBuffer: jest.fn().mockResolvedValue({
      secure_url: "https://fake-cloudinary.com/fake.pdf",
    }),
    uploadImage: jest.fn().mockResolvedValue({
      secure_url: "https://fake-cloudinary.com/signature.png",
    }),
    uploadAvatar: jest.fn().mockResolvedValue({
      secure_url: "https://fake-cloudinary.com/logo.png",
    }),
  }
}));

  await jest.unstable_mockModule("../src/services/mail.service.js", () => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
  }));

  await jest.unstable_mockModule("../src/utils/handleLogger.js", () => ({
    sendSlackNotification: jest.fn().mockResolvedValue(true),
    loggerStream: { write: jest.fn() },
  }));

  await jest.unstable_mockModule("../src/utils/handlePDF.js", () => ({
    generatePdf: jest.fn().mockResolvedValue(
      Buffer.from("fake pdf")
    ),
    generateSignedPdf: jest.fn().mockResolvedValue(
      Buffer.from("fake signed pdf")
    ),
  }));

  await jest.unstable_mockModule("axios", () => ({
  default: {
    get: jest.fn().mockResolvedValue({
      data: Buffer.from("fake downloaded pdf"),
    }),
  },
}));

  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  await mongoose.connect(uri);
};

export const closeDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
};