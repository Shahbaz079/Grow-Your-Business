import { NextRequest, NextResponse } from "next/server";

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

export async function POST(request: NextRequest) {
  try {
    const { rewardPoints, campaignName } = await request.json();

    if (!rewardPoints || !campaignName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = `You are a friendly copywriter. Generate 3 different engaging messages to share with friends about a referral program. The program offers ${rewardPoints} reward points and is called "${campaignName}".

Requirements for each message:
- Short and concise
- Include emojis
- Highlight the reward points
- Be friendly and personal
- Include a call to action

Generate exactly 3 messages, one per line.`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const result = await response.json();
    const generatedText = result[0].generated_text;
    
    // Extract messages from the generated text
    const messages = generatedText
      .split('\n')
      .filter((line: string) => line.trim().length > 0 && !line.includes('```') && !line.includes('{') && !line.includes('['))
      .slice(0, 3); // Take only the first 3 messages

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("Error generating messages:", error);
    return NextResponse.json(
      { error: "Failed to generate messages" },
      { status: 500 }
    );
  }
} 