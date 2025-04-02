'use server'



import { MongoClient } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server'


const uri = process.env.MONGO_URI as string;
const dbName = process.env.DB_NAME as string;

if (!uri) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

if (!dbName) {
  throw new Error('Invalid/Missing environment variable: "DB_NAME"');
}
export async function POST(request:NextRequest){

  let client:MongoClient|null=null;

  const body = await request.json();
  const { type, data } = body;
  console.log('Received type:', type);
  console.log('Received data:', data);
  if (type === 'user.created'){
try { 
    
     client = new MongoClient(uri!);
      // Use non-null assertion to ensure uri is defined 
   
      await client.connect();
      console.log("connected")
      const db = client.db(dbName!); 

      const { id, email_addresses, first_name, last_name, phone } = data;

      const newUser = {
         name: first_name + " " + last_name as string ,

         email: email_addresses[0].email_address as string,

         phone: phone as number,

         userId:id, 

          createdAt: new Date(), 
          updatedAt: new Date() }; 

          console.log("newUser",newUser)

      const users = db.collection('users');

     

      const existingUser = await users.findOne({ email: newUser.email });
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      try {
        const result = await users.insertOne(newUser);
        if (result.acknowledged) { 
         // Perform additional actions if needed
           return NextResponse.json(result);
       } 
       else{
         return NextResponse.json({ error: 'Failed to insert user' }, { status: 500 });
       }
      } catch (error) {
        console.error('Errorm:', error);
        if (error instanceof Error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }

     


}catch (error) { 
  if(error instanceof Error){
    return NextResponse.json({ error: 'Failed to insert user' }, { status: 500 });
  }else{
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
  
   
   }
    finally {
     if (client) {
       await client.close(); 
      } }
    }
}



