import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI_2;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!userId || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Ensure the end date is not before the start date
    if (end < start) {
        return NextResponse.json(
            { error: "End date cannot be earlier than start date" },
            { status: 400 }
        );
    }

    // --- FIX START ---
    // Calculate the difference in days instead of months
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Allow a range of up to 31 days
    if (diffDays > 31) {
      return NextResponse.json(
        { error: "Date range cannot exceed 31 days" },
        { status: 400 }
      );
    }
    // --- FIX END ---

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("expense_db");
    const collection = db.collection("expenses");

    // Fetch user’s expenses within range
    const expenses = await collection
      .find({
        user_id: userId,
        date: {
          $gte: start.toISOString().slice(0, 10),
          $lte: end.toISOString().slice(0, 10),
        },
      })
      .toArray();

    await client.close();

    if (expenses.length === 0) {
      return NextResponse.json({
        message: "No spending in this period",
        categoryBreakdown: {},
        dailySpending: {},
      });
    }

    // Category breakdown
    const categoryMap = {};
    expenses.forEach((exp) => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });

    // Daily spending (fill empty days with 0)
    const dailyMap = {};
    let current = new Date(start);
    // Adjust for timezone issues by working with UTC dates
    current.setUTCHours(0, 0, 0, 0); 
    let adjustedEnd = new Date(end);
    adjustedEnd.setUTCHours(0,0,0,0);

    while (current <= adjustedEnd) {
      const key = current.toISOString().slice(0, 10);
      dailyMap[key] = 0;
      current.setDate(current.getDate() + 1);
    }
    expenses.forEach((exp) => {
      dailyMap[exp.date] = (dailyMap[exp.date] || 0) + exp.amount;
    });


    return NextResponse.json({
      categoryBreakdown: categoryMap,
      dailySpending: dailyMap,
    });
  } catch (err) {
    console.error("Error fetching expenses:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}