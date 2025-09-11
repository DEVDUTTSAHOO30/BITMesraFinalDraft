// app/api/profile/route.js

import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const MONGO_URI = process.env.MONGO_URI_2;

if (!MONGO_URI) {
    throw new Error("❌ MONGO_URI not found in .env");
}

let client;
let user_profiles_collection;

// Helper to connect to MongoDB and cache the connection
async function connectToDatabase() {
    if (client && client.topology && client.topology.isConnected()) {
        return;
    }
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db("expense_db");
    user_profiles_collection = db.collection("user_profiles");
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get("clerkId");

    if (!clerkId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    try {
        await connectToDatabase();

        const profile = await user_profiles_collection.findOne({ user_id: clerkId });

        if (!profile) {
            // It's okay if a user doesn't have a profile yet, return an empty object
            return NextResponse.json({}, { status: 200 });
        }

        // Return the found profile data
        return NextResponse.json(
            {
                monthly_salary: profile.monthly_salary,
                last_updated: profile.last_updated,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Failed to fetch user profile:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}