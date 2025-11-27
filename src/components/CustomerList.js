import React, { useState, useEffect } from 'react';
import { getCustomers, deleteCustomer, updateCustomer, getCustomerById } from '../services/customers';

import CustomerDetail from './CustomerDetail';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState('');
  const [familyMemberFilter, setFamilyMemberFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUpdate, setPaymentUpdate] = useState({ paid: '', remaining: '' });
  const [updating, setUpdating] = useState(false);

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

  // Get unique phone numbers that match the search
  const getMatchingPhoneNumbers = () => {
    if (!phoneSearch.trim()) {
      return [];
    }
    const phone = phoneSearch.trim();
    const matchingCustomers = customers.filter(customer => 
      customer.phoneNumber && customer.phoneNumber.includes(phone)
    );
    const uniquePhones = [...new Set(matchingCustomers.map(c => c.phoneNumber))];
    return uniquePhones.sort();
  };

  // Get unique family members for selected phone number
  const getFamilyMembersForPhone = () => {
    if (!selectedPhoneNumber) {
      return [];
    }
    const phoneCustomers = customers.filter(customer => 
      customer.phoneNumber === selectedPhoneNumber
    );
    const familyMembers = phoneCustomers
      .filter(c => c.familyMember && c.familyMember.trim() !== '')
      .map(c => ({
        name: c.familyMember,
        relation: c.familyMemberRelation || '',
        fullDisplay: c.familyMember + (c.familyMemberRelation ? ` (${c.familyMemberRelation})` : '')
      }));
    // Remove duplicates
    const unique = Array.from(
      new Map(familyMembers.map(item => [item.fullDisplay, item])).values()
    );
    return unique.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Filter customers based on search term, selected phone number, and family member
  useEffect(() => {
    let filtered = [...customers];

    // Filter by general search term (name, customer ID) - only if no phone/family filter
    if (searchTerm.trim() && !selectedPhoneNumber) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(customer => {
        const nameMatch = customer.customerName?.toLowerCase().includes(term);
        const idMatch = customer.customerId?.toLowerCase().includes(term);
        return nameMatch || idMatch;
      });
    }

    // Filter by selected phone number (primary filter)
    if (selectedPhoneNumber) {
      filtered = filtered.filter(customer => 
        customer.phoneNumber === selectedPhoneNumber
      );

      // Filter by family member (secondary filter - only if phone is selected)
      if (familyMemberFilter.trim()) {
        const filterLower = familyMemberFilter.toLowerCase().trim();
        filtered = filtered.filter(customer => {
          const memberMatch = customer.familyMember?.toLowerCase().includes(filterLower);
          const relationMatch = customer.familyMemberRelation?.toLowerCase().includes(filterLower);
          return memberMatch || relationMatch;
        });
      }
    }

    setFilteredCustomers(filtered);
  }, [searchTerm, selectedPhoneNumber, familyMemberFilter, customers]);

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

  // Group customers by phone number
  const groupedCustomers = groupCustomersByPhone(filteredCustomers);
  const phoneNumbers = Object.keys(groupedCustomers).sort();

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

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const expandAll = () => {
    const allPhones = new Set(phoneNumbers);
    setExpandedGroups(allPhones);
  };

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = phoneNumbers.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(phoneNumbers.length / recordsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [phoneNumbers.length, selectedPhoneNumber, familyMemberFilter, searchTerm]);

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    // Handle Firestore Timestamp objects
    let date;
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      // Firestore Timestamp with toDate() method
      date = dateValue.toDate();
    } else if (dateValue.seconds) {
      // Firestore Timestamp with seconds property
      date = new Date(dateValue.seconds * 1000);
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      // Regular date string or timestamp
      date = new Date(dateValue);
    } else {
      return 'N/A';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-IN', {
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

  const calculateTotal = (products) => {
    if (!products || !Array.isArray(products)) {
      return 0;
    }
    return products.reduce((sum, product) => {
      return sum + (parseFloat(product.total) || 0);
    }, 0);
  };

  const handleUpdatePayment = (customer) => {
    setSelectedCustomer(customer);
    setPaymentUpdate({
      paid: customer.payment?.paid || 0,
      remaining: customer.payment?.remaining || 0
    });
    setShowPaymentModal(true);
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
          <div className="flex flex-wrap gap-2">
            {phoneNumbers.length > 0 && (
              <>
                <button 
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  onClick={collapseAll}
                  title="Collapse all groups"
                >
                  <span>📁</span>
                  <span>Collapse All</span>
                </button>
                <button 
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  onClick={expandAll}
                  title="Expand all groups"
                >
                  <span>📂</span>
                  <span>Expand All</span>
                </button>
              </>
            )}
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
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* General Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search by name or customer ID..."
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

          {/* Phone Number Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">📞</span>
            </div>
            <input
              type="tel"
              placeholder="Search by phone number..."
              value={phoneSearch}
              onChange={(e) => {
                const phone = e.target.value.replace(/\D/g, '').slice(0, 11);
                setPhoneSearch(phone);
                // Clear selected phone and family member filter when search changes
                if (phone !== phoneSearch) {
                  setSelectedPhoneNumber('');
                  setFamilyMemberFilter('');
                }
              }}
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
            />
            {phoneSearch && (
              <button 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setPhoneSearch('');
                  setSelectedPhoneNumber('');
                  setFamilyMemberFilter('');
                }}
                title="Clear phone search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Phone Number Selection - Show matching phone numbers */}
        {phoneSearch.trim() && !selectedPhoneNumber && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Phone Number:
            </label>
            <div className="flex flex-wrap gap-2">
              {getMatchingPhoneNumbers().length > 0 ? (
                getMatchingPhoneNumbers().map((phone) => (
                  <button
                    key={phone}
                    onClick={() => {
                      setSelectedPhoneNumber(phone);
                      setFamilyMemberFilter('');
                    }}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {phone}
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">No matching phone numbers found</p>
              )}
            </div>
          </div>
        )}

        {/* Selected Phone Number Display and Family Member Filter */}
        {selectedPhoneNumber && (
          <div className="mb-4 space-y-3 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selected Phone Number:
                </label>
                <span className="text-lg font-semibold text-primary-700">{selectedPhoneNumber}</span>
                <span className="ml-3 text-sm text-gray-600">
                  ({filteredCustomers.length} {filteredCustomers.length === 1 ? 'record' : 'records'})
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedPhoneNumber('');
                  setFamilyMemberFilter('');
                }}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Change Phone
              </button>
            </div>

            {/* Family Member Quick Select Buttons */}
            {getFamilyMembersForPhone().length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Select Family Member:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFamilyMemberFilter('')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      !familyMemberFilter
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All ({customers.filter(c => c.phoneNumber === selectedPhoneNumber).length})
                  </button>
                  {getFamilyMembersForPhone().map((member, index) => (
                    <button
                      key={index}
                      onClick={() => setFamilyMemberFilter(member.name)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        familyMemberFilter.toLowerCase() === member.name.toLowerCase()
                          ? 'bg-primary-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {member.fullDisplay}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Family Member Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Family Member Name or Relation:
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Enter family member name or relation..."
                  value={familyMemberFilter}
                  onChange={(e) => setFamilyMemberFilter(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
                {familyMemberFilter && (
                  <button
                    onClick={() => setFamilyMemberFilter('')}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 font-medium">
          <span>Total Records: {customers.length}</span>
          {(searchTerm || selectedPhoneNumber || familyMemberFilter) && (
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
              {currentRecords.map((phone) => {
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
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Family Member</th>
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Doctor</th>
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
                                      <td className="px-3 sm:px-4 py-3 text-gray-600 text-xs sm:text-sm">
                                        {customer.familyMember ? (
                                          <span>
                                            {customer.familyMember}
                                            {customer.familyMemberRelation && (
                                              <span className="text-gray-500"> ({customer.familyMemberRelation})</span>
                                            )}
                                          </span>
                                        ) : 'N/A'}
                                      </td>
                                      <td className="px-3 sm:px-4 py-3 text-gray-700 text-xs sm:text-sm">
                                        {customer.doctorName || 'N/A'}
                                      </td>
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
                                        <div className="flex items-center gap-2">
                                          <span>Rs. {formatCurrency(customer.payment?.remaining)}</span>
                                          <button
                                            onClick={() => handleUpdatePayment(customer)}
                                            className="p-1 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded transition-colors"
                                            title="Update payment"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                          </button>
                                        </div>
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
                              <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Family Member</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold uppercase">Doctor</th>
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
                                <td className="px-3 sm:px-4 py-3 text-gray-600 text-xs sm:text-sm">
                                  {customer.familyMember ? (
                                    <span>
                                      {customer.familyMember}
                                      {customer.familyMemberRelation && (
                                        <span className="text-gray-500"> ({customer.familyMemberRelation})</span>
                                      )}
                                    </span>
                                  ) : 'N/A'}
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-gray-700 text-xs sm:text-sm">
                                  {customer.doctorName || 'N/A'}
                                </td>
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
                                  <div className="flex items-center gap-2">
                                    <span>Rs. {formatCurrency(customer.payment?.remaining)}</span>
                                    <button
                                      onClick={() => handleUpdatePayment(customer)}
                                      className="p-1 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded transition-colors"
                                      title="Update payment"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                  </div>
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

          {/* Pagination */}
          {phoneNumbers.length > recordsPerPage && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{indexOfFirstRecord + 1}</span> to{' '}
                <span className="font-semibold">
                  {Math.min(indexOfLastRecord, phoneNumbers.length)}
                </span>{' '}
                of <span className="font-semibold">{phoneNumbers.length}</span> phone numbers
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-primary-500 text-white border-primary-500'
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Update Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setShowPaymentModal(false);
          setError('');
        }}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Update Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setError('');
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={selectedCustomer.customerName || 'N/A'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount
                </label>
                <input
                  type="text"
                  value={`Rs. ${formatCurrency(selectedCustomer.payment?.amount || calculateTotal(selectedCustomer.products))}`}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={paymentUpdate.paid}
                  onChange={(e) => {
                    const paid = parseFloat(e.target.value) || 0;
                    const total = parseFloat(selectedCustomer.payment?.amount || calculateTotal(selectedCustomer.products)) || 0;
                    const remaining = Math.max(0, total - paid);
                    setPaymentUpdate({
                      paid: paid,
                      remaining: remaining
                    });
                  }}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter paid amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remaining Amount
                </label>
                <input
                  type="text"
                  value={`Rs. ${formatCurrency(paymentUpdate.remaining)}`}
                  readOnly
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 ${
                    paymentUpdate.remaining > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'
                  }`}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!selectedCustomer._id) {
                      setError('Customer ID not found');
                      return;
                    }

                    setUpdating(true);
                    setError('');
                    try {
                      const total = parseFloat(selectedCustomer.payment?.amount || calculateTotal(selectedCustomer.products)) || 0;
                      const paid = parseFloat(paymentUpdate.paid) || 0;
                      const remaining = Math.max(0, total - paid);

                      await updateCustomer(selectedCustomer._id, {
                        payment: {
                          amount: total,
                          paid: paid,
                          remaining: remaining
                        }
                      });

                      // Refresh customer data
                      await fetchCustomers();
                      
                      // Update selected customer
                      const updated = await getCustomerById(selectedCustomer._id);
                      if (updated) {
                        setSelectedCustomer(updated);
                      }

                      setShowPaymentModal(false);
                      setError('');
                    } catch (err) {
                      console.error('Error updating payment:', err);
                      setError(err.message || 'Failed to update payment');
                      setTimeout(() => setError(''), 5000);
                    } finally {
                      setUpdating(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && !showPaymentModal && (
        <CustomerDetail
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};

export default CustomerList;

