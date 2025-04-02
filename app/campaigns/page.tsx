"use client";

import { useEffect, useState } from "react";
import { useCustomerStore } from "../store/customersStore";
import { useUser } from "@clerk/nextjs";
import CustomerModal from "../components/CustomerModal";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { redirect } from "next/navigation";
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
  const [form, setForm] = useState({ title: "", message: "", reward: 50 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const { customers, setCustomers } = useCustomerStore();
  const { user } = useUser();
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateCampaign = async () => {
    if (!form.title || !form.message) {
      toast.error("Please fill in all fields before creating a campaign.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    if (selectedCustomers.length === 0) {
      toast.error("Please add at least one customer to the campaign.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
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
      
      if (!campaignData.insertedId) {
        throw new Error("No campaign ID received");
      }

      // Update campaigns state with the new campaign including its ID
      const campaignWithId = {
        ...newCampaign,
        _id: campaignData.insertedId
      };
      setCampaigns(prev => [...(prev || []), campaignWithId]);
      
      // Reset form and state
      setForm({ title: "", message: "", reward: 50 });
      setError(null);
      setIsModalOpen(false);
      setSelectedCustomers([]);
      setCustomers([]);

      // Send campaign emails with campaign links
      await sendCampaignMessage(campaignWithId, campaignData.insertedId);
      
      // Show success message and redirect
      toast.success("Campaign created and Emails sent successfully to customers!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      // Use setTimeout to ensure the toast is visible before redirect
      setTimeout(() => {
        window.location.href = `/campaign/${campaignData.insertedId}`;
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create campaign. Please try again.");
    }
  };

  useEffect(() => {
    setSelectedCustomers(customers);
  }, [customers]);

  useEffect(() => {
    console.log("Selected customers updated:", selectedCustomers);
  }, [selectedCustomers]);

  const handleModalClose = () => {
    setIsModalOpen(false);
   
   
  };

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
      // Sort campaigns by date, most recent first
      const sortedCampaigns = data.sort((a: Campaign, b: Campaign) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setCampaigns(sortedCampaigns);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      toast.error("Failed to load campaigns. Please try again later.");
    }
  };

  useEffect(() => {
    if (user?.id) {
      hanldeCampaignFetching();
    }
  }, [user?.id]);

  const sendCampaignMessage = async(campaign: Campaign, campaignId: string) => {
    if (selectedCustomers.length === 0) {
      toast.error("No customers to send messages to.");
      return;
    }

    let successfulSends = 0;
    const totalCustomers = selectedCustomers.length;

    for (const customer of selectedCustomers) {
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
        if (result.status === 200) {
          successfulSends++;
          console.log(`Message sent to ${customer.name}`);
        } else {
          console.error(`Failed to send message to ${customer.name}:`, result.error);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }

    // Show a single toast notification based on the results
    if (successfulSends === totalCustomers) {
      toast.success(`Successfully sent campaign emails to all ${totalCustomers} customers!`);
    } else if (successfulSends > 0) {
      toast.warning(`Sent ${successfulSends} out of ${totalCustomers} campaign emails successfully.`);
    } else {
      toast.error("Failed to send any campaign emails. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 ml-[20%] text-black">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
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
        <div className="flex gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Add Customers ({selectedCustomers.length})
          </button>
          <button
            onClick={handleCreateCampaign}
            disabled={selectedCustomers.length === 0}
            className={`px-4 py-2 rounded transition ${
              selectedCustomers.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Create Campaign
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Campaigns List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Previous Campaigns</h2>
        {campaigns?.length > 0 ? (
          <ul className="space-y-4">
            {campaigns?.map((campaign) => (
              <li 
                key={campaign?._id} 
                className="group border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-200 hover:bg-blue-50"
                onClick={() => {
                  if (campaign?._id) {
                    window.location.href = `/campaign/${campaign._id}`;
                  } else {
                    toast.error("Invalid campaign link");
                  }
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                      {campaign.name}
                    </h3>
                    <p className="text-gray-600 mt-1 line-clamp-2">{campaign.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-500">
                        {new Date(campaign.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="text-sm text-blue-500 font-medium">
                        {campaign.rewardPoints} points
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg 
                      className="w-5 h-5 text-blue-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No campaigns created yet.</p>
            <p className="text-gray-400 text-sm mt-2">Create your first campaign to get started!</p>
          </div>
        )}
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}
