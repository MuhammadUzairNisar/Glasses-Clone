import React, { useState, useEffect } from 'react';
import { getCustomers } from '../services/customers';
import jsPDF from 'jspdf';

const Invoice = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState(new Set());

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Fetch all customers
      const customers = await getCustomers();
      setCustomers(customers);
      setError('');
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSearchDate(e.target.value);
    setSelectedCustomer(null);
  };

  const handlePhoneChange = (e) => {
    const phone = e.target.value;
    setSearchPhone(phone);
    setSelectedCustomer(null);
  };

  const handleSearch = async () => {
    // Validate that at least one filter is provided
    if (!searchDate && !searchPhone) {
      setError('Please enter at least date or phone number to search.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Filter customers client-side
      let filtered = customers;
      
      if (searchDate) {
        const searchDateObj = new Date(searchDate);
        searchDateObj.setHours(0, 0, 0, 0);
        const endDate = new Date(searchDate);
        endDate.setHours(23, 59, 59, 999);
        
        filtered = filtered.filter(customer => {
          if (!customer.createdAt) return false;
          const customerDate = customer.createdAt.toDate ? customer.createdAt.toDate() : new Date(customer.createdAt);
          return customerDate >= searchDateObj && customerDate <= endDate;
        });
      }
      
      if (searchPhone) {
        filtered = filtered.filter(customer => 
          customer.phoneNumber && customer.phoneNumber.includes(searchPhone)
        );
      }
      
      console.log('Fetched customers:', filtered);
      console.log('First customer data:', filtered[0]);
      
      // Apply filters when search button is clicked
      setSelectedDate(searchDate);
      setSelectedPhone(searchPhone);
      
      // Set all matching customers
      setSelectedCustomers(filtered);
      setSelectedInvoiceIds(new Set(filtered.map(c => c._id || c.id)));
      
      // Auto-select first customer if matches found
      if (filtered.length > 0) {
        console.log('Setting selected customer:', filtered[0]);
        setSelectedCustomer(filtered[0]);
      } else {
        // Clear selection if no matches
        setSelectedCustomer(null);
        setSelectedCustomers([]);
        setError('No customers found matching the search criteria.');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
      setError('Failed to search customers. Please try again.');
      setTimeout(() => setError(''), 5000);
      setSelectedCustomer(null);
      setSelectedCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSelect = (customerId) => {
    setSelectedCustomer(selectedCustomers.find(c => c._id === customerId));
  };

  const handleInvoiceCheckbox = (customerId, checked) => {
    const newSelected = new Set(selectedInvoiceIds);
    if (checked) {
      newSelected.add(customerId);
    } else {
      newSelected.delete(customerId);
    }
    setSelectedInvoiceIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedInvoiceIds.size === selectedCustomers.length) {
      setSelectedInvoiceIds(new Set());
    } else {
      setSelectedInvoiceIds(new Set(selectedCustomers.map(c => c._id)));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateTotal = (products) => {
    if (!products || !Array.isArray(products)) {
      return 0;
    }
    return products.reduce((sum, product) => {
      return sum + (parseFloat(product.total) || 0);
    }, 0);
  };

  const handlePrint = (customer = null) => {
    if (customer) {
      // Print single invoice
      setSelectedCustomer(customer);
      setTimeout(() => {
        window.print();
      }, 100);
    } else {
      // Print all selected invoices
      window.print();
    }
  };

  const handlePrintSelected = () => {
    if (selectedInvoiceIds.size === 0) {
      setError('Please select at least one invoice to print.');
      setTimeout(() => setError(''), 5000);
      return;
    }
    // Print all selected invoices - they will be rendered in the print view
    // The print view will show all selected invoices with page breaks
    window.print();
  };

  const handleSavePDF = (customer = null) => {
    const customerToSave = customer || selectedCustomer;
    if (!customerToSave) return;

    const doc = new jsPDF();
    
    // Header - Exact match to print template
    doc.setFontSize(18); // text-2xl equivalent
    doc.setFont('helvetica', 'bold');
    doc.text('HAJI NAWAB DIN OPTICAL SERVICE', 105, 20, { align: 'center' });
    
    doc.setFontSize(10); // text-sm equivalent
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice', 105, 27, { align: 'center' });
    
    // Draw border-b-2 border-gray-400 under header
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);
    
    // Invoice Details - Exact match to print template
    // grid grid-cols-2 gap-4 mb-6
    let yPos = 40;
    
    // Left side - Invoice Details (no background box, just text)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8); // text-xs
    doc.text('Invoice Details', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8); // text-xs
    doc.text('Invoice No:', 20, yPos + 4);
    doc.setFont('helvetica', 'bold'); // font-semibold
    doc.text(customerToSave.customerId || (customerToSave._id ? customerToSave._id.slice(-8).toUpperCase() : 'N/A'), 50, yPos + 4);
    doc.setFont('helvetica', 'normal');
    doc.text('Date & Time:', 20, yPos + 8);
    doc.setFont('helvetica', 'bold'); // font-semibold
    doc.text(formatDateTime(customerToSave.createdAt), 50, yPos + 8);
    doc.setFont('helvetica', 'normal');
    
    // Right side - Bill To (no background box, just text)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8); // text-xs
    doc.text('Bill To', 120, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8); // text-xs
    doc.setFont('helvetica', 'bold'); // font-semibold
    doc.text(customerToSave.customerName || 'N/A', 120, yPos + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(`Phone: ${customerToSave.phoneNumber || 'N/A'}`, 120, yPos + 8);
    
    yPos += 20; // mb-6 equivalent
    
    // Products Table - Exact match to print template
    // No "Products" label, just the table
    // Table header - bg-gray-800 text-white
    doc.setFontSize(8); // text-xs
    doc.setFont('helvetica', 'bold');
    // Draw header background (gray-800)
    doc.setFillColor(50, 50, 50);
    doc.rect(20, yPos - 2, 170, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Category', 22, yPos);
    doc.text('Description', 52, yPos);
    doc.text('Qty', 102, yPos);
    doc.text('Price', 122, yPos);
    doc.text('Total', 162, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 5;
    
    // Table rows - border border-gray-400
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8); // text-xs
    if (customerToSave.products && customerToSave.products.length > 0) {
      customerToSave.products.forEach((product) => {
        if (yPos > 240) {
          return;
        }
        // Draw borders for each cell
        doc.setDrawColor(150, 150, 150); // border-gray-400
        doc.setLineWidth(0.1);
        // Top border
        doc.line(20, yPos - 2, 190, yPos - 2);
        // Bottom border
        doc.line(20, yPos + 1, 190, yPos + 1);
        // Vertical borders
        doc.line(50, yPos - 2, 50, yPos + 1);
        doc.line(100, yPos - 2, 100, yPos + 1);
        doc.line(120, yPos - 2, 120, yPos + 1);
        doc.line(160, yPos - 2, 160, yPos + 1);
        
        doc.text(product.category || '-', 22, yPos);
        doc.text((product.description || '-').substring(0, 20), 52, yPos);
        doc.text(String(product.qty || 0), 102, yPos);
        doc.text(formatCurrency(product.price), 122, yPos);
        doc.setFont('helvetica', 'bold'); // font-semibold
        doc.text(formatCurrency(product.total), 162, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 4;
      });
    }
    
    const finalY = yPos + 5; // mb-4 equivalent
    
    // Payment Summary - Exact match to print template
    // grid grid-cols-2 gap-4 mb-4
    // Left side - Prescription Details
    let presY = finalY;
    if (customerToSave.hasPrescription) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8); // text-xs
      doc.text('Prescription Details', 20, presY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8); // text-xs
      
      presY += 4;
      if (customerToSave.prescription?.right) {
        doc.text(`Right Eye - SPH: ${customerToSave.prescription.right.sph || 'N/A'}, CYL: ${customerToSave.prescription.right.cyl || 'N/A'}, AXIS: ${customerToSave.prescription.right.axis || 'N/A'}`, 20, presY);
        presY += 3;
      }
      if (customerToSave.prescription?.left) {
        doc.text(`Left Eye - SPH: ${customerToSave.prescription.left.sph || 'N/A'}, CYL: ${customerToSave.prescription.left.cyl || 'N/A'}, AXIS: ${customerToSave.prescription.left.axis || 'N/A'}`, 20, presY);
        presY += 3;
      }
      if (customerToSave.prescription?.ipd) {
        doc.text(`IPD: ${customerToSave.prescription.ipd}`, 20, presY);
        presY += 3;
      }
      if (customerToSave.prescription?.add) {
        doc.text(`ADD: ${customerToSave.prescription.add}`, 20, presY);
        presY += 3;
      }
    }
    
    // Notes
    if (customerToSave.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8); // text-xs
      doc.text('Notes', 20, presY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8); // text-xs
      doc.text(customerToSave.notes, 20, presY + 4, { maxWidth: 90 });
    }
    
    // Right side - Payment Summary (bg-gray-100 p-3 rounded border border-gray-300)
    let paymentY = finalY;
    // Draw background box (gray-100)
    doc.setFillColor(240, 240, 240); // bg-gray-100
    doc.rect(120, paymentY - 2, 70, 18, 'F');
    doc.setDrawColor(200, 200, 200); // border-gray-300
    doc.rect(120, paymentY - 2, 70, 18, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8); // text-xs
    doc.text('Payment Summary', 125, paymentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8); // text-xs
    doc.text('Total Amount:', 125, paymentY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(customerToSave.payment?.amount || calculateTotal(customerToSave.products)), 185, paymentY + 4, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.text('Paid:', 125, paymentY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 0); // text-green-700
    doc.text(formatCurrency(customerToSave.payment?.paid || 0), 185, paymentY + 8, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    
    // Draw divider line (border-t-2 border-gray-400)
    doc.setDrawColor(150, 150, 150); // border-gray-400
    doc.setLineWidth(0.2);
    doc.line(125, paymentY + 11, 185, paymentY + 11);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Remaining:', 125, paymentY + 14);
    doc.setTextColor(200, 0, 0); // text-red-700
    doc.text(formatCurrency(customerToSave.payment?.remaining || 0), 185, paymentY + 14, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    
    // Footer - Exact match to print template
    // border-t-2 border-gray-400 pt-2 mt-4
    doc.setDrawColor(150, 150, 150); // border-gray-400
    doc.setLineWidth(0.2);
    doc.line(20, doc.internal.pageSize.height - 12, 190, doc.internal.pageSize.height - 12);
    doc.setFontSize(8); // text-xs
    doc.setFont('helvetica', 'bold'); // font-semibold
    doc.text('Thank you for your business!', 105, doc.internal.pageSize.height - 8, { align: 'center' });
    
    // Save PDF with random number
    const randomNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const dateStr = new Date(customerToSave.createdAt).toISOString().split('T')[0];
    const customerName = (customerToSave.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Invoice_${customerName}_${dateStr}_${randomNumber}.pdf`;
    doc.save(fileName);
  };

  const handleSaveSelectedPDFs = () => {
    if (selectedInvoiceIds.size === 0) {
      setError('Please select at least one invoice to save as PDF.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    const selectedInvoices = selectedCustomers.filter(c => selectedInvoiceIds.has(c._id));
    
    // Create a single PDF with all selected invoices
    const doc = new jsPDF();
    let isFirstPage = true;

    selectedInvoices.forEach((customer, index) => {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      // Header - Exact match to print template (lines 858-861)
      doc.setFontSize(18); // text-2xl equivalent
      doc.setFont('helvetica', 'bold');
      doc.text('HAJI NAWAB DIN OPTICAL SERVICE', 105, 20, { align: 'center' });
      
      doc.setFontSize(10); // text-sm equivalent
      doc.setFont('helvetica', 'normal');
      doc.text('Invoice', 105, 27, { align: 'center' });
      
      // Draw border-b-2 border-gray-400 under header
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      doc.line(20, 30, 190, 30);
      
      // Invoice Details - Exact match to print template (lines 863-875)
      // grid grid-cols-2 gap-4 mb-6
      let yPos = 40;
      
      // Left side - Invoice Details (no background box, just text)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8); // text-xs
      doc.text('Invoice Details', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8); // text-xs
      doc.text('Invoice No:', 20, yPos + 4);
      doc.setFont('helvetica', 'bold'); // font-semibold
      doc.text(customer.customerId || (customer._id ? customer._id.slice(-8).toUpperCase() : 'N/A'), 50, yPos + 4);
      doc.setFont('helvetica', 'normal');
      doc.text('Date & Time:', 20, yPos + 8);
      doc.setFont('helvetica', 'bold'); // font-semibold
      doc.text(formatDateTime(customer.createdAt), 50, yPos + 8);
      doc.setFont('helvetica', 'normal');
      
      // Right side - Bill To (no background box, just text)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8); // text-xs
      doc.text('Bill To', 120, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8); // text-xs
      doc.setFont('helvetica', 'bold'); // font-semibold
      doc.text(customer.customerName || 'N/A', 120, yPos + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(`Phone: ${customer.phoneNumber || 'N/A'}`, 120, yPos + 8);
      
      yPos += 20; // mb-6 equivalent
      
      // Products Table - Exact match to print template (lines 877-909)
      // No "Products" label, just the table
      // Table header - bg-gray-800 text-white
      doc.setFontSize(8); // text-xs
      doc.setFont('helvetica', 'bold');
      // Draw header background (gray-800)
      doc.setFillColor(50, 50, 50);
      doc.rect(20, yPos - 2, 170, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('Category', 22, yPos);
      doc.text('Description', 52, yPos);
      doc.text('Qty', 102, yPos);
      doc.text('Price', 122, yPos);
      doc.text('Total', 162, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;
      
      // Table rows - border border-gray-400
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8); // text-xs
      if (customer.products && customer.products.length > 0) {
        customer.products.forEach((product) => {
          if (yPos > 240) {
            return;
          }
          // Draw borders for each cell
          doc.setDrawColor(150, 150, 150); // border-gray-400
          doc.setLineWidth(0.1);
          // Top border
          doc.line(20, yPos - 2, 190, yPos - 2);
          // Bottom border
          doc.line(20, yPos + 1, 190, yPos + 1);
          // Vertical borders
          doc.line(50, yPos - 2, 50, yPos + 1);
          doc.line(100, yPos - 2, 100, yPos + 1);
          doc.line(120, yPos - 2, 120, yPos + 1);
          doc.line(160, yPos - 2, 160, yPos + 1);
          
          doc.text(product.category || '-', 22, yPos);
          doc.text((product.description || '-').substring(0, 20), 52, yPos);
          doc.text(String(product.qty || 0), 102, yPos);
          doc.text(formatCurrency(product.price), 122, yPos);
          doc.setFont('helvetica', 'bold'); // font-semibold
          doc.text(formatCurrency(product.total), 162, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 4;
        });
      }
      
      const finalY = yPos + 5; // mb-4 equivalent
      
      // Payment Summary - Exact match to print template (lines 911-963)
      // grid grid-cols-2 gap-4 mb-4
      // Left side - Prescription Details
      let presY = finalY;
      if (customer.hasPrescription) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8); // text-xs
        doc.text('Prescription Details', 20, presY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8); // text-xs
        
        presY += 4;
        if (customer.prescription?.right) {
          doc.text(`Right Eye - SPH: ${customer.prescription.right.sph || 'N/A'}, CYL: ${customer.prescription.right.cyl || 'N/A'}, AXIS: ${customer.prescription.right.axis || 'N/A'}`, 20, presY);
          presY += 3;
        }
        if (customer.prescription?.left) {
          doc.text(`Left Eye - SPH: ${customer.prescription.left.sph || 'N/A'}, CYL: ${customer.prescription.left.cyl || 'N/A'}, AXIS: ${customer.prescription.left.axis || 'N/A'}`, 20, presY);
          presY += 3;
        }
        if (customer.prescription?.ipd) {
          doc.text(`IPD: ${customer.prescription.ipd}`, 20, presY);
          presY += 3;
        }
        if (customer.prescription?.add) {
          doc.text(`ADD: ${customer.prescription.add}`, 20, presY);
          presY += 3;
        }
      }
      
      // Notes
      if (customer.notes) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8); // text-xs
        doc.text('Notes', 20, presY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8); // text-xs
        doc.text(customer.notes, 20, presY + 4, { maxWidth: 90 });
      }
      
      // Right side - Payment Summary (bg-gray-100 p-3 rounded border border-gray-300)
      let paymentY = finalY;
      // Draw background box (gray-100)
      doc.setFillColor(240, 240, 240); // bg-gray-100
      doc.rect(120, paymentY - 2, 70, 18, 'F');
      doc.setDrawColor(200, 200, 200); // border-gray-300
      doc.rect(120, paymentY - 2, 70, 18, 'S');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8); // text-xs
      doc.text('Payment Summary', 125, paymentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8); // text-xs
      doc.text('Total Amount:', 125, paymentY + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(customer.payment?.amount || calculateTotal(customer.products)), 185, paymentY + 4, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.text('Paid:', 125, paymentY + 8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 100, 0); // text-green-700
      doc.text(formatCurrency(customer.payment?.paid || 0), 185, paymentY + 8, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      
      // Draw divider line (border-t-2 border-gray-400)
      doc.setDrawColor(150, 150, 150); // border-gray-400
      doc.setLineWidth(0.2);
      doc.line(125, paymentY + 11, 185, paymentY + 11);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Remaining:', 125, paymentY + 14);
      doc.setTextColor(200, 0, 0); // text-red-700
      doc.text(formatCurrency(customer.payment?.remaining || 0), 185, paymentY + 14, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      
      // Footer - Exact match to print template (lines 965-968)
      // border-t-2 border-gray-400 pt-2 mt-4
      doc.setDrawColor(150, 150, 150); // border-gray-400
      doc.setLineWidth(0.2);
      doc.line(20, doc.internal.pageSize.height - 12, 190, doc.internal.pageSize.height - 12);
      doc.setFontSize(8); // text-xs
      doc.setFont('helvetica', 'bold'); // font-semibold
      doc.text('Thank you for your business!', 105, doc.internal.pageSize.height - 8, { align: 'center' });
    });

    // Save PDF with random number
    const randomNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Invoices_${dateStr}_${randomNumber}.pdf`;
    doc.save(fileName);
  };

  // Filter customers by date and phone number (only after search)
  const filteredCustomers = selectedDate || selectedPhone ? customers.filter(customer => {
    const customerDate = new Date(customer.createdAt).toISOString().split('T')[0];
    const matchesDate = !selectedDate || customerDate === selectedDate;
    const matchesPhone = !selectedPhone || customer.phoneNumber?.includes(selectedPhone);
    return matchesDate && matchesPhone;
  }) : [];

  return (
    <div className="w-full p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Invoice Management</h2>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Date
            </label>
            <input
              type="date"
              value={searchDate}
              onChange={handleDateChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Phone Number
            </label>
            <input
              type="tel"
              value={searchPhone}
              onChange={handlePhoneChange}
              placeholder="Enter phone number"
              maxLength={11}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full sm:w-auto px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Invoice List - Show when multiple invoices found */}
      {selectedCustomers.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
              Found {selectedCustomers.length} invoices - Select an invoice to view details
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                {selectedInvoiceIds.size === selectedCustomers.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handlePrintSelected}
                disabled={selectedInvoiceIds.size === 0}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Selected ({selectedInvoiceIds.size})
              </button>
              <button
                onClick={handleSaveSelectedPDFs}
                disabled={selectedInvoiceIds.size === 0}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Save Selected as PDF ({selectedInvoiceIds.size})
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary-50 text-primary-700">
                <tr>
                  <th className="px-3 py-2 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedInvoiceIds.size === selectedCustomers.length && selectedCustomers.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-3 py-2 text-left">Invoice No</th>
                  <th className="px-3 py-2 text-left">Customer Name</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Paid</th>
                  <th className="px-3 py-2 text-right">Remaining</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedCustomers.map((customer) => (
                  <tr 
                    key={customer._id} 
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedCustomer?._id === customer._id ? 'bg-primary-50' : ''}`}
                    onClick={() => handleInvoiceSelect(customer._id)}
                  >
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedInvoiceIds.has(customer._id)}
                        onChange={(e) => handleInvoiceCheckbox(customer._id, e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">{customer.customerId || (customer._id ? customer._id.slice(-8).toUpperCase() : 'N/A')}</td>
                    <td className="px-3 py-2">{customer.customerName || 'N/A'}</td>
                    <td className="px-3 py-2">{customer.phoneNumber || 'N/A'}</td>
                    <td className="px-3 py-2">{formatDateTime(customer.createdAt)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(customer.payment?.amount || calculateTotal(customer.products))}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(customer.payment?.paid || 0)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-red-600">{formatCurrency(customer.payment?.remaining || 0)}</td>
                    <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handlePrint(customer)}
                          className="p-1 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded transition-colors"
                          title="Print"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleSavePDF(customer)}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                          title="Save as PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
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

      {/* Invoice Template - Only show when single invoice or when explicitly selected */}
      {selectedCustomer && selectedCustomers.length <= 1 && (
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 print:shadow-none invoice-content">
          {/* Print Actions - Hidden when printing */}
          <div className="mb-6 flex gap-4 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Invoice
            </button>
            <button
              onClick={handleSavePDF}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Save as PDF
            </button>
          </div>

          {/* Invoice Content */}
          <div>
            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-primary-600 mb-2">HAJI NAWAB DIN OPTICAL SERVICE</h1>
              <p className="text-lg text-gray-600">Invoice</p>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Invoice Details</h3>
                <p className="text-sm text-gray-600">Invoice No: <span className="font-medium">{selectedCustomer.customerId || (selectedCustomer._id ? selectedCustomer._id.slice(-8).toUpperCase() : 'N/A')}</span></p>
                <p className="text-sm text-gray-600">Date & Time: <span className="font-medium">{formatDateTime(selectedCustomer.createdAt)}</span></p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Bill To</h3>
                <p className="text-sm text-gray-600 font-medium">{selectedCustomer.customerName || 'N/A'}</p>
                <p className="text-sm text-gray-600">Phone: {selectedCustomer.phoneNumber || 'N/A'}</p>
              </div>
            </div>

            {/* Products Table */}
            <div className="mb-4">
              <table className="w-full border-collapse border border-gray-300 text-xs">
                <thead>
                  <tr className="bg-primary-500 text-white">
                    <th className="border border-gray-300 px-2 py-1 text-left">Category</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Qty</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">Price</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCustomer.products && selectedCustomer.products.length > 0 ? (
                    selectedCustomer.products.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-2 py-1">{product.category || '-'}</td>
                        <td className="border border-gray-300 px-2 py-1">{product.description || '-'}</td>
                        <td className="border border-gray-300 px-2 py-1 text-center">{product.qty || 0}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(product.price)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right font-semibold">{formatCurrency(product.total)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="border border-gray-300 px-2 py-1 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                {selectedCustomer.hasPrescription && (
                  <div className="mb-2">
                    <h3 className="font-semibold text-gray-700 mb-1 text-sm">Prescription Details</h3>
                    {selectedCustomer.prescription?.right && (
                      <p className="text-xs text-gray-600">
                        Right Eye - SPH: {selectedCustomer.prescription.right.sph || 'N/A'}, 
                        CYL: {selectedCustomer.prescription.right.cyl || 'N/A'}, 
                        AXIS: {selectedCustomer.prescription.right.axis || 'N/A'}
                      </p>
                    )}
                    {selectedCustomer.prescription?.left && (
                      <p className="text-xs text-gray-600">
                        Left Eye - SPH: {selectedCustomer.prescription.left.sph || 'N/A'}, 
                        CYL: {selectedCustomer.prescription.left.cyl || 'N/A'}, 
                        AXIS: {selectedCustomer.prescription.left.axis || 'N/A'}
                      </p>
                    )}
                    {selectedCustomer.prescription?.ipd && (
                      <p className="text-xs text-gray-600">IPD: {selectedCustomer.prescription.ipd}</p>
                    )}
                    {selectedCustomer.prescription?.add && (
                      <p className="text-xs text-gray-600">ADD: {selectedCustomer.prescription.add}</p>
                    )}
                  </div>
                )}
                {selectedCustomer.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1 text-sm">Notes</h3>
                    <p className="text-xs text-gray-600">{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2 text-sm">Payment Summary</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Total Amount:</span>
                    <span className="text-xs font-semibold">{formatCurrency(selectedCustomer.payment?.amount || calculateTotal(selectedCustomer.products))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Paid:</span>
                    <span className="text-xs font-semibold text-green-600">{formatCurrency(selectedCustomer.payment?.paid || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-gray-300 pt-1 mt-1">
                    <span className="text-xs font-semibold text-gray-700">Remaining:</span>
                    <span className="text-xs font-bold text-red-600">{formatCurrency(selectedCustomer.payment?.remaining || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t-2 border-gray-300 pt-2 mt-4">
              <p className="text-xs text-gray-600">Thank you for your business!</p>
            </div>
          </div>
        </div>
      )}

      {/* Print View - Show all selected invoices when printing */}
      {selectedInvoiceIds.size > 0 && (
        <div className="hidden print:block">
          {selectedCustomers
            .filter(c => selectedInvoiceIds.has(c._id))
            .map((customer, index) => (
              <div 
                key={customer._id || customer.id} 
                className="invoice-content mb-8" 
                style={{ pageBreakAfter: index < Array.from(selectedInvoiceIds).length - 1 ? 'always' : 'auto' }}
              >
                {/* Header */}
                <div className="text-center mb-6 border-b-2 border-gray-400 pb-3">
                  <h1 className="text-2xl font-bold text-gray-800 mb-1">HAJI NAWAB OPTICALS</h1>
                  <p className="text-sm text-gray-600 font-semibold">Invoice</p>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="font-bold text-gray-700 mb-1 text-xs">Invoice Details</h3>
                    <p className="text-xs text-gray-600">Invoice No: <span className="font-semibold">{customer.customerId || (customer._id ? customer._id.slice(-8).toUpperCase() : 'N/A')}</span></p>
                    <p className="text-xs text-gray-600">Date & Time: <span className="font-semibold">{formatDateTime(customer.createdAt)}</span></p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700 mb-1 text-xs">Bill To</h3>
                    <p className="text-xs text-gray-600 font-semibold">{customer.customerName || 'N/A'}</p>
                    <p className="text-xs text-gray-600">Phone: {customer.phoneNumber || 'N/A'}</p>
                  </div>
                </div>

                {/* Products Table */}
                <div className="mb-4">
                  <table className="w-full border-collapse border border-gray-400 text-xs">
                    <thead>
                      <tr className="bg-gray-800 text-white">
                        <th className="border border-gray-400 px-2 py-1 text-left font-semibold">Category</th>
                        <th className="border border-gray-400 px-2 py-1 text-left font-semibold">Description</th>
                        <th className="border border-gray-400 px-2 py-1 text-center font-semibold">Qty</th>
                        <th className="border border-gray-400 px-2 py-1 text-right font-semibold">Price</th>
                        <th className="border border-gray-400 px-2 py-1 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.products && customer.products.length > 0 ? (
                        customer.products.map((product, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1">{product.category || '-'}</td>
                            <td className="border border-gray-400 px-2 py-1">{product.description || '-'}</td>
                            <td className="border border-gray-400 px-2 py-1 text-center">{product.qty || 0}</td>
                            <td className="border border-gray-400 px-2 py-1 text-right">{formatCurrency(product.price)}</td>
                            <td className="border border-gray-400 px-2 py-1 text-right font-semibold">{formatCurrency(product.total)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="border border-gray-400 px-2 py-1 text-center text-gray-500">
                            No products found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Payment Summary */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    {customer.hasPrescription && (
                      <div className="mb-2">
                        <h3 className="font-bold text-gray-700 mb-1 text-xs">Prescription Details</h3>
                        {customer.prescription?.right && (
                          <p className="text-xs text-gray-600">
                            Right Eye - SPH: {customer.prescription.right.sph || 'N/A'}, 
                            CYL: {customer.prescription.right.cyl || 'N/A'}, 
                            AXIS: {customer.prescription.right.axis || 'N/A'}
                          </p>
                        )}
                        {customer.prescription?.left && (
                          <p className="text-xs text-gray-600">
                            Left Eye - SPH: {customer.prescription.left.sph || 'N/A'}, 
                            CYL: {customer.prescription.left.cyl || 'N/A'}, 
                            AXIS: {customer.prescription.left.axis || 'N/A'}
                          </p>
                        )}
                        {customer.prescription?.ipd && (
                          <p className="text-xs text-gray-600">IPD: {customer.prescription.ipd}</p>
                        )}
                        {customer.prescription?.add && (
                          <p className="text-xs text-gray-600">ADD: {customer.prescription.add}</p>
                        )}
                      </div>
                    )}
                    {customer.notes && (
                      <div>
                        <h3 className="font-bold text-gray-700 mb-1 text-xs">Notes</h3>
                        <p className="text-xs text-gray-600">{customer.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-100 p-3 rounded border border-gray-300">
                    <h3 className="font-bold text-gray-700 mb-2 text-xs">Payment Summary</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Total Amount:</span>
                        <span className="text-xs font-bold">{formatCurrency(customer.payment?.amount || calculateTotal(customer.products))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Paid:</span>
                        <span className="text-xs font-bold text-green-700">{formatCurrency(customer.payment?.paid || 0)}</span>
                      </div>
                      <div className="flex justify-between border-t-2 border-gray-400 pt-1 mt-1">
                        <span className="text-xs font-bold text-gray-700">Remaining:</span>
                        <span className="text-xs font-bold text-red-700">{formatCurrency(customer.payment?.remaining || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center border-t-2 border-gray-400 pt-2 mt-4">
                  <p className="text-xs text-gray-600 font-semibold">Thank you for your business!</p>
                </div>
              </div>
            ))}
        </div>
      )}

      {!selectedCustomer && !loading && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600">
            {selectedDate || selectedPhone 
              ? 'No customers found. Please adjust your filters and search again.' 
              : 'Please enter date or phone number and click Search to view invoice.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Invoice;

