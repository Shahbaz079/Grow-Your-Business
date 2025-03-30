import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    client = await connectToDatabase();
    const db = client.db(dbName);
    const referrals = db.collection("referrals");
    const campaigns = db.collection("campaigns");

    // Get all referrals for the user
    const userReferrals = await referrals
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Calculate statistics
    const totalReferrals = userReferrals.length;
    const completedReferrals = userReferrals.filter(r => r.status === 'completed').length;
    const pendingReferrals = totalReferrals - completedReferrals;

    // Calculate total reward points
    let totalRewardPoints = 0;
    for (const referral of userReferrals) {
      const campaign = await campaigns.findOne({ _id: referral.campaignId });
      if (campaign && referral.status === 'completed') {
        totalRewardPoints += campaign.rewardPoints || 0;
      }
    }

    return NextResponse.json({
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalRewardPoints,
      recentReferrals: userReferrals
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
} 