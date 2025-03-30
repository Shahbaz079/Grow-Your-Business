"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FaFacebook, FaTwitter, FaWhatsapp, FaCopy, FaCheck, FaEnvelope, FaMagic, FaSync } from "react-icons/fa";
import { use } from "react";

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

interface ReferralStats {
  totalReferrals: number;
  totalReferredUsers: number;
  totalPointsEarned: number;
  referralChain: Array<{
    campaignId: string;
    status: string;
    createdAt: string;
    referredUsers: string[];
  }>;
}

export default function ReferralPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [rewardPoints, setRewardPoints] = useState<any>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<string>("");
  const [generatingMessages, setGeneratingMessages] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [referralRes, statsRes] = await Promise.all([
          fetch(`/api/referral?code=${resolvedParams.code}&userId=${user?.id}`),
          fetch(`/api/referral?stats=true&userId=${user?.id}`)
        ]);

        const referralData = await referralRes.json();
        const statsData = await statsRes.json();

        if (referralData.error) {
          setError(referralData.error);
          return;
        }

        // Get campaign details from the referral data
        const campaignData = await fetch(`/api/campaign?uid=${referralData.campaignId}&type=single`).then(res => res.json());
        
        if (referralData.message === "User already referred") {
          setCampaign(campaignData.name);
          setRewardPoints(campaignData.rewardPoints);
          setStats(statsData);
          return;
        }

        setCampaign(campaignData.name);
        setRewardPoints(campaignData.rewardPoints);
        setStats(statsData);
        console.log(referralData)
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load referral data");
      } finally {
        setLoading(false);
      }
    };

    if (resolvedParams.code && user?.id) {
      fetchData();
    }
  }, [resolvedParams.code, user?.id]);

  const generateMessages = async () => {
    if (!campaign) return;
    
    setGeneratingMessages(true);
    try {
      const response = await fetch("/api/generate-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rewardPoints: rewardPoints,
          campaignName: campaign,
        }),
      });

      const data = await response.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      setAiMessages(data.messages);
      setSelectedMessage(data.messages[0]);
    } catch (error) {
      console.error("Error generating messages:", error);
      setError("Failed to generate messages");
    } finally {
      setGeneratingMessages(false);
    }
  };

  const handleShare = async (platform: string) => {
    const shareUrl = `${window.location.origin}/referral/${resolvedParams.code}`;
    const shareText = selectedMessage + `\n\nUse my referral link to get started:\n${shareUrl}`;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
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
        <h2 className="text-gray-600 text-xl font-semibold">Invalid referral link</h2>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Share & Earn</h1>
          <p className="text-gray-500">Share with friends and earn rewards!</p>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          {/* Points Earned Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Earnings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stats?.totalPointsEarned || 0}</div>
                <div className="text-blue-600 font-medium">Total Points Earned</div>
              </div>
              <div className="bg-green-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats?.totalReferredUsers || 0}</div>
                <div className="text-green-600 font-medium">Friends Referred</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{stats?.totalReferrals || 0}</div>
                <div className="text-purple-600 font-medium">Active Referrals</div>
              </div>
            </div>
          </div>

          {/* Share Message Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Share Message</h2>
              <button
                onClick={generateMessages}
                disabled={generatingMessages}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 disabled:opacity-50"
              >
                {generatingMessages ? (
                  <>
                    <FaSync className="mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FaMagic className="mr-2" />
                    Generate New Messages
                  </>
                )}
              </button>
            </div>

            {aiMessages.length > 0 ? (
              <div className="space-y-4">
                {aiMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedMessage === message
                        ? "bg-blue-50 border-2 border-blue-500"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="whitespace-pre-wrap text-gray-600 font-medium">
                      {message}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <FaEnvelope className="text-blue-500 text-2xl mx-auto mb-4" />
                <p className="text-gray-600">Click the button above to generate AI-powered messages</p>
              </div>
            )}
          </div>

          {/* Share Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Share Options</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleShare('facebook')}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
              >
                <FaFacebook className="mr-2" />
                Share on Facebook
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center px-6 py-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-all duration-200"
              >
                <FaTwitter className="mr-2" />
                Share on Twitter
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200"
              >
                <FaWhatsapp className="mr-2" />
                Share on WhatsApp
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
              >
                <FaCopy className="mr-2" />
                Copy Message
              </button>
            </div>
            {copied && (
              <p className="text-green-500 mt-4 flex items-center">
                <FaCheck className="mr-2" />
                Message copied to clipboard!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 