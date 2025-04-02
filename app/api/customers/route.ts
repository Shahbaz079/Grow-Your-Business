import { NextResponse, NextRequest } from "next/server";

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


interface Campaign {
  _id: ObjectId;
  userId: string;
  name: string;
}

interface Referral {
  _id: ObjectId;
  userId: string;
  campaignId: string;
  referredUsers: string[];
  status: string;
  createdAt: Date;
}

interface User {
  _id: ObjectId;
  name?: string;
  email?: string;
}

interface ReferredUser {
  userId: string;
  name: string;
  email: string;
}

interface ReferralChain {
  referralId: ObjectId;
  referrer: {
    userId: string;
    name: string;
    email: string;
  };
  referredUsers: ReferredUser[];
  status: string;
  createdAt: Date;
}

interface CampaignReferralChain {
  campaignId: ObjectId;
  campaignName: string;
  totalReferrals: number;
  totalReferredUsers: number;
  referralChains: ReferralChain[];
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
    const users = db.collection("users");

    const userReferrals = await referrals
    .find({ referredBy: userId })
    .toArray();

  // Get unique referred users across all referrals
  const uniqueReferredUserIds = new Set(
    userReferrals.flatMap((ref) => ref.referredUsers.map((uid: ObjectId) => uid.toString()))
  );

  // Fetch user details for each unique referred user
  const referredUsersDetails = await Promise.all(
    Array.from(uniqueReferredUserIds).map(async (uid) => {
      const user = await users.findOne({ userId:uid });
      return {
        userId: uid,
        name: user?.name || "Unknown User",
        email: user?.email || "No email",
      };
    })
  );

   // Calculate total points earned
  // let totalPointsEarned = 0;
   for (const referral of userReferrals) {
     
       // Count unique users in this referral's referredUsers array
       const uniqueReferredUsers = new Set(referral.referredUsers.map((uid: ObjectId) => uid.toString()));
      
       // Get the campaign for this referral
    
   }

   return NextResponse.json({
    
     referredUsers: referredUsersDetails,
     referralChains: userReferrals.map(referral => ({
       referralId: referral._id,
       campaignId: referral.campaignId,
       status: referral.status,
       createdAt: referral.createdAt,
       referredUsers: referral.referredUsers.map((uid: ObjectId) => 
         referredUsersDetails.find(user => user.userId === uid.toString())
       ).filter(Boolean)
     }))
   });

  } catch (error) {
    console.error("Error fetching referral chains:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral chains" },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
