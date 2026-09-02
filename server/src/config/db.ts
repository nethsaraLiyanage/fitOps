import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb(uri: string = env.MONGODB_URI) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
