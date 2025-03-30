"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FaChartLine, FaGift, FaUsers, FaArrowRight } from "react-icons/fa";
import { use } from "react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Campaign {
  _id: string;
  name: string;
  message: string;
  rewardPoints: number;
  createdBy: string;
  createdAt: string;
}

export default function CampaignPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(`/api/campaign?uid=${resolvedParams.id}&type=single`);
        const data = await res.json();
        
        if (data.error) {
          setError(data.error);
          return;
        }
        
        setCampaign(data);
      } catch (error) {
        console.error("Error fetching campaign:", error);
        setError("Failed to load campaign");
      } finally {
        setLoading(false);
      }
    };

    if (resolvedParams.id) {
      fetchCampaign();
    }
  }, [resolvedParams.id]);

  const handleParticipate = async () => {
    if (!user) {
      router.push("/sign-up");
      return;
    }

    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: user.id,
          campaignId: resolvedParams.id,
          referredBy: user.id
        })
      });

      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      router.push(`/referral/${data.referralCode}`);
    } catch (error) {
      console.error("Error creating referral:", error);
      setError("Failed to create referral link");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-red-50 p-6 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-red-600 text-xl font-semibold mb-2">Error</h2>
        <p className="text-red-500">{error}</p>
      </div>
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
        <h2 className="text-gray-600 text-xl font-semibold">Campaign not found</h2>
      </div>
    </div>
  );

  return (
    <div className="ml-[20%] min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{campaign.name}</h1>
          <p className="text-gray-500">Join this campaign and earn rewards!</p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Campaign Details */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Campaign Details</h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign Message</h3>
                <p className="text-gray-600 leading-relaxed">{campaign.message}</p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <FaGift className="text-blue-500 text-2xl mr-3" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-600">Reward Points</h3>
                    <p className="text-3xl font-bold text-blue-700">{campaign.rewardPoints}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <FaUsers className="text-purple-500 text-2xl mr-3" />
                  <div>
                    <h3 className="text-sm font-semibold text-purple-600">Referral Program</h3>
                    <p className="text-gray-600">Share with friends and earn more rewards!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Participation Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Join Campaign</h2>
            <div className="space-y-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <FaChartLine className="text-green-500 text-2xl mr-3" />
                  <div>
                    <h3 className="text-sm font-semibold text-green-600">Your Benefits</h3>
                    <ul className="mt-2 space-y-2 text-gray-600">
                      <li className="flex items-center">
                        <FaArrowRight className="text-green-500 mr-2" />
                        Earn {campaign.rewardPoints} reward points
                      </li>
                      <li className="flex items-center">
                        <FaArrowRight className="text-green-500 mr-2" />
                        Get your unique referral link
                      </li>
                      <li className="flex items-center">
                        <FaArrowRight className="text-green-500 mr-2" />
                        Share with friends and earn more
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handleParticipate}
                className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-[1.02] font-semibold text-lg flex items-center justify-center"
              >
                {user ? (
                  <>
                    Participate Now
                    <FaArrowRight className="ml-2" />
                  </>
                ) : (
                  "Sign Up to Participate"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 