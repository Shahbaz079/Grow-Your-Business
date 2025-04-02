"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FaFacebook, FaTwitter, FaWhatsapp, FaCopy, FaCheck, FaEnvelope, FaMagic, FaSync, FaShare, FaTelegram } from "react-icons/fa";
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

interface ReferralData {
  referralCode: string;
  campaignName: string;
  rewardPoints: number;
  message?: string;
}

interface GeneratedMessage {
  id: string;
  text: string;
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
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  // Memoize the referral link
  const referralLink = useMemo(() => {
    if (!referralData?.referralCode) return '';
    return `${window.location.origin}/referral/${referralData.referralCode}`;
  }, [referralData?.referralCode]);

  // Memoize the share message
  const shareMessage = useMemo(() => {
    if (!selectedMessage && !referralData) return '';
    return selectedMessage || `Join me in ${referralData?.campaignName} and earn ${referralData?.rewardPoints} points! Use my referral link: ${referralLink}`;
  }, [selectedMessage, referralData, referralLink]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch referral data
        const referralResponse = await fetch(`/api/referral?code=${resolvedParams.code}&userId=${user?.id}`);
        const referralResult = await referralResponse.json();

        if (!referralResponse.ok) {
          throw new Error(referralResult.error || 'Failed to fetch referral data');
        }

        setReferralData(referralResult);

        // Get campaign details from the referral data
        const campaignData = await fetch(`/api/campaign?uid=${referralResult.campaignId}&type=single`).then(res => res.json());
        
        if (referralResult.message === "User already referred") {
          setCampaign(campaignData.name);
          setRewardPoints(campaignData.rewardPoints);
          setStats(referralResult.stats);
          return;
        }

        setCampaign(campaignData.name);
        setRewardPoints(campaignData.rewardPoints);
        setStats(referralResult.stats);
        console.log(referralResult)
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
      setGeneratedMessages(data.messages.map((text: string, index: number) => ({
        id: `msg-${index}`,
        text,
      })));
    } catch (error) {
      console.error("Error generating messages:", error);
      setError("Failed to generate messages");
    } finally {
      setGeneratingMessages(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform: string) => {
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareMessage)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(referralLink)}`,
    };

    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Go Home
        </button>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-lg">
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Share & Earn</h1>
            <p className="text-lg text-blue-100 font-medium">
              Invite friends to <span className="font-bold">{referralData?.campaignName}</span> and earn{' '}
              <span className="font-bold text-yellow-300">{referralData?.rewardPoints} points</span> for each referral!
            </p>
          </div>

          {/* Main Content */}
          <div className="p-8 bg-gray-50">
            {/* Message Selection */}
            <div className="mb-8 bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Choose a Message</h2>
                <button
                  onClick={generateMessages}
                  disabled={generatingMessages}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-lg shadow-md ${
                    generatingMessages
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all'
                  } text-white font-medium`}
                >
                  {generatingMessages ? (
                    <>
                      <FaSync className="animate-spin text-xl" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FaMagic className="text-xl" />
                      <span>Generate New Messages</span>
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-4">
                {generatingMessages ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
                    ))}
                  </div>
                ) : generatedMessages.length > 0 ? (
                  generatedMessages.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => setSelectedMessage(message.text)}
                      className={`w-full p-5 rounded-lg text-left transition-all shadow-sm ${
                        selectedMessage === message.text
                          ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:shadow-md'
                      }`}
                    >
                      <p className="text-gray-800 font-medium leading-relaxed">{message.text}</p>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <FaMagic className="text-4xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No messages generated yet</p>
                    <p className="text-gray-500 mt-2">Click the button above to generate some engaging messages!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Share Section */}
            <div className="space-y-6 bg-white rounded-xl shadow-md p-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Referral Link</h3>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="flex-1 p-3 border border-gray-300 rounded-lg bg-white font-mono text-sm text-gray-700"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    {copySuccess ? <FaCheck className="text-xl" /> : <FaCopy className="text-xl" />}
                  </button>
                </div>
                {copySuccess && (
                  <p className="text-sm text-green-600 mt-2 font-medium">Link copied to clipboard!</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="flex items-center justify-center space-x-3 bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors shadow-md hover:shadow-lg font-medium"
                >
                  <FaWhatsapp className="text-2xl" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => handleShare('telegram')}
                  className="flex items-center justify-center space-x-3 bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg font-medium"
                >
                  <FaTelegram className="text-2xl" />
                  <span>Telegram</span>
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="flex items-center justify-center space-x-3 bg-blue-400 text-white p-4 rounded-lg hover:bg-blue-500 transition-colors shadow-md hover:shadow-lg font-medium"
                >
                  <FaTwitter className="text-2xl" />
                  <span>Twitter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 