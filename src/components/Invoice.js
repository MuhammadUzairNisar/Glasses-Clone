import React, { useState, useEffect, useRef } from 'react';
import { getCustomers, getCustomerById, updateCustomer } from '../services/customers';
import jsPDF from 'jspdf';

const Invoice = ({ initialCustomerId }) => {
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
  const [hasAutoPrinted, setHasAutoPrinted] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUpdate, setPaymentUpdate] = useState({ paid: '', remaining: '' });
  const [updating, setUpdating] = useState(false);
  const [printData, setPrintData] = useState(null); // Store print data separately
  const printDataRef = useRef(null); // Ref for immediate access to print data
  const [shouldPrint, setShouldPrint] = useState(false); // Trigger flag for printing

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Effect to trigger printing after data is ready
  useEffect(() => {
    if (shouldPrint && (printData || printDataRef.current)) {
      const dataToUse = printDataRef.current || printData;
      console.log('========== PRINT EFFECT TRIGGERED ==========');
      console.log('Print data count:', dataToUse?.length);
      console.log('Print data IDs:', dataToUse?.map(c => c._id || c.id));

      // Reset the flag
      setShouldPrint(false);

      // Use multiple animation frames to ensure DOM is fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            console.log('========== EXECUTING WINDOW.PRINT() ==========');
            console.log('Final print data ref count:', printDataRef.current?.length);
            console.log('Final print data state count:', printData?.length);

            // Force one final check before printing
            const finalData = printDataRef.current || printData;
            if (finalData && finalData.length > 0) {
              console.log('CONFIRMED: About to print', finalData.length, 'invoices');

              // Check if print container actually has content
              const printContainer = document.querySelector('.print-container');
              if (printContainer) {
                const invoiceElements = printContainer.querySelectorAll('.invoice-content');
                console.log('DOM Check: Found', invoiceElements.length, 'invoice elements in print container');
                console.log('Print container HTML length:', printContainer.innerHTML.length);
              } else {
                console.error('ERROR: Print container not found in DOM!');
              }

              window.print();
            } else {
              console.error('ERROR: No data available at print time!');
            }
          });
        });
      });
    }
  }, [shouldPrint, printData]);

  // Handle initial customer ID from save and print
  useEffect(() => {
    if (initialCustomerId && !hasAutoPrinted) {
      // First try to find in existing customers list
      const customer = customers.find(c => c._id === initialCustomerId);
      if (customer) {
        setSelectedCustomer(customer);
        setSelectedCustomers([customer]);
        setSelectedInvoiceIds(new Set([customer._id]));
        // Auto-print after a short delay
        setTimeout(() => {
          handlePrint(customer);
          setHasAutoPrinted(true);
        }, 500);
      } else if (customers.length > 0) {
        // If customer not found in list, fetch it directly
        // This handles the case where the customer was just saved
        getCustomerById(initialCustomerId).then(customer => {
          if (customer) {
            setSelectedCustomer(customer);
            setSelectedCustomers([customer]);
            setSelectedInvoiceIds(new Set([customer._id]));
            setTimeout(() => {
              handlePrint(customer);
              setHasAutoPrinted(true);
            }, 500);
          }
        }).catch(err => {
          console.error('Error fetching customer:', err);
        });
      }
      // If customers list is empty, wait for it to load
    }
  }, [initialCustomerId, customers, hasAutoPrinted]);

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
          const customerDate = parseDate(customer.createdAt);
          if (!customerDate || isNaN(customerDate.getTime())) return false;
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
    const customer = selectedCustomers.find(c => c._id === customerId);
    setSelectedCustomer(customer);
    // Don't clear selected invoices when clicking a row - user may want to view and print multiple
    // Only update the view, not the selection state
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
      setSelectedInvoiceIds(new Set(selectedCustomers.map(c => c._id || c.id).filter(id => id)));
    }
  };

  // Helper function to generate alphanumeric invoice number
  const generateAlphanumericInvoiceNo = (customerId, customerDbId) => {
    if (customerId) {
      // If customerId exists, ensure it's alphanumeric
      const alphanumeric = String(customerId).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return alphanumeric || 'N/A';
    }
    if (customerDbId) {
      // Convert MongoDB/Firestore ID to alphanumeric
      // Remove any non-alphanumeric characters and take first 8 characters
      const idStr = String(customerDbId);
      const alphanumeric = idStr.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (alphanumeric.length >= 8) {
        return alphanumeric.slice(0, 8);
      }
      // If shorter, pad with zeros
      return alphanumeric.padEnd(8, '0');
    }
    return 'N/A';
  };

  // Helper function to parse Firestore timestamps
  const parseDate = (dateValue) => {
    if (!dateValue) return null;
    if (dateValue.toDate) {
      return dateValue.toDate();
    }
    if (dateValue.seconds) {
      return new Date(dateValue.seconds * 1000);
    }
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      return new Date(dateValue);
    }
    return null;
  };

  const formatDate = (dateValue) => {
    const date = parseDate(dateValue);
    if (!date || isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateValue) => {
    const date = parseDate(dateValue);
    if (!date || isNaN(date.getTime())) return 'N/A';
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
    return `Rs. ${Math.round(parseFloat(amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const calculateTotal = (products) => {
    if (!products || !Array.isArray(products)) {
      return 0;
    }
    return products.reduce((sum, product) => {
      return sum + (parseFloat(product.total) || 0);
    }, 0);
  };

  const formatCylinder = (value) => {
    if (!value && value !== 0) return 'N/A';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'N/A';
    // Add + sign for positive values
    return numValue >= 0 ? `+${numValue}` : `${numValue}`;
  };

  const handlePrint = (customer = null) => {
    // If a specific customer is passed, use it for printing
    if (customer) {
      const printArray = [customer];
      // Set ref FIRST for immediate access
      printDataRef.current = printArray;
      // Then set state and trigger print
      setPrintData(printArray);
      setShouldPrint(true);
      // Also update selectedCustomer for UI consistency
      setSelectedCustomer(customer);
      console.log('Single invoice print triggered:', customer._id || customer.id);
    } else if (selectedCustomer) {
      // Print the currently selected customer
      const printArray = [selectedCustomer];
      // Set ref FIRST for immediate access
      printDataRef.current = printArray;
      // Then set state and trigger print
      setPrintData(printArray);
      setShouldPrint(true);
      console.log('Selected invoice print triggered:', selectedCustomer._id || selectedCustomer.id);
    }
  };

  const handlePrintSelected = () => {
    if (selectedInvoiceIds.size === 0) {
      setError('Please select at least one invoice to print.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    console.log('========== HANDLE PRINT SELECTED CALLED ==========');
    console.log('selectedInvoiceIds:', Array.from(selectedInvoiceIds));
    console.log('selectedInvoiceIds size:', selectedInvoiceIds.size);
    console.log('customers count:', customers.length);
    console.log('selectedCustomers count:', selectedCustomers.length);

    // Set print data for multiple invoices - filter from full customers array
    // This ensures we find all selected invoices even if selectedCustomers has changed
    const selectedInvoices = customers.filter(c => {
      if (!c) {
        console.log('Skipping null/undefined customer');
        return false;
      }
      // Check both _id and id properties for compatibility
      const customerId = c._id || c.id;
      const isSelected = selectedInvoiceIds.has(customerId);
      console.log('Checking customer:', customerId, '| Name:', c.customerName, '| isSelected:', isSelected);
      return customerId && isSelected;
    });

    console.log('========== FILTER RESULTS ==========');
    console.log('Selected invoices count after filter:', selectedInvoices.length);
    console.log('Expected count:', selectedInvoiceIds.size);
    console.log('Selected invoice IDs:', selectedInvoices.map(c => c._id || c.id));
    console.log('Selected invoice names:', selectedInvoices.map(c => c.customerName));

    if (selectedInvoices.length === 0) {
      // If no invoices found, try alternative approach - rebuild from selectedInvoiceIds
      console.warn('No invoices found with direct filter. Trying alternative approach...');
      const alternativeInvoices = [];
      selectedInvoiceIds.forEach(id => {
        const found = customers.find(c => (c._id === id || c.id === id));
        if (found) {
          console.log('Found invoice for id:', id);
          alternativeInvoices.push(found);
        }
      });

      console.log('Alternative approach found:', alternativeInvoices.length, 'invoices');

      if (alternativeInvoices.length === 0) {
        setError('No invoices found matching the selected IDs. Please try selecting again.');
        setTimeout(() => setError(''), 5000);
        return;
      }

      // Use alternative approach results
      // Create a NEW array instance to force React to detect the change
      const invoicesToPrint = [...alternativeInvoices];
      console.log('Setting print data (alternative):', invoicesToPrint.length, 'invoices');
      // Update ref FIRST for immediate access
      printDataRef.current = invoicesToPrint;
      // Then update state and trigger print
      setPrintData(invoicesToPrint);
      // Trigger print after state update
      setShouldPrint(true);
    } else {
      // Use direct filter results
      // Create a NEW array instance to force React to detect the change
      const invoicesToPrint = [...selectedInvoices];
      console.log('Setting print data (direct):', invoicesToPrint.length, 'invoices');
      // Update ref FIRST for immediate access
      printDataRef.current = invoicesToPrint;
      // Then update state and trigger print
      setPrintData(invoicesToPrint);
      // Trigger print after state update
      setShouldPrint(true);
    }
  };

  const handleSavePDF = async (customer = null) => {
    // Try to get customer data from multiple sources - prioritize passed customer
    let customerToSave = customer || selectedCustomer;

    // If still no customer and we have selectedCustomers with one item, use that
    if (!customerToSave && selectedCustomers.length === 1) {
      customerToSave = selectedCustomers[0];
    }

    // If still no customer, try to get from the first customer in the list
    if (!customerToSave && customers.length > 0) {
      customerToSave = customers[0];
    }

    if (!customerToSave) {
      console.error('No customer data available for PDF');
      setError('No customer data available. Please select a customer first.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    // Create a deep copy to avoid any reference issues
    const customerData = JSON.parse(JSON.stringify(customerToSave));

    console.log('Saving PDF for customer:', customerData);

    // Validate that we have essential data
    if (!customerData.customerName && !customerData.products) {
      console.error('Customer data is incomplete:', customerData);
      setError('Customer data is incomplete. Cannot generate PDF.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      // Load the logo image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const imagePromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = '/WhatsApp_Image_2025-12-24_at_7.19.38_PM-removebg-preview.png';
      });
      await imagePromise;

      // Initialize for 80mm width, dynamic height (start with long height, will crop if needed or just let it be long)
      // Standard thermal paper is 80mm width. Height depends on content.
      // We'll use a long page height to avoid page breaks for most receipts.
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 297] // 80mm width, A4 height (can be longer if needed)
      });

      // Margins
      const margin = 4;
      const pageWidth = 80;
      const contentWidth = pageWidth - (margin * 2);
      const centerX = pageWidth / 2;
      let yPos = 10;

      // Header - Add logo image
      const imgWidth = 50; // mm
      const imgHeight = (img.height * imgWidth) / img.width; // Maintain aspect ratio
      doc.addImage(img, 'PNG', centerX - imgWidth / 2, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 3;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Address', centerX, yPos, { align: 'center' });
      yPos += 4;
      doc.text('Main Susan Road, Faisalabad', centerX, yPos, { align: 'center' });
      yPos += 4;
      doc.text('Phone Numbers', centerX, yPos, { align: 'center' });
      yPos += 4;
      doc.text('0321-7940339', centerX, yPos, { align: 'center' });
      yPos += 3;
      doc.text('0321-6643839', centerX, yPos, { align: 'center' });
      yPos += 3;
      doc.text('041-8725875', centerX, yPos, { align: 'center' });
      yPos += 6;

      // Invoice Title
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', centerX, yPos, { align: 'center' });
      yPos += 2;

      // Divider
      doc.setDrawColor(0);
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      // Invoice Details
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');

      const invoiceNo = String(customerData.customerId || (customerData._id ? customerData._id.slice(-8).toUpperCase() : 'N/A'));
      doc.text(`Inv No: ${invoiceNo}`, margin, yPos);
      yPos += 4;

      const dateStr = formatDateTime(customerData.createdAt);
      doc.text(`Date: ${dateStr}`, margin, yPos);
      yPos += 4;

      doc.text(`Customer: ${customerData.customerName || 'N/A'}`, margin, yPos);
      yPos += 4;

      if (customerData.phoneNumber) {
        doc.text(`Phone: ${customerData.phoneNumber}`, margin, yPos);
        yPos += 4;
      }

      if (customerData.doctorName) {
        doc.text(`Doctor: ${customerData.doctorName}`, margin, yPos);
        yPos += 4;
      }

      yPos += 2;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      // Products Table Header
      doc.setFont('helvetica', 'bold');
      doc.text('Item', margin, yPos);
      doc.text('Qty', 45, yPos, { align: 'right' });
      doc.text('Price', 60, yPos, { align: 'right' });
      doc.text('Total', contentWidth + margin, yPos, { align: 'right' });
      yPos += 2;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 4;

      // Products
      doc.setFont('helvetica', 'bold');
      if (customerData.products && customerData.products.length > 0) {
        customerData.products.forEach((product) => {
          const category = String(product.category || '-');
          const description = String(product.description || '-');
          const itemText = `${category} - ${description}`;

          // Split text to fit width
          const splitText = doc.splitTextToSize(itemText, 35);
          doc.text(splitText, margin, yPos);

          const qty = String(product.qty || 0);
          const price = String(Math.round(parseFloat(product.price || 0)));
          const total = String(Math.round(parseFloat(product.total || 0)));

          doc.text(qty, 45, yPos, { align: 'right' });
          doc.text(price, 60, yPos, { align: 'right' });
          doc.text(total, contentWidth + margin, yPos, { align: 'right' });

          yPos += (splitText.length * 4) + 2;
        });
      }

      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      // Totals
      const totalAmount = Math.round(parseFloat(customerData.payment?.amount || calculateTotal(customerData.products)));
      const paidAmount = Math.round(parseFloat(customerData.payment?.paid || 0));
      const remainingAmount = Math.round(parseFloat(customerData.payment?.remaining || 0));

      doc.setFont('helvetica', 'bold');
      doc.text('Total:', 40, yPos, { align: 'right' });
      doc.text(String(totalAmount), contentWidth + margin, yPos, { align: 'right' });
      yPos += 5;

      doc.text('Paid:', 40, yPos, { align: 'right' });
      doc.text(String(paidAmount), contentWidth + margin, yPos, { align: 'right' });
      yPos += 5;

      doc.text('Remaining:', 40, yPos, { align: 'right' });
      doc.text(String(remainingAmount), contentWidth + margin, yPos, { align: 'right' });
      yPos += 8;

      // Prescription (Compact)
      if (customerData.hasPrescription) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Prescription:', margin, yPos);
        yPos += 4;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);

        if (customerData.prescription?.right) {
          const r = customerData.prescription.right;
          doc.text(`R: SPH ${r.sph} CYL ${r.cyl} AXIS ${r.axis}`, margin, yPos);
          yPos += 3;
        }
        if (customerData.prescription?.left) {
          const l = customerData.prescription.left;
          doc.text(`L: SPH ${l.sph} CYL ${l.cyl} AXIS ${l.axis}`, margin, yPos);
          yPos += 3;
        }
        if (customerData.prescription?.ipd || customerData.prescription?.add) {
          doc.text(`IPD: ${customerData.prescription.ipd || '-'}  ADD: ${customerData.prescription.add || '-'}`, margin, yPos);
          yPos += 5;
        }
        yPos += 2;
      }

      // Footer
      yPos += 5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('فٹنگ و مرمت کے دوران فریم جل جانے یا شیشہ ٹوٹ جانے کی فرم ذمہ دار نہ ہوگی', centerX, yPos, { align: 'center' });
      yPos += 5;
      doc.text("عینک گم ہو جانے کی صورت میں فرم کی کوئی ذمہ داری نہ ہوگی، پندرہ یوم کے بعد۔", centerX, yPos, { align: 'center' }); // Updated with Urdu numerals
      yPos += 5;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('No return, No exchange', centerX, yPos, { align: 'center' });

      // Save PDF
      const randomNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const dateStrIso = new Date().toISOString().split('T')[0];
      const customerName = (customerData.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Invoice_${customerName}_${dateStrIso}_${randomNumber}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleSaveSelectedPDFs = async () => {
    if (selectedInvoiceIds.size === 0) {
      setError('Please select at least one invoice to save as PDF.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    // Get all selected invoices using same logic as handlePrintSelected
    // Filter from full customers array to ensure we find all selected invoices
    const selectedInvoices = customers.filter(c => {
      if (!c) return false;
      const customerId = c._id || c.id;
      return customerId && selectedInvoiceIds.has(customerId);
    });

    try {
      // Load the logo image once
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const imagePromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = '/WhatsApp_Image_2025-12-24_at_7.19.38_PM-removebg-preview.png';
      });
      await imagePromise;

      // Create a single PDF with all selected invoices
      // Initialize for 80mm width
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 297]
      });

      let isFirstPage = true;

      selectedInvoices.forEach((customer, index) => {
        if (!isFirstPage) {
          doc.addPage([80, 297]);
        }
        isFirstPage = false;

        // Margins
        const margin = 4;
        const pageWidth = 80;
        const contentWidth = pageWidth - (margin * 2);
        const centerX = pageWidth / 2;
        let yPos = 10;

        // Header - Add logo image
        const imgWidth = 50; // mm
        const imgHeight = (img.height * imgWidth) / img.width; // Maintain aspect ratio
        doc.addImage(img, 'PNG', centerX - imgWidth / 2, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 3;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Address', centerX, yPos, { align: 'center' });
        yPos += 4;
        doc.text('Main Susan Road, Faisalabad', centerX, yPos, { align: 'center' });
        yPos += 4;
        doc.text('Phone Numbers', centerX, yPos, { align: 'center' });
        yPos += 4;
        doc.text('0321-7940339', centerX, yPos, { align: 'center' });
        yPos += 3;
        doc.text('0321-6643839', centerX, yPos, { align: 'center' });
        yPos += 3;
        doc.text('041-8725875', centerX, yPos, { align: 'center' });
        yPos += 6;

        // Invoice Title
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', centerX, yPos, { align: 'center' });
        yPos += 2;

        // Divider
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        // Invoice Details
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');

        const invoiceNo = String(customer.customerId || (customer._id ? customer._id.slice(-8).toUpperCase() : 'N/A'));
        doc.text(`Inv No: ${invoiceNo}`, margin, yPos);
        yPos += 4;

        const dateStr = formatDateTime(customer.createdAt);
        doc.text(`Date: ${dateStr}`, margin, yPos);
        yPos += 4;

        doc.text(`Customer: ${customer.customerName || 'N/A'}`, margin, yPos);
        yPos += 4;

        if (customer.phoneNumber) {
          doc.text(`Phone: ${customer.phoneNumber}`, margin, yPos);
          yPos += 4;
        }

        if (customer.doctorName) {
          doc.text(`Doctor: ${customer.doctorName}`, margin, yPos);
          yPos += 4;
        }

        yPos += 2;
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        // Products Table Header
        doc.setFont('helvetica', 'bold');
        doc.text('Item', margin, yPos);
        doc.text('Qty', 45, yPos, { align: 'right' });
        doc.text('Price', 60, yPos, { align: 'right' });
        doc.text('Total', contentWidth + margin, yPos, { align: 'right' });
        yPos += 2;
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 4;

        // Products
        doc.setFont('helvetica', 'bold');
        if (customer.products && customer.products.length > 0) {
          customer.products.forEach((product) => {
            const category = String(product.category || '-');
            const description = String(product.description || '-');
            const itemText = `${category} - ${description}`;

            // Split text to fit width
            const splitText = doc.splitTextToSize(itemText, 35);
            doc.text(splitText, margin, yPos);

            const qty = String(product.qty || 0);
            const price = String(Math.round(parseFloat(product.price || 0)));
            const total = String(Math.round(parseFloat(product.total || 0)));

            doc.text(qty, 45, yPos, { align: 'right' });
            doc.text(price, 60, yPos, { align: 'right' });
            doc.text(total, contentWidth + margin, yPos, { align: 'right' });

            yPos += (splitText.length * 4) + 2;
          });
        }

        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        // Totals
        const totalAmount = Math.round(parseFloat(customer.payment?.amount || calculateTotal(customer.products)));
        const paidAmount = Math.round(parseFloat(customer.payment?.paid || 0));
        const remainingAmount = Math.round(parseFloat(customer.payment?.remaining || 0));

        doc.setFont('helvetica', 'bold');
        doc.text('Total:', 40, yPos, { align: 'right' });
        doc.text(String(totalAmount), contentWidth + margin, yPos, { align: 'right' });
        yPos += 5;

        doc.text('Paid:', 40, yPos, { align: 'right' });
        doc.text(String(paidAmount), contentWidth + margin, yPos, { align: 'right' });
        yPos += 5;

        doc.text('Remaining:', 40, yPos, { align: 'right' });
        doc.text(String(remainingAmount), contentWidth + margin, yPos, { align: 'right' });
        yPos += 8;

        // Prescription (Compact)
        if (customer.hasPrescription) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('Prescription:', margin, yPos);
          yPos += 4;

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);

          if (customer.prescription?.right) {
            const r = customer.prescription.right;
            doc.text(`R: SPH ${r.sph} CYL ${r.cyl} AXIS ${r.axis}`, margin, yPos);
            yPos += 3;
          }
          if (customer.prescription?.left) {
            const l = customer.prescription.left;
            doc.text(`L: SPH ${l.sph} CYL ${l.cyl} AXIS ${l.axis}`, margin, yPos);
            yPos += 3;
          }
          if (customer.prescription?.ipd || customer.prescription?.add) {
            doc.text(`IPD: ${customer.prescription.ipd || '-'}  ADD: ${customer.prescription.add || '-'}`, margin, yPos);
            yPos += 5;
          }
          yPos += 2;
        }

        // Footer
        yPos += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('فٹنگ و مرمت کے دوران فریم جل جانے یا شیشہ ٹوٹ جانے کی فرم ذمہ دار نہ ہوگی', centerX, yPos, { align: 'center' });
        yPos += 5;
        doc.text('یوم کے بعد عینک گم ہو جانے کی صورت میں فرم کی کوئی ذمہ داری نہ ہوگی ۱۵', centerX, yPos, { align: 'center' });
      });

      // Save PDF
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Selected_Invoices_${dateStr}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Filter customers by date and phone number (only after search)
  const filteredCustomers = selectedDate || selectedPhone ? customers.filter(customer => {
    const customerDateObj = parseDate(customer.createdAt);
    if (!customerDateObj || isNaN(customerDateObj.getTime())) return false;
    const customerDate = customerDateObj.toISOString().split('T')[0];
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
                  <th className="px-3 py-2 text-left">Family Member</th>
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
                        checked={selectedInvoiceIds.has(customer._id || customer.id)}
                        onChange={(e) => handleInvoiceCheckbox(customer._id || customer.id, e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">{customer.customerId || (customer._id ? customer._id.slice(-8).toUpperCase() : 'N/A')}</td>
                    <td className="px-3 py-2">{customer.customerName || 'N/A'}</td>
                    <td className="px-3 py-2">
                      {customer.familyMember && customer.familyMember.trim() !== '' ? (
                        <span>
                          {customer.familyMember}
                          {customer.familyMemberRelation && customer.familyMemberRelation.trim() !== '' && (
                            <span className="text-gray-500"> ({customer.familyMemberRelation})</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{customer.phoneNumber || 'N/A'}</td>
                    <td className="px-3 py-2">{formatDateTime(customer.createdAt)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(customer.payment?.amount || calculateTotal(customer.products))}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(customer.payment?.paid || 0)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-red-600">
                      <div className="flex items-center justify-end gap-2">
                        <span>{formatCurrency(customer.payment?.remaining || 0)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
                            setPaymentUpdate({
                              paid: customer.payment?.paid ? customer.payment.paid.toString() : '',
                              remaining: customer.payment?.remaining || 0
                            });
                            setShowPaymentModal(true);
                          }}
                          className="p-1 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded transition-colors"
                          title="Update payment"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </td>
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
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 print:shadow-none print:hidden">
          {/* Print Actions - Hidden when printing */}
          <div className="mb-6 flex gap-4 print:hidden">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (selectedCustomer) {
                  handlePrint(selectedCustomer);
                }
              }}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Invoice
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (selectedCustomer) {
                  handleSavePDF(selectedCustomer);
                }
              }}
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
                {selectedCustomer.familyMember && (
                  <p className="text-sm text-gray-600">
                    Family Member: <span className="font-medium">
                      {selectedCustomer.familyMember}
                      {selectedCustomer.familyMemberRelation && (
                        <span className="text-gray-500"> ({selectedCustomer.familyMemberRelation})</span>
                      )}
                    </span>
                  </p>
                )}
                <p className="text-sm text-gray-600">Phone: {selectedCustomer.phoneNumber || 'N/A'}</p>
                {selectedCustomer.doctorName && (
                  <p className="text-sm text-gray-600">Doctor: {selectedCustomer.doctorName}</p>
                )}
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
                        CYL: {formatCylinder(selectedCustomer.prescription.right.cyl)},
                        AXIS: {selectedCustomer.prescription.right.axis || 'N/A'}
                      </p>
                    )}
                    {selectedCustomer.prescription?.left && (
                      <p className="text-xs text-gray-600">
                        Left Eye - SPH: {selectedCustomer.prescription.left.sph || 'N/A'},
                        CYL: {formatCylinder(selectedCustomer.prescription.left.cyl)},
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
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-700 text-sm">Payment Summary</h3>
                  <button
                    onClick={() => {
                      setPaymentUpdate({
                        paid: selectedCustomer.payment?.paid ? selectedCustomer.payment.paid.toString() : '',
                        remaining: selectedCustomer.payment?.remaining || 0
                      });
                      setShowPaymentModal(true);
                    }}
                    className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded-lg transition-colors"
                    title="Update payment"
                  >
                    ✏️ Update
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Total Amount:</span>
                    <span className="text-xs font-semibold">{formatCurrency(selectedCustomer.payment?.amount || calculateTotal(selectedCustomer.products))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Paid:</span>
                    <span className="text-xs font-semibold text-green-600">{formatCurrency(selectedCustomer.payment?.paid || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t-2 border-gray-300 pt-1 mt-1">
                    <span className="text-xs font-semibold text-gray-700">Remaining:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-600">{formatCurrency(selectedCustomer.payment?.remaining || 0)}</span>
                      <button
                        onClick={() => {
                          setPaymentUpdate({
                            paid: selectedCustomer.payment?.paid ? selectedCustomer.payment.paid.toString() : '',
                            remaining: selectedCustomer.payment?.remaining || 0
                          });
                          setShowPaymentModal(true);
                        }}
                        className="p-1 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded transition-colors"
                        title="Update payment amount"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t-2 border-gray-300 pt-2 mt-4">
              <p className="text-xs text-gray-600">Thank you for your business!</p>
              <p className="text-xs text-gray-600 mt-1">No return, No exchange</p>
            </div>
          </div>
        </div>
      )}

      {/* Print View - Always rendered but positioned off-screen, shown during print */}
      <div
        className="print-container"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '100%',
          height: 'auto',
          minHeight: 0,
          maxHeight: 'none',
          margin: 0,
          padding: 0,
          backgroundColor: 'white'
        }}
      >
        {(() => {
          // ALWAYS use ref first since it's set immediately, then fallback to state
          let invoicesToPrint = printDataRef.current || printData;

          console.log('========== PRINT VIEW RENDERING ==========');
          console.log('printDataRef.current count:', printDataRef.current?.length);
          console.log('printData state count:', printData?.length);
          console.log('invoicesToPrint count (selected):', invoicesToPrint?.length);
          console.log('invoicesToPrint IDs:', invoicesToPrint?.map(c => c._id || c.id));

          if (!invoicesToPrint || invoicesToPrint.length === 0) {
            // Fallback logic if printData is not set
            console.log('No print data, using fallback logic');
            if (selectedInvoiceIds.size > 0) {
              console.log('Using selectedInvoiceIds fallback, size:', selectedInvoiceIds.size);
              invoicesToPrint = customers.filter(c => {
                if (!c) return false;
                const customerId = c._id || c.id;
                return customerId && selectedInvoiceIds.has(customerId);
              });
            } else if (selectedCustomer) {
              console.log('Using selectedCustomer fallback');
              invoicesToPrint = [selectedCustomer];
            } else if (selectedCustomers.length > 0) {
              console.log('Using selectedCustomers fallback, count:', selectedCustomers.length);
              invoicesToPrint = selectedCustomers;
            } else {
              invoicesToPrint = [];
            }
          }

          console.log('Final invoicesToPrint count:', invoicesToPrint?.length);

          // Filter out any null/undefined customers and ensure they have required data
          invoicesToPrint = invoicesToPrint.filter(c => {
            if (!c || c === null || c === undefined) return false;
            // Ensure customer has at least an ID
            return (c._id || c.id);
          });

          // Return null if no invoices to print
          if (invoicesToPrint.length === 0) {
            console.log('No invoices to print, returning null');
            return null;
          }

          console.log('Rendering', invoicesToPrint.length, 'invoices for printing');
          return invoicesToPrint.map((customer, index) => {
            const shouldBreakPage = index < invoicesToPrint.length - 1;
            const isLastInvoice = index === invoicesToPrint.length - 1;
            return (
              <div
                key={customer._id || customer.id}
                className={`invoice-content ${isLastInvoice ? 'invoice-content-last' : ''}`}
                style={{
                  pageBreakAfter: shouldBreakPage ? 'always' : 'avoid',
                  pageBreakInside: 'avoid',
                  pageBreakBefore: 'avoid',
                  marginBottom: 0,
                  paddingBottom: 0,
                  height: 'auto',
                  minHeight: 0
                }}
              >
                {/* Header */}
                <div className="text-center mb-6 border-b-2 border-black pb-3">
                  <img
                    src="/WhatsApp_Image_2025-12-24_at_7.19.38_PM-removebg-preview.png"
                    alt="Haji Nawab Din Optical Service"
                    className="mx-auto mb-2"
                  />
                  <div className="text-xs text-black font-bold space-y-1">
                    <p className="font-bold">Address</p>
                    <p>Main Susan Road, Faisalabad</p>
                    <p className="font-bold mt-2">Phone Numbers</p>
                    <p>0321-7940339</p>
                    <p>0321-6643839</p>
                    <p>041-8725875</p>
                  </div>
                  <p className="text-sm text-black font-bold mt-3">Slip</p>
                </div>

                {/* Slip Details */}
                <div className="flex flex-col gap-2 mb-4">
                  <div>
                    <h3 className="font-bold text-black mb-1 text-xs">Slip Details</h3>
                    <p className="text-xs text-black font-bold">Slip No: <span className="font-bold">{generateAlphanumericInvoiceNo(customer.customerId, customer._id)}</span></p>
                    <p className="text-xs text-black font-bold">Date: <span className="font-bold">{formatDateTime(customer.createdAt)}</span></p>
                  </div>
                  <div>
                    <h3 className="font-bold text-black mb-1 text-xs">Bill To</h3>
                    <p className="text-xs text-black font-bold">{customer.customerName || 'N/A'}</p>
                    {customer.familyMember && customer.familyMember.trim() !== '' && (
                      <p className="text-xs text-black font-bold">
                        FM: <span className="font-bold">
                          {customer.familyMember}
                          {customer.familyMemberRelation && customer.familyMemberRelation.trim() !== '' && (
                            <span className="font-bold"> ({customer.familyMemberRelation})</span>
                          )}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-black font-bold">Ph: {customer.phoneNumber || 'N/A'}</p>
                    {customer.doctorName && (
                      <p className="text-xs text-black font-bold">Dr: {customer.doctorName}</p>
                    )}
                  </div>
                </div>

                {/* Products Table */}
                <div className="mb-4">
                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-white text-black">
                        <th className="border border-black px-2 py-1 text-left font-bold text-black">Category</th>
                        <th className="border border-black px-2 py-1 text-left font-bold text-black">Description</th>
                        <th className="border border-black px-2 py-1 text-center font-bold text-black">Qty</th>
                        <th className="border border-black px-2 py-1 text-right font-bold text-black">Price</th>
                        <th className="border border-black px-2 py-1 text-right font-bold text-black">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.products && customer.products.length > 0 ? (
                        customer.products.map((product, idx) => (
                          <tr key={idx}>
                            <td className="border border-black px-2 py-1 font-bold text-black">{product.category || '-'}</td>
                            <td className="border border-black px-2 py-1 font-bold text-black">{product.description || '-'}</td>
                            <td className="border border-black px-2 py-1 text-center font-bold text-black">{product.qty || 0}</td>
                            <td className="border border-black px-2 py-1 text-right font-bold text-black">{formatCurrency(product.price)}</td>
                            <td className="border border-black px-2 py-1 text-right font-bold text-black">{formatCurrency(product.total)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="border border-black px-2 py-1 text-center text-black font-bold">
                            No products found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Payment Summary */}
                <div className="flex flex-col gap-4 mb-4">
                  <div>
                    {customer.hasPrescription && (
                      <div className="mb-2">
                        <h3 className="font-bold text-black mb-1 text-xs">Prescription</h3>
                        {customer.prescription?.right && (
                          <p className="text-xs text-black font-bold">
                            R: SPH {customer.prescription.right.sph || '-'} / CYL {customer.prescription.right.cyl || '-'} / AXIS {customer.prescription.right.axis || '-'}
                          </p>
                        )}
                        {customer.prescription?.left && (
                          <p className="text-xs text-black font-bold">
                            L: SPH {customer.prescription.left.sph || '-'} / CYL {customer.prescription.left.cyl || '-'} / AXIS {customer.prescription.left.axis || '-'}
                          </p>
                        )}
                        {(customer.prescription?.ipd || customer.prescription?.add) && (
                          <p className="text-xs text-black font-bold">
                            {customer.prescription.ipd && `IPD: ${customer.prescription.ipd} `}
                            {customer.prescription.add && `ADD: ${customer.prescription.add}`}
                          </p>
                        )}
                      </div>
                    )}
                    {customer.notes && (
                      <div>
                        <h3 className="font-bold text-black mb-1 text-xs">Notes</h3>
                        <p className="text-xs text-black font-bold">{customer.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-white p-2 rounded border border-black">
                    <h3 className="font-bold text-black mb-1 text-xs">Payment</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-black font-bold">Total:</span>
                        <span className="text-xs font-bold text-black">{formatCurrency(customer.payment?.amount || calculateTotal(customer.products))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-black font-bold">Paid:</span>
                        <span className="text-xs font-bold text-black">{formatCurrency(customer.payment?.paid || 0)}</span>
                      </div>
                      <div className="flex justify-between border-t border-black pt-1 mt-1">
                        <span className="text-xs font-bold text-black">Rem:</span>
                        <span className="text-xs font-bold text-black">{formatCurrency(customer.payment?.remaining || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer - Last Element */}
                <div className="text-center border-t-2 border-black invoice-footer" style={{ paddingTop: '4px', marginTop: '4px', marginBottom: 0, paddingBottom: 0 }}>
                  <p className="text-xs text-black font-bold" style={{ marginBottom: '1px', marginTop: 0 }}>فٹنگ و مرمت کے دوران فریم جل جانے یا شیشہ ٹوٹ جانے کی فرم ذمہ دار نہ ہوگی</p>
                  <p className="text-xs text-black font-bold" style={{ marginTop: '1px', marginBottom: 0, paddingBottom: 0 }}>یوم کے بعد عینک گم ہو جانے کی صورت میں فرم کی کوئی ذمہ داری نہ ہوگی ۱۵</p>
                </div>
              </div>
            );
          });
        })()}
      </div>

      {!selectedCustomer && !loading && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600">
            {selectedDate || selectedPhone
              ? 'No customers found. Please adjust your filters and search again.'
              : 'Please enter date or phone number and click Search to view invoice.'}
          </p>
        </div>
      )}

      {/* Payment Update Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPaymentModal(false)}>
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
                  value={formatCurrency(selectedCustomer.payment?.amount || calculateTotal(selectedCustomer.products))}
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
                    const value = e.target.value;
                    const paid = parseFloat(value) || 0;
                    const total = parseFloat(selectedCustomer.payment?.amount || calculateTotal(selectedCustomer.products)) || 0;
                    const remaining = Math.max(0, total - paid);
                    setPaymentUpdate({
                      paid: value,
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
                  value={formatCurrency(paymentUpdate.remaining)}
                  readOnly
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 ${paymentUpdate.remaining > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'
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
                        // Update in selectedCustomers array if it exists
                        setSelectedCustomers(prev =>
                          prev.map(c => c._id === updated._id ? updated : c)
                        );
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
    </div>
  );
};

export default Invoice;

