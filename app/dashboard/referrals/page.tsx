"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { FaShareAlt, FaUsers, FaGift } from "react-icons/fa";

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardPoints: number;
  recentReferrals: Array<{
    _id: string;
    referralCode: string;
    status: string;
    createdAt: string;
    referredUsers: string[];
  }>;
}

export default function ReferralDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/referral/stats?userId=${user?.id}`);
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchStats();
    }
  }, [user?.id]);

  const handleShare = async (code: string) => {
    const shareUrl = `${window.location.origin}/referral/${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our referral program!',
          text: 'Check out this amazing opportunity!',
          url: shareUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard copy
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No referral data found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 ml-[20%]">
      <h1 className="text-3xl font-bold mb-8">Referral Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <FaUsers className="text-3xl text-blue-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold">Total Referrals</h3>
              <p className="text-3xl font-bold">{stats.totalReferrals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <FaGift className="text-3xl text-green-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold">Reward Points</h3>
              <p className="text-3xl font-bold">{stats.totalRewardPoints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <FaUsers className="text-3xl text-yellow-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold">Pending Referrals</h3>
              <p className="text-3xl font-bold">{stats.pendingReferrals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Referrals Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Referrals</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Referral Code</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Referred Users</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentReferrals.map((referral) => (
                <tr key={referral._id} className="border-b">
                  <td className="py-2">{referral.referralCode}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      referral.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {referral.status}
                    </span>
                  </td>
                  <td className="py-2">{new Date(referral.createdAt).toLocaleDateString()}</td>
                  <td className="py-2">{referral.referredUsers.length}</td>
                  <td className="py-2">
                    <button
                      onClick={() => handleShare(referral.referralCode)}
                      className="flex items-center text-blue-500 hover:text-blue-600"
                    >
                      <FaShareAlt className="mr-2" />
                      Share
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 