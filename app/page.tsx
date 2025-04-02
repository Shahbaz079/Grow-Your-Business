"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { FaUsers, FaChartLine, FaBullhorn,  FaGift } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useUser();
  const [analyticsData, setAnalyticsData] = useState({
    totalCampaigns: 0,
    totalReferrals: 0,
    totalReferredUsers: 0,
    totalPointsEarned: 0,
  });
  const [timeSeriesData, setTimeSeriesData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }[];
  }>({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch campaigns
        const campaignsRes = await fetch(`/api/campaign?uid=${user?.id}&type=all`);
        const campaignsData = await campaignsRes.json();
        
        // Fetch referral stats
        const statsRes = await fetch(`/api/referral?type=stats&userId=${user?.id}`);
        const statsData = await statsRes.json();

        // Fetch time series data
        const timeSeriesRes = await fetch(`/api/referral/time-series?userId=${user?.id}`);
        const timeSeriesData = await timeSeriesRes.json();

        setAnalyticsData({
          totalCampaigns: campaignsData.length || 0,
          totalReferrals: statsData.totalReferrals || 0,
          totalReferredUsers: statsData.totalReferredUsers || 0,
          totalPointsEarned: statsData.totalPointsEarned || 0,
        });

        // Process time series data
        if (timeSeriesData && timeSeriesData.length > 0) {
          const labels = timeSeriesData.map((item: any) => 
            new Date(item.date).toLocaleDateString()
          );
          const datasets = [{
            label: 'Referred Users',
            data: timeSeriesData.map((item: any) => item.count),
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.5)',
            tension: 0.4,
          }];
          setTimeSeriesData({ labels, datasets });
        }

        toast.success('Dashboard data updated successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast.error('Failed to fetch dashboard data. Please try again.', {
          position: "top-right",
          autoClose: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchAnalytics();
    }
  }, [user?.id]);

  const handleCampaignClick = () => {
    toast.info('Redirecting to campaigns page...', {
      position: "top-right",
      autoClose: 2000,
    });
    window.location.href = '/campaigns';
  };

  const handleReferralClick = () => {
    toast.info('Redirecting to customers page...', {
      position: "top-right",
      autoClose: 2000,
    });
    window.location.href = '/customers';
  };

  if (loading) return (
    <div className="ml-[20%] min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <ToastContainer />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Skeleton */}
        <div className="text-center mb-12">
          <div className="h-12 w-48 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 w-64 bg-gray-200 rounded-lg mx-auto animate-pulse"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6">
              <div className="h-8 w-24 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
              <div className="h-12 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Graph Skeleton */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <div className="h-8 w-48 bg-gray-200 rounded-lg mb-6 animate-pulse"></div>
          <div className="h-[300px] bg-gray-100 rounded-lg animate-pulse"></div>
        </div>

        {/* Campaigns Section Skeleton */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="h-8 w-48 bg-gray-200 rounded-lg mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 ml-[20%]">
      <ToastContainer />
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

        {/* Growth Graph Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-700 mb-6">Referral Growth</h2>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="h-[300px]">
              <Line
                data={timeSeriesData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    title: {
                      display: true,
                      text: 'Referred Users Over Time',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
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
              onClick={handleCampaignClick}
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
              onClick={handleReferralClick}
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
