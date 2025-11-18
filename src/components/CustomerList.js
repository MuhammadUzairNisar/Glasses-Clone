import React, { useState, useEffect } from 'react';
import { getCustomers, deleteCustomer } from '../services/customers';

import CustomerDetail from './CustomerDetail';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Fetch all customers
  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const customers = await getCustomers();
      setCustomers(customers);
      setFilteredCustomers(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError(error.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = customers.filter(customer => {
      const nameMatch = customer.customerName?.toLowerCase().includes(term);
      const phoneMatch = customer.phoneNumber?.toLowerCase().includes(term);
      const idMatch = customer.customerId?.toLowerCase().includes(term);
      
      return nameMatch || phoneMatch || idMatch;
    });

    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  // Group customers by phone number
  const groupCustomersByPhone = (customerList) => {
    const groups = {};
    customerList.forEach(customer => {
      const phone = customer.phoneNumber || 'No Phone';
      if (!groups[phone]) {
        groups[phone] = [];
      }
      groups[phone].push(customer);
    });
    return groups;
  };

  const toggleGroup = (phone) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phone)) {
        newSet.delete(phone);
      } else {
        newSet.add(phone);
      }
      return newSet;
    });
  };

  const groupedCustomers = groupCustomersByPhone(filteredCustomers);
  const phoneNumbers = Object.keys(groupedCustomers).sort();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    return parseFloat(amount).toFixed(2);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer record?')) {
      return;
    }

    try {
      await deleteCustomer(customerId);
      // Refresh the list
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert(error.message || 'Failed to delete customer record');
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Customer Records</h2>
          <button 
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={fetchCustomers}
            disabled={loading}
            title="Refresh list"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-lg">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search by name, phone number, or customer ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
          />
          {searchTerm && (
            <button 
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 font-medium">
          <span>Total Records: {customers.length}</span>
          {searchTerm && (
            <span className="text-primary-600">
              Filtered: {filteredCustomers.length}
            </span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm p-12 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading customers...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Customer Records */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 text-lg mb-4">No customer records found</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Clear Filter
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-4">
              {phoneNumbers.map((phone) => {
                const customersInGroup = groupedCustomers[phone];
                const isExpanded = expandedGroups.has(phone);
                const hasMultiple = customersInGroup.length > 1;
                
                return (
                  <div key={phone} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    {hasMultiple ? (
                      <>
                        <div 
                          className="bg-gray-50 hover:bg-gray-100 border-b border-gray-200 px-4 sm:px-6 py-4 cursor-pointer transition-colors"
                          onClick={() => toggleGroup(phone)}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-primary-600 font-bold text-sm">{isExpanded ? '▼' : '▶'}</span>
                              <span className="font-bold text-gray-800 text-base sm:text-lg">{phone}</span>
                              <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                {customersInGroup.length} records
                              </span>
                            </div>
                            <div className="text-sm sm:text-base font-semibold text-primary-600">
                              Total Amount: Rs. {formatCurrency(
                                customersInGroup.reduce((sum, c) => sum + (parseFloat(c.payment?.amount) || 0), 0)
                              )}
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="bg-gray-50 animate-slideDown">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm sm:text-base">
                                <thead className="bg-primary-50 text-primary-700">
                                  <tr>
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Sr</th>
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Name</th>
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Prescription</th>
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Products</th>
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Amount</th>
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Paid</th>
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Remaining</th>
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Date</th>
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {customersInGroup.map((customer, index) => (
                                    <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-3 sm:px-4 py-3 text-gray-700">{index + 1}</td>
                                      <td className="px-3 sm:px-4 py-3 font-semibold text-gray-900">{customer.customerName || 'N/A'}</td>
                                      <td className="px-3 sm:px-4 py-3">
                                        {customer.hasPrescription ? (
                                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Yes</span>
                                        ) : (
                                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">No</span>
                                        )}
                                      </td>
                                      <td className="px-3 sm:px-4 py-3 text-gray-700">{customer.products?.length || 0}</td>
                                      <td className="px-3 sm:px-4 py-3 text-gray-700 font-mono font-semibold">Rs. {formatCurrency(customer.payment?.amount)}</td>
                                      <td className="px-3 sm:px-4 py-3 text-gray-700 font-mono font-semibold">Rs. {formatCurrency(customer.payment?.paid)}</td>
                                      <td className={`px-3 sm:px-4 py-3 font-mono font-semibold ${parseFloat(customer.payment?.remaining || 0) > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                        Rs. {formatCurrency(customer.payment?.remaining)}
                                      </td>
                                      <td className="px-3 sm:px-4 py-3 text-gray-600 text-xs sm:text-sm">{formatDate(customer.createdAt)}</td>
                                      <td className="px-3 sm:px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          <button
                                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-md transition-colors"
                                            onClick={() => setSelectedCustomer(customer)}
                                            title="View details"
                                          >
                                            👁️
                                          </button>
                                          <button
                                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-md transition-colors"
                                            onClick={() => handleDelete(customer._id)}
                                            title="Delete record"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm sm:text-base">
                          <thead className="bg-primary-500 text-white">
                            <tr>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Sr</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Name</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Phone</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Prescription</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Products</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Amount</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Paid</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Remaining</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Date</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {customersInGroup.map((customer, index) => (
                              <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 sm:px-4 py-3 text-gray-700">{index + 1}</td>
                                <td className="px-3 sm:px-4 py-3 font-semibold text-gray-900">{customer.customerName || 'N/A'}</td>
                                <td className="px-3 sm:px-4 py-3 text-gray-700">{customer.phoneNumber || 'N/A'}</td>
                                <td className="px-3 sm:px-4 py-3">
                                  {customer.hasPrescription ? (
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Yes</span>
                                  ) : (
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">No</span>
                                  )}
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-gray-700">{customer.products?.length || 0}</td>
                                <td className="px-3 sm:px-4 py-3 text-gray-700 font-mono font-semibold">Rs. {formatCurrency(customer.payment?.amount)}</td>
                                <td className="px-3 sm:px-4 py-3 text-gray-700 font-mono font-semibold">Rs. {formatCurrency(customer.payment?.paid)}</td>
                                <td className={`px-3 sm:px-4 py-3 font-mono font-semibold ${parseFloat(customer.payment?.remaining || 0) > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                  Rs. {formatCurrency(customer.payment?.remaining)}
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-gray-600 text-xs sm:text-sm">{formatDate(customer.createdAt)}</td>
                                <td className="px-3 sm:px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-md transition-colors"
                                      onClick={() => setSelectedCustomer(customer)}
                                      title="View details"
                                    >
                                      👁️
                                    </button>
                                    <button
                                      className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-md transition-colors"
                                      onClick={() => handleDelete(customer._id)}
                                      title="Delete record"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetail
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};

export default CustomerList;

