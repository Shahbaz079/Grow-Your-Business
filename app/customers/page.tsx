"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ReferredUser {
  userId: string;
  name: string;
  email: string;
}

interface ReferralChain {
  referralId: string;
  campaignId: string;
  status: string;
  createdAt: string;
  referredUsers: ReferredUser[];
}

interface ReferralData {
  referredUsers: ReferredUser[];
  referralChains: ReferralChain[];
}

export default function CustomersPage() {
  const { userId } = useAuth();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        if (!userId) return;
        
        const response = await fetch(`/api/customers?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch referral data');
        
        const data = await response.json();
        setReferralData(data);
      } catch (error) {
        console.error('Error fetching referral data:', error);
        toast.error('Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [userId]);

  if (loading) {
    return (
      <div className="ml-[20%] min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 p-8 font-sans">
        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-[20%] min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 p-8 font-sans">
      <ToastContainer />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-800 text-center mb-6">Referral Chains</h1>
        
        {referralData?.referralChains.map((chain) => (
          <div key={chain.referralId} className="bg-white shadow-xl rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Referral Chain</h2>
                <p className="text-sm text-gray-600">
                  Campaign ID: {chain.campaignId}
                </p>
                <p className="text-sm text-gray-600">
                  Status: <span className={`px-2 py-1 rounded-full text-xs ${
                    chain.status === 'active' ? 'bg-green-100 text-green-800' : 
                    chain.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {chain.status}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Created: {new Date(chain.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {chain.referredUsers.length} Referred Users
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded-lg">
                <thead>
                  <tr className="bg-blue-500 text-white uppercase text-sm">
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-6">Email</th>
                    <th className="py-3 px-6">User ID</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {chain.referredUsers.map((user, index) => (
                    <tr key={index} className="border-b hover:bg-gray-100">
                      <td className="py-3 px-6">{user.name}</td>
                      <td className="py-3 px-6">{user.email}</td>
                      <td className="py-3 px-6">{user.userId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {(!referralData?.referralChains || referralData.referralChains.length === 0) && (
          <div className="bg-white shadow-xl rounded-lg p-6 text-center">
            <p className="text-gray-600 text-lg">No referral chains found.</p>
            <p className="text-gray-500 text-sm mt-2">Start creating campaigns to build your referral network.</p>
          </div>
        )}
      </div>
    </div>
  );
}
