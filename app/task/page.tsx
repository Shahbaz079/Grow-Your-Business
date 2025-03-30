"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Campaign } from "../campaigns/page";

export default function TaskPage() {
  const searchParams=useSearchParams()
  const taskId=searchParams.get("tid")
   // Replace with dynamic ID

   const [campaign, setCampaign] = useState<Campaign>();
  


  const [generatedMessage, setGeneratedMessage] = useState("");


  const fetchCampaign = async (taskId: string) => {
    // Replace with actual API call
    const response = await fetch(`/api/campaign?id=${taskId}&type=one`,{
      method:"GET",
      headers:{
        "Content-Type":"application/json"
      }
    });
    const data = await response.json();
    setCampaign(data);
  }

  useEffect(() => {
    if(taskId)
    fetchCampaign(taskId);
  }, [taskId]);





  useEffect(() => {
    if (campaign) {
      generateChatbotMessage(campaign.message);
    }
  }, [campaign]);

  // Simulating AI-generated message (replace with real chatbot API)
  const generateChatbotMessage = (baseMessage: string) => {
    setGeneratedMessage(`${baseMessage} 🎉 Join me and earn rewards!`);
  };

  const handleShare = async () => {
    if (!campaign) return;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(generatedMessage)}`;
    window.open(whatsappUrl, "_blank");

  
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">📌 Task Details</h1>

        {campaign ? (
          <>
            <p className="text-gray-700 mb-2">
              <strong>Reward Points:</strong> {campaign.reward}
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Message:</strong> {generatedMessage}
            </p>
            

            <button
              onClick={handleShare}
              className="bg-green-500 text-white px-4 py-2 rounded-lg w-full hover:bg-green-600 transition"
            >
              📲 Share on WhatsApp
            </button>
          </>
        ) : (
          <p className="text-gray-500">Loading task...</p>
        )}
      </div>
    </div>
  );
}
