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

  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  await mongoose.connect(uri);
};

export const closeDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
};