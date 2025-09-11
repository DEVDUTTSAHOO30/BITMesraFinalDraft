import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get("clerkId");

    if (!clerkId) {
      return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const chats = await Chat.find({ userId: user._id }).sort({ createdAt: 1 });
    return NextResponse.json(chats);
  } catch (err) {
    console.error("GET /chat error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { clerkId, role, content, imageUrl } = body;

    // Validate that EITHER content OR imageUrl exists.
    if (!clerkId || !role || (!content && !imageUrl)) {
      return NextResponse.json(
        { error: "Request must include content or an imageUrl" },
        { status: 400 }
      );
    }

    let user = await User.findOne({ clerkId });
    if (!user) {
      user = await User.create({ clerkId });
    }

    const newChat = await Chat.create({
      userId: user._id,
      role,
      content: content || "", 
      imageUrl: imageUrl || null,
    });

    return NextResponse.json(newChat);
  } catch (err) {
    // This is where your logged error is coming from
    console.error("POST /chat error:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}