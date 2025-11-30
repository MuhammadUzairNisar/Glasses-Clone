import React, { useState, useEffect, useRef } from 'react';
import { searchCustomersByPhone, createCustomer } from '../services/customers';

import './OpticsForm.css';

const OpticsForm = ({ onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    phoneNumber: '',
    customerName: '',
    familyMember: '', // Family member name
    familyMemberRelation: '', // Relation (Father, Mother, Son, Daughter, etc.)
    doctorName: '', // Doctor name
    hasPrescription: false, // Prescription checkbox
    isRevise: false, // Revise checkbox
    prescription: {
      right: { sph: '', cyl: '', axis: '' },
      left: { sph: '', cyl: '', axis: '' },
      ipd: '',
      add: ''
    },
    notes: '',
    products: [{ category: '', description: '', qty: '', price: '', total: '' }],
    payment: {
      amount: '',
      paid: '',
      remaining: ''
    }
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isPhoneNumberFound, setIsPhoneNumberFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [validationError, setValidationError] = useState('');
  const searchTimeoutRef = useRef(null);

  // Search for customer by phone number
  const searchCustomerByPhone = async (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim().length < 3) {
      setIsPhoneNumberFound(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const customers = await searchCustomersByPhone(phoneNumber);

      // Find exact phone number match
      const exactMatch = customers.find(c => c.phoneNumber === phoneNumber);

      if (exactMatch) {
        setIsPhoneNumberFound(true);
        setFormData(prev => ({
          ...prev,
          customerName: exactMatch.customerName || ''
        }));
      } else {
        setIsPhoneNumberFound(false);
        // Don't clear the name if user is typing
      }
    } catch (error) {
      console.error('Search error:', error);
      setIsPhoneNumberFound(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle checkboxes
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    // For phone number, only allow digits and limit to 11
    if (name === 'phoneNumber') {
      // Remove any non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      // Limit to 11 digits
      const limitedValue = digitsOnly.slice(0, 11);
      setFormData(prev => ({ ...prev, [name]: limitedValue }));

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Reset phone number found state
      setIsPhoneNumberFound(false);

      // Debounce the search - wait 500ms after user stops typing
      if (limitedValue.length >= 3) {
        searchTimeoutRef.current = setTimeout(() => {
          searchCustomerByPhone(limitedValue);
        }, 500);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // If name is manually changed and phone number was found, clear the found state
    if (name === 'customerName' && isPhoneNumberFound) {
      // Allow user to override the auto-filled name
      // Don't clear isPhoneNumberFound here, let it stay disabled
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handlePrescriptionChange = (eye, field, value) => {
    if (eye === '') {
      // Handle IPD and ADD fields
      setFormData(prev => ({
        ...prev,
        prescription: {
          ...prev.prescription,
          [field]: value
        }
      }));
    } else {
      // Handle eye-specific fields
      setFormData(prev => ({
        ...prev,
        prescription: {
          ...prev.prescription,
          [eye]: {
            ...prev.prescription[eye],
            [field]: value
          }
        }
      }));
    }
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };

    // Calculate total if qty or price changes
    if (field === 'qty' || field === 'price') {
      const qty = parseFloat(updatedProducts[index].qty) || 0;
      const price = parseFloat(updatedProducts[index].price) || 0;
      updatedProducts[index].total = (qty * price).toFixed(2);
    }

    setFormData(prev => ({ ...prev, products: updatedProducts }));

    // Recalculate payment amount
    calculatePaymentAmount(updatedProducts);
  };

  const calculatePaymentAmount = (products) => {
    const total = products.reduce((sum, product) => {
      return sum + (parseFloat(product.total) || 0);
    }, 0);

    setFormData(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        amount: total.toFixed(2),
        remaining: (total - (parseFloat(prev.payment.paid) || 0)).toFixed(2)
      }
    }));
  };

  const handlePaymentChange = (field, value) => {
    const updatedPayment = { ...formData.payment, [field]: value };
    if (field === 'paid') {
      const amount = parseFloat(formData.payment.amount) || 0;
      const paid = parseFloat(value) || 0;
      updatedPayment.remaining = (amount - paid).toFixed(2);
    }
    setFormData(prev => ({ ...prev, payment: updatedPayment }));
  };

  const addProductRow = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { category: '', description: '', qty: '', price: '', total: '' }]
    }));
  };

  const removeProductRow = (index) => {
    if (formData.products.length > 1) {
      const updatedProducts = formData.products.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, products: updatedProducts }));
      calculatePaymentAmount(updatedProducts);
    }
  };

  const clearForm = () => {
    setFormData({
      customerId: '',
      phoneNumber: '',
      customerName: '',
      familyMember: '',
      familyMemberRelation: '',
      doctorName: '',
      hasPrescription: false,
      isRevise: false,
      prescription: {
        right: { sph: '', cyl: '', axis: '' },
        left: { sph: '', cyl: '', axis: '' },
        ipd: '',
        add: ''
      },
      notes: '',
      products: [{ category: '', description: '', qty: '', price: '', total: '' }],
      payment: {
        amount: '',
        paid: '',
        remaining: ''
      }
    });
    setIsPhoneNumberFound(false);
    setIsSearching(false);
    setValidationError('');
    setSaveMessage('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const validateForm = () => {
    // Check required fields
    if (!formData.customerName || formData.customerName.trim() === '') {
      setValidationError('Please enter customer name');
      setTimeout(() => setValidationError(''), 5000);
      return false;
    }

    if (!formData.phoneNumber || formData.phoneNumber.trim() === '') {
      setValidationError('Please enter phone number');
      setTimeout(() => setValidationError(''), 5000);
      return false;
    }

    // Validate phone number length (should be 11 digits)
    if (formData.phoneNumber.length < 10) {
      setValidationError('Please enter a valid phone number (10-11 digits)');
      setTimeout(() => setValidationError(''), 5000);
      return false;
    }

    // Check if at least one product has been entered
    const hasProducts = formData.products.some(product =>
      product.category || product.description || product.qty || product.price
    );

    if (!hasProducts) {
      setValidationError('Please add at least one product');
      setTimeout(() => setValidationError(''), 5000);
      return false;
    }

    // Validate each product entry
    for (let i = 0; i < formData.products.length; i++) {
      const product = formData.products[i];
      // If any field is filled, all required fields should be filled
      if (product.category || product.description || product.qty || product.price) {
        if (!product.category || product.category.trim() === '') {
          setValidationError(`Please select category for product ${i + 1}`);
          setTimeout(() => setValidationError(''), 5000);
          return false;
        }
        if (!product.description || product.description.trim() === '') {
          setValidationError(`Please enter description for product ${i + 1}`);
          setTimeout(() => setValidationError(''), 5000);
          return false;
        }
        if (!product.qty || parseFloat(product.qty) <= 0) {
          setValidationError(`Please enter valid quantity for product ${i + 1}`);
          setTimeout(() => setValidationError(''), 5000);
          return false;
        }
        if (!product.price || parseFloat(product.price) <= 0) {
          setValidationError(`Please enter valid price for product ${i + 1}`);
          setTimeout(() => setValidationError(''), 5000);
          return false;
        }
      }
    }

    return true;
  };

  const handleSaveAndPrint = async () => {
    // Clear any previous validation errors
    setValidationError('');

    // Validate form before saving
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const savedCustomer = await createCustomer(formData);
      setSaveMessage('Customer record saved successfully!');

      // After saving, navigate to invoice and print
      setTimeout(() => {
        // Callback to navigate to invoice with saved customer data
        if (onSaveSuccess) {
          onSaveSuccess(savedCustomer);
        }
        // Clear form after navigation
        clearForm();
        setSaveMessage('');
      }, 1000); // Short delay to show success message
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage(error.message || 'Failed to save customer record');
      setTimeout(() => setSaveMessage(''), 5000);
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all form data?')) {
      clearForm();
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit?')) {
      // TODO: Implement exit functionality
      window.location.reload();
    }
  };



  // Generate numeric options for dropdowns
  const generateNumericOptions = (start, end, step = 0.25) => {
    const options = [];
    for (let i = start; i <= end; i += step) {
      options.push(i.toFixed(2));
    }
    return options;
  };

  // Generate SPH options: 0, +0.25 to +20, then -0.25 to -20
  const generateSphOptions = () => {
    const options = ['0.00']; // Start with 0
    // Add positive values: +0.25 to +20
    for (let i = 0.25; i <= 20; i += 0.25) {
      options.push('+' + i.toFixed(2));
    }
    // Add negative values: -0.25 to -20
    for (let i = -0.25; i >= -20; i -= 0.25) {
      options.push(i.toFixed(2));
    }
    return options;
  };

  const sphOptions = generateSphOptions();
  const cylOptions = generateNumericOptions(-10, 10, 0.25);
  const axisOptions = Array.from({ length: 181 }, (_, i) => i); // 0 to 180
  const ipdOptions = generateNumericOptions(50, 80, 0.5);
  const addOptions = generateNumericOptions(0, 4, 0.25);

  return (
    <div className="optics-form-container">
      <form className="optics-form" onSubmit={(e) => e.preventDefault()}>
        {/* Header */}
        <div className="form-header">
          <h1 className="app-title">MY OPTICS</h1>
        </div>

        {/* Customer Info */}
        <div className="form-section">
          <h2 className="section-title">Customer Information</h2>
          <div className="customer-info-grid">
            <div className="form-group">
              <label>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  maxLength={11}
                  pattern="[0-9]*"
                  inputMode="numeric"
                />
                {isSearching && (
                  <span style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#667eea'
                  }}>
                    Searching...
                  </span>
                )}
                {isPhoneNumberFound && !isSearching && (
                  <span style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#10b981'
                  }}>
                    ✓ Found
                  </span>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Customer Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  disabled={isPhoneNumberFound}
                  style={{
                    backgroundColor: isPhoneNumberFound ? '#f3f4f6' : 'white',
                    cursor: isPhoneNumberFound ? 'not-allowed' : 'text',
                    paddingRight: isPhoneNumberFound ? '80px' : '14px'
                  }}
                />
                {isPhoneNumberFound && (
                  <span style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '11px',
                    color: '#10b981',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}>
                    ✓ Found in records
                  </span>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Family Member Name</label>
              <input
                type="text"
                name="familyMember"
                value={formData.familyMember}
                onChange={handleInputChange}
                placeholder="Enter family member name"
              />
            </div>
            <div className="form-group">
              <label>Family Member Relation</label>
              <select
                name="familyMemberRelation"
                value={formData.familyMemberRelation}
                onChange={handleInputChange}
              >
                <option value="">Select Relation</option>
                <option value="Self">Self</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Husband">Husband</option>
                <option value="Wife">Wife</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Doctor Name</label>
              <input
                type="text"
                name="doctorName"
                value={formData.doctorName}
                onChange={handleInputChange}
                placeholder="Enter doctor name"
              />
            </div>
            <div className="form-group">
              <label>Options</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="hasPrescription"
                    checked={formData.hasPrescription}
                    onChange={handleInputChange}
                  />
                  <span>Prescription</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isRevise"
                    checked={formData.isRevise}
                    onChange={handleInputChange}
                  />
                  <span>Revise</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Prescription Section */}
        <div className="form-section">
          <h2 className="section-title">Prescription</h2>
          <div className="prescription-grid">
            <div className="prescription-eye">
              <h3>Right Eye (R)</h3>
              <div className="prescription-fields">
                <div className="form-group">
                  <label>SPH</label>
                  <input
                    list="sph-options-right"
                    value={formData.prescription.right.sph}
                    onChange={(e) => handlePrescriptionChange('right', 'sph', e.target.value)}
                    placeholder="Select or type"
                  />
                  <datalist id="sph-options-right">
                    {sphOptions.map(opt => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>CYL</label>
                  <select
                    value={formData.prescription.right.cyl}
                    onChange={(e) => handlePrescriptionChange('right', 'cyl', e.target.value)}
                  >
                    <option value="">Select</option>
                    {cylOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>AXIS</label>
                  <select
                    value={formData.prescription.right.axis}
                    onChange={(e) => handlePrescriptionChange('right', 'axis', e.target.value)}
                  >
                    <option value="">Select</option>
                    {axisOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="prescription-eye">
              <h3>Left Eye (L)</h3>
              <div className="prescription-fields">
                <div className="form-group">
                  <label>SPH</label>
                  <input
                    list="sph-options-left"
                    value={formData.prescription.left.sph}
                    onChange={(e) => handlePrescriptionChange('left', 'sph', e.target.value)}
                    placeholder="Select or type"
                  />
                  <datalist id="sph-options-left">
                    {sphOptions.map(opt => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>CYL</label>
                  <select
                    value={formData.prescription.left.cyl}
                    onChange={(e) => handlePrescriptionChange('left', 'cyl', e.target.value)}
                  >
                    <option value="">Select</option>
                    {cylOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>AXIS</label>
                  <select
                    value={formData.prescription.left.axis}
                    onChange={(e) => handlePrescriptionChange('left', 'axis', e.target.value)}
                  >
                    <option value="">Select</option>
                    {axisOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="prescription-extra">
            <div className="form-group">
              <label>IPD</label>
              <select
                value={formData.prescription.ipd}
                onChange={(e) => handlePrescriptionChange('', 'ipd', e.target.value)}
              >
                <option value="">Select</option>
                {ipdOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>ADD</label>
              <select
                value={formData.prescription.add}
                onChange={(e) => handlePrescriptionChange('', 'add', e.target.value)}
              >
                <option value="">Select</option>
                {addOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes + Icons Section */}
        <div className="form-section">
          <h2 className="section-title">Notes & Media</h2>
          <div className="notes-section">
            <div className="form-group notes-input">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Enter notes here..."
                rows="4"
              />
            </div>
          </div>
        </div>

        {/* Product Entry Table */}
        <div className="form-section">
          <h2 className="section-title">Product Entry</h2>
          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.products.map((product, index) => (
                  <tr key={index}>
                    <td>
                      <select
                        value={product.category}
                        onChange={(e) => handleProductChange(index, 'category', e.target.value)}
                      >
                        <option value="">Select Category</option>
                        <option value="frames">Frames</option>
                        <option value="lenses">Lenses</option>
                        <option value="sunglasses">Sunglasses</option>
                        <option value="contact-lenses">Contact Lenses</option>
                        <option value="accessories">Accessories</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={product.description}
                        onChange={(e) => handleProductChange(index, 'description', e.target.value)}
                        placeholder="Enter description"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={product.qty}
                        onChange={(e) => handleProductChange(index, 'qty', e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={product.price}
                        onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={product.total}
                        readOnly
                        className="total-field"
                      />
                    </td>
                    <td>
                      {formData.products.length > 1 && (
                        <button
                          type="button"
                          className="remove-row-btn"
                          onClick={() => removeProductRow(index)}
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="add-row-btn" onClick={addProductRow}>
              + Add Product Row
            </button>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="form-section">
          <h2 className="section-title">Payment Summary</h2>
          <div className="payment-grid">
            <div className="form-group">
              <label>Amount</label>
              <input
                type="text"
                value={formData.payment.amount}
                readOnly
                className="readonly-field"
              />
            </div>
            <div className="form-group">
              <label>Paid</label>
              <input
                type="number"
                value={formData.payment.paid}
                onChange={(e) => handlePaymentChange('paid', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Remaining</label>
              <input
                type="text"
                value={formData.payment.remaining}
                readOnly
                className="readonly-field"
              />
            </div>
          </div>
        </div>

        {/* Validation Error Alert - Top Right Corner */}
        {validationError && (
          <div className="fixed top-4 right-4 z-50 max-w-md p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg animate-slide-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-800">{validationError}</p>
              </div>
              <button
                onClick={() => setValidationError('')}
                className="text-red-500 hover:text-red-700 ml-4 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Save Message - Top Right Corner */}
        {saveMessage && (
          <div className={`fixed z-50 max-w-md p-4 rounded-lg shadow-lg animate-slide-in ${validationError ? 'top-24 right-4' : 'top-4 right-4'
            } ${saveMessage.includes('successfully')
              ? 'bg-green-50 border-l-4 border-green-500'
              : 'bg-red-50 border-l-4 border-red-500'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {saveMessage.includes('successfully') ? (
                  <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <p className={`text-sm font-medium ${saveMessage.includes('successfully') ? 'text-green-800' : 'text-red-800'
                  }`}>
                  {saveMessage}
                </p>
              </div>
              <button
                onClick={() => setSaveMessage('')}
                className={`ml-4 flex-shrink-0 ${saveMessage.includes('successfully')
                  ? 'text-green-500 hover:text-green-700'
                  : 'text-red-500 hover:text-red-700'
                  }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            className="action-btn save-btn"
            onClick={handleSaveAndPrint}
            disabled={saving}
          >
            {saving ? '⏳ Saving...' : '💾 Save and Print'}
          </button>
          <button type="button" className="action-btn clear-btn" onClick={handleClear}>
            🗑️ Clear
          </button>
          <button type="button" className="action-btn exit-btn" onClick={handleExit}>
            🚪 Exit
          </button>
        </div>
      </form>
    </div>
  );
};

export default OpticsForm;

