"use client";

import DashboardNav from "@/components/DashboardNav";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { FaUsers, FaChartLine, FaBullhorn, FaCheckCircle, FaGift } from "react-icons/fa";

const Dashboard = () => {
  const { user } = useUser();
  const [analyticsData, setAnalyticsData] = useState({
    totalCampaigns: 0,
    totalReferrals: 0,
    totalReferredUsers: 0,
    totalPointsEarned: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch campaigns
        const campaignsRes = await fetch(`/api/campaign?uid=${user?.id}&type=all`);
        const campaignsData = await campaignsRes.json();
        
        // Fetch referral stats
        const statsRes = await fetch(`/api/referral?stats=true&userId=${user?.id}`);
        const statsData = await statsRes.json();

        setAnalyticsData({
          totalCampaigns: campaignsData.length || 0,
          totalReferrals: statsData.totalReferrals || 0,
          totalReferredUsers: statsData.totalReferredUsers || 0,
          totalPointsEarned: statsData.totalPointsEarned || 0,
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchAnalytics();
    }
  }, [user?.id]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-50 ml-[20%]">
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-10">Dashboard</h1>

        {/* Analytics Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-700 mb-6">Your Analytics</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {/* Campaigns Card */}
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <FaBullhorn className="text-blue-500 text-2xl mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Total Campaigns</h3>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{analyticsData.totalCampaigns}</p>
                </div>
              </div>
            </div>

            {/* Referrals Card */}
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <FaChartLine className="text-green-500 text-2xl mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Total Referrals</h3>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{analyticsData.totalReferrals}</p>
                </div>
              </div>
            </div>

            {/* Referred Users Card */}
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <FaUsers className="text-purple-500 text-2xl mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Referred Users</h3>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{analyticsData.totalReferredUsers}</p>
                </div>
              </div>
            </div>

            {/* Points Earned Card */}
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <FaGift className="text-yellow-500 text-2xl mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Points Earned</h3>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{analyticsData.totalPointsEarned}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Campaign Management Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-700 mb-6">Campaign Management</h2>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 className="text-md font-semibold text-gray-600 mb-2">Create and Manage Campaigns</h3>
            <p className="text-gray-500 mb-4">
              Set up referral campaigns and track their performance.
            </p>
            <button 
              onClick={() => window.location.href = '/campaigns'}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-5 py-2 rounded-lg"
            >
              Manage Campaigns
            </button>
          </div>
        </section>

        {/* Referral Tracking Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-700 mb-6">Referral Tracking</h2>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 className="text-md font-semibold text-gray-600 mb-2">Track Your Referrals</h3>
            <p className="text-gray-500 mb-4">
              Monitor your referral chain and reward points.
            </p>
            <button 
              onClick={() => window.location.href = '/referral-dashboard'}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-5 py-2 rounded-lg"
            >
              View Referral Dashboard
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
