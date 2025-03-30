import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

// Ensure environment variables are set
const uri = process.env.MONGO_URI as string;
const dbName = process.env.DB_NAME;

if (!uri) throw new Error('Invalid/Missing environment variable: "MONGO_URI"');
if (!dbName) throw new Error('Invalid/Missing environment variable: "DB_NAME"');

// Utility function to establish MongoDB connection
async function connectToDatabase() {
  const client = new MongoClient(uri);
  await client.connect();
  return client;
}

export async function POST(request: NextRequest) {
  let client: MongoClient | null = null;
  try {
    const { name, message, createdBy ,rewardPoints} = await request.json();

    if (!name || !createdBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    client = await connectToDatabase();
    const db = client.db(dbName);
    const campaigns = db.collection("campaigns");


    const newCampaign = {
     
      rewardPoints,
      name,
      message,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await campaigns.insertOne(newCampaign);

    if (result.acknowledged) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: "Failed to create campaign" },
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
    const id = request.nextUrl.searchParams.get("uid");
    const type=request.nextUrl.searchParams.get("type");

   

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    client = await connectToDatabase();
    const db = client.db(dbName);
    const campaigns = db.collection("campaigns");

    if(type==="all"){
      // Find campaigns created by the specified user
      const userCampaigns = await campaigns
      .find({ createdBy:id })
      .toArray();
     
     return NextResponse.json(userCampaigns);
     
         }else{

          //fiad specific campaign

          const userCampaigns = await campaigns.findOne({ _id: new ObjectId(id as string) });

          return NextResponse.json(userCampaigns);

         }



   
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
