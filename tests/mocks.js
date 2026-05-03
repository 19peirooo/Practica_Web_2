import { jest } from "@jest/globals";

export const uploadLogoMock = jest.fn().mockResolvedValue({ secure_url: "https://res.cloudinary.com/test/logo.png" });

export const uploadSignatureMock = jest.fn().mockResolvedValue({ secure_url: "https://res.cloudinary.com/test/signature.png" });

export const uploadPDFMock = jest.fn().mockResolvedValue({ secure_url: "https://res.cloudinary.com/test/albaran.pdf" })

export const setupMock = async () => {

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

  jest.unstable_mockModule("../src/services/cloudinary.service.js", () => ({
        uploadAvatar: uploadLogoMock,
        uploadImage: uploadSignatureMock,
        uploadBuffer: uploadPDFMock,
        default: {
            uploadAvatar: uploadLogoMock,
            uploadImage: uploadSignatureMock,
            uploadBuffer: uploadPDFMock
        }
    }));

}