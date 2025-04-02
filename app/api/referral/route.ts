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

export async function POST(request: NextRequest) {
  let client: MongoClient | null = null;
  try {
    const { userId, campaignId, referredBy } = await request.json();

    if (!userId || !campaignId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    client = await connectToDatabase();
    const db = client.db(dbName);
    const referrals = db.collection("referrals");
    const users = db.collection("users");

    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newReferral = {
      userId: userId,
      campaignId: new ObjectId(campaignId as string),
      referralCode,
      createdAt: new Date(),
      status: 'pending',
      referredUsers: [],
      referredBy: referredBy || null,
      referralChain: referredBy ? [referredBy] : []
    };

    const result = await referrals.insertOne(newReferral);

    if (result.acknowledged) {
      return NextResponse.json({ 
        referralCode,
        referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/referral/${referralCode}`
      });
    } else {
      return NextResponse.json(
        { error: "Failed to create referral" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}

export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  try {
    const code = request.nextUrl.searchParams.get("code");
    const userId = request.nextUrl.searchParams.get("userId");
    const type = request.nextUrl.searchParams.get("type");

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

    if (type === "stats") {
      // Get all referrals for the user
      const userReferrals = await referrals
        .find({ referredBy: userId })
        .toArray();

      // Get unique referred users across all referrals
      const uniqueReferredUsers = new Set(
        userReferrals.flatMap((ref) => ref.referredUsers.map((uid: ObjectId) => uid.toString()))
      );

      // Calculate total points earned
      let totalPointsEarned = 0;
      for (const referral of userReferrals) {
        const campaign = await campaigns.findOne({ _id: new ObjectId(referral.campaignId as string) });
        if (campaign) {
          // Count unique users in this referral's referredUsers array
          const uniqueReferredUsers = new Set(referral.referredUsers.map((uid: ObjectId) => uid.toString()));
          totalPointsEarned += campaign.rewardPoints * uniqueReferredUsers.size;
        }
      }

      return NextResponse.json({
        totalReferrals: userReferrals.length,
        totalReferredUsers: uniqueReferredUsers.size,
        totalPointsEarned,
        referralChain: userReferrals.map((ref) => ({
          campaignId: ref.campaignId,
          status: ref.status,
          createdAt: ref.createdAt,
          referredUsers: ref.referredUsers.map((uid: ObjectId) => uid.toString()),
        })),
      });
    }

    if (!code) {
      return NextResponse.json(
        { error: "Referral code is required" },
        { status: 400 }
      );
    }

    const referral = await referrals.findOne({ referralCode: code });
     if (!referral) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      );
    }

    const campaign = await campaigns.findOne({ _id: new ObjectId (referral?.campaignId as string) });

   

    // Check if user is already in referredUsers array
    if (referral.referredUsers?.includes(userId)) {
      return NextResponse.json({ 
            ...referral,
        message: "User already referred" 
      });
    }

    // Get the referral chain from the referrer
    const referrerChain = referral.referralChain || [];
    const updatedChain = [...referrerChain, referral.userId];

    // Update referral with new user
    await referrals.updateOne(
      { referralCode: code },
      { 
        $set: { 
          referredUsers: [...(referral.referredUsers || []), userId],
          status: 'completed',
          referralChain: updatedChain
        } as any
      }
    );

    const data={
      ...referral,
      campaignName: campaign?.name,
      rewardPoints: campaign?.rewardPoints,
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}

export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null;
  try {
    const code = request.nextUrl.searchParams.get("code");
    const userId = request.nextUrl.searchParams.get("userId");

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Referral code and user id is required" },
        { status: 400 }
      );
    }

    client = await connectToDatabase();
    const db = client.db(dbName);
    const referrals = db.collection("referrals");
    const users = db.collection("users");

    const referral = await referrals.findOne({ referralCode: code });

    if (!referral) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      );
    }

    // Check if user is already in referredUsers array
    if (referral.referredUsers?.includes(userId)) {
      return NextResponse.json(
        { error: "User already referred" },
        { status: 400 }
      );
    }

    // Get the referral chain from the referrer
    const referrerChain = referral.referralChain || [];
    const updatedChain = [...referrerChain, referral.userId];

    // Update referral with new user
    await referrals.updateOne(
      { referralCode: code },
      { 
        $set: { 
          referredUsers: [...(referral.referredUsers || []), userId],
          status: 'completed',
          referralChain: updatedChain
        } as any
      }
    );

    return NextResponse.json({ message: "User successfully added to referrals" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
} 