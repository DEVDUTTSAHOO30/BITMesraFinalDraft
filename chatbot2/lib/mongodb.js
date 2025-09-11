import { connect } from "mongoose";

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    const db = await connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = db.connections[0].readyState;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

export default connectDB;
