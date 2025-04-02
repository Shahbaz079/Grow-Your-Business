import { NextResponse } from 'next/server'
import { MongoClient, ObjectId } from "mongodb";



const uri = process.env.MONGO_URI as string;
const dbName = process.env.DB_NAME;

if (!uri) throw new Error('Invalid/Missing environment variable: "MONGO_URI"');
if (!dbName) throw new Error('Invalid/Missing environment variable: "DB_NAME"');


async function connectToDatabase() {
  const client = new MongoClient(uri);
  await client.connect();
  return client;
}

export async function GET(request: Request) {
  let client: MongoClient | null = null;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    client = await connectToDatabase();
    const db = client.db(dbName);
    const referrals = db.collection("referrals");

    // Get all referrals for the user
    const userReferrals = await referrals.find({ userId:userId }).toArray();

    // Process referrals to get daily counts
    const dailyCounts = new Map<string, number>();
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    // Initialize all dates in the range with 0
    for (let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyCounts.set(dateStr, 0);
    }

    // Count referrals per day
    userReferrals.forEach(referral => {
      const referralDate = new Date(referral.createdAt).toISOString().split('T')[0];
      if (dailyCounts.has(referralDate)) {
        dailyCounts.set(referralDate, dailyCounts.get(referralDate)! + referral.referredUsers.length);
      }
    });

    // Convert to array format for the chart
    const timeSeriesData = Array.from(dailyCounts.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json(timeSeriesData);
  } catch (error) {
    console.error('Error fetching time series data:', error);
    return NextResponse.json({ error: 'Failed to fetch time series data' }, { status: 500 });
  }
} 