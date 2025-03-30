"use client";

import { useEffect, useState } from "react";

import { useCustomerStore } from "../store/customersStore";
import {useUser} from "@clerk/nextjs"

export interface Campaign {
  _id?: string;
  name: string;
  message: string;
  rewardPoints: number;
  createdBy: string;
  createdAt: string;
}

interface Customer {
  name: string;
  email: string;
  phone: number;
  address: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState({ title: "", message: "",reward:50 });
 
  const { customers } = useCustomerStore();

  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateCampaign = async () => {
    if (!form.title || !form.message) {
      setError("Please fill in all fields before creating a campaign.");
      return;
    }
    
    const newCampaign: Campaign = {
      name: form.title,
      message: form.message,
      rewardPoints: form.reward,
      createdBy: user?.id as string,
      createdAt: new Date().toLocaleString(),
    };
    
    try {
      // Create campaign
      const campaignRes = await fetch("/api/campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newCampaign)
      });

      if (!campaignRes.ok) throw new Error("Failed to create campaign");
      
      const campaignData = await campaignRes.json();

      // Update campaigns state
      setCampaigns(prev => [...(prev || []), newCampaign]);
      setForm({ title: "", message: "", reward: 50 });
      setError(null);

      // Send campaign emails with campaign links
      await sendCampaignMessage(newCampaign, campaignData.insertedId);
    } catch (err) {
      console.error(err);
      setError("Failed to create campaign. Please try again.");
    }
  };

  const {user}=useUser();

  const hanldeCampaignFetching = async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`/api/campaign?uid=${user.id}&type=all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError("Failed to load campaigns. Please try again later.");
    }
  };

  useEffect(() => {
    if (user?.id) {
      hanldeCampaignFetching();
    }
  }, [user?.id]);

  const sendCampaignMessage = async(campaign: Campaign, campaignId: string) => {
    if (customers.length === 0) {
      alert("No customers to send messages to.");
      return;
    }

    for (const customer of customers) {
      const campaignLink = `${process.env.NEXT_PUBLIC_APP_URL}/campaign/${campaignId}`;
      const message = `Hello ${customer.name}, check out our new campaign: ${campaign.name}\n\n${campaign.message}\n\nJoin now using this link: ${campaignLink}`;
      try {
        const response = await fetch("/api/sendMessage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            to: customer.email,
            subject: `New Campaign: ${campaign.name}`,
            text: message 
          }),
        });

        const result = await response.json();
        if (result.success) {
          console.log(`Message sent to ${customer.name}`);
        } else {
          console.error(`Failed to send message to ${customer.name}:`, result.error);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 ml-[20%] text-black">
      <h1 className="text-3xl font-bold mb-6">Campaigns</h1>
      
      {/* Campaign Form */}
      <div className="p-6 bg-white rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Create a Campaign</h2>
        <input
          type="text"
          name="title"
          placeholder="Campaign Title"
          value={form.title}
          onChange={handleChange}
          className="p-2 mb-2 border rounded w-full"
        />
         <input
          type="number"
          name="reward"
          placeholder="Reward Points"
          value={form.reward}
          onChange={handleChange}
          className="p-2 mb-2 border rounded w-full"
        />
        <textarea
          name="message"
          placeholder="Campaign Message"
          value={form.message}
          onChange={handleChange}
          className="p-2 mb-2 border rounded w-full"
        ></textarea>
        <button
          onClick={handleCreateCampaign}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Create Campaign
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Campaigns List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Previous Campaigns</h2>
        {campaigns?.length > 0 ? (
          <ul>
            {campaigns?.map((campaign) => (
              <li key={campaign._id} className="border-b py-3">
                <h3 className="font-bold">{campaign.name}</h3>
                <p>{campaign.message}</p>
                <small className="text-gray-500">{campaign.createdAt}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No campaigns created yet.</p>
        )}
      </div>
    </div>
  );
}
