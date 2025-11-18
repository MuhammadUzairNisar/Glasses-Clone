import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/dashboard';

const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    // Update date and time every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const stats = await getDashboardStats();
      setStats(stats);
      setError('');
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    let date;
    if (dateValue.toDate) {
      date = dateValue.toDate();
    } else if (dateValue.seconds) {
      date = new Date(dateValue.seconds * 1000);
    } else {
      date = new Date(dateValue);
    }
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { overview, today, week, month, recentCustomers } = stats;

  const formatDateTime = (date) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-PK', options);
  };

  return (
    <div className="w-full p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600 mb-3">Welcome back! Here's what's happening with your business.</p>
        <div className="flex items-center gap-2 text-sm sm:text-base bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 inline-block">
          <span className="text-primary-600">🕐</span>
          <span className="font-medium text-gray-700">{formatDateTime(currentDateTime)}</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {/* Total Customers */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Customers</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">{overview.totalCustomers}</p>
              <p className="text-xs text-gray-500 mt-1">{overview.uniqueCustomers} unique</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">{formatCurrency(overview.totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Paid</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">{formatCurrency(overview.totalPaid)}</p>
              <p className="text-xs text-gray-500 mt-1">Received</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <span className="text-2xl">💳</span>
            </div>
          </div>
        </div>

        {/* Remaining Amount */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending Amount</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">{formatCurrency(overview.totalRemaining)}</p>
              <p className="text-xs text-gray-500 mt-1">Outstanding</p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {/* Prescriptions */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">With Prescription</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-2">{overview.customersWithPrescription}</p>
            </div>
            <span className="text-2xl">👓</span>
          </div>
        </div>

        {/* Camera */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">With Camera</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-2">{overview.customersWithCamera}</p>
            </div>
            <span className="text-2xl">📷</span>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Products</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-2">{overview.totalProducts}</p>
            </div>
            <span className="text-2xl">🛍️</span>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Today's Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-2">{formatCurrency(today.revenue)}</p>
              <p className="text-xs text-gray-500 mt-1">{today.customers} customers</p>
            </div>
            <span className="text-2xl">📅</span>
          </div>
        </div>
      </div>

      {/* Time Period Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* This Week */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-4 sm:p-6">
          <p className="text-sm text-gray-600 font-medium mb-2">This Week</p>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(week.revenue)}</p>
          <p className="text-sm text-gray-600 mt-1">{week.customers} customers</p>
        </div>

        {/* This Month */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-4 sm:p-6">
          <p className="text-sm text-gray-600 font-medium mb-2">This Month</p>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(month.revenue)}</p>
          <p className="text-sm text-gray-600 mt-1">{month.customers} customers</p>
        </div>

        {/* Average per Customer */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm p-4 sm:p-6">
          <p className="text-sm text-gray-600 font-medium mb-2">Average per Customer</p>
          <p className="text-2xl font-bold text-gray-800">
            {overview.totalCustomers > 0
              ? formatCurrency(overview.totalRevenue / overview.totalCustomers)
              : formatCurrency(0)}
          </p>
          <p className="text-sm text-gray-600 mt-1">Based on total</p>
        </div>
      </div>

      {/* Recent Customers */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Recent Customers</h3>
          <button
            onClick={fetchStats}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            🔄 Refresh
          </button>
        </div>
        {recentCustomers && recentCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCustomers.map((customer, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {customer.customerName || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {customer.phoneNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {formatCurrency(customer.payment?.amount || 0)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {formatDate(customer.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No recent customers found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;

