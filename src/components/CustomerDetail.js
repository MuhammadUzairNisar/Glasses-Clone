import React from 'react';
import './CustomerDetail.css';

const CustomerDetail = ({ customer, onClose }) => {
  if (!customer) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    return parseFloat(amount).toFixed(2);
  };

  return (
    <div className="customer-detail-overlay" onClick={onClose}>
      <div className="customer-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <h2>Customer Details</h2>
          <button className="close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="detail-content">
          {/* Customer Information */}
          <div className="detail-section">
            <h3 className="section-title">Customer Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Customer Name</label>
                <span className="highlight">{customer.customerName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Phone Number</label>
                <span>{customer.phoneNumber || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Prescription</label>
                <span className={customer.hasPrescription ? 'badge badge-yes' : 'badge badge-no'}>
                  {customer.hasPrescription ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="detail-item">
                <label>Camera</label>
                <span className={customer.hasCamera ? 'badge badge-yes' : 'badge badge-no'}>
                  {customer.hasCamera ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="detail-item">
                <label>Date Created</label>
                <span>{formatDate(customer.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Prescription Details */}
          {customer.hasPrescription && customer.prescription && (
            <div className="detail-section">
              <h3 className="section-title">Prescription Details</h3>
              <div className="prescription-details">
                <div className="prescription-eye-detail">
                  <h4>Right Eye (R)</h4>
                  <div className="prescription-fields-detail">
                    <div className="prescription-field">
                      <label>SPH</label>
                      <span>{customer.prescription.right?.sph || 'N/A'}</span>
                    </div>
                    <div className="prescription-field">
                      <label>CYL</label>
                      <span>{customer.prescription.right?.cyl || 'N/A'}</span>
                    </div>
                    <div className="prescription-field">
                      <label>AXIS</label>
                      <span>{customer.prescription.right?.axis || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="prescription-eye-detail">
                  <h4>Left Eye (L)</h4>
                  <div className="prescription-fields-detail">
                    <div className="prescription-field">
                      <label>SPH</label>
                      <span>{customer.prescription.left?.sph || 'N/A'}</span>
                    </div>
                    <div className="prescription-field">
                      <label>CYL</label>
                      <span>{customer.prescription.left?.cyl || 'N/A'}</span>
                    </div>
                    <div className="prescription-field">
                      <label>AXIS</label>
                      <span>{customer.prescription.left?.axis || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="prescription-extra-detail">
                  <div className="prescription-field">
                    <label>IPD</label>
                    <span>{customer.prescription.ipd || 'N/A'}</span>
                  </div>
                  <div className="prescription-field">
                    <label>ADD</label>
                    <span>{customer.prescription.add || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products */}
          {customer.products && customer.products.length > 0 && (
            <div className="detail-section">
              <h3 className="section-title">Products ({customer.products.length})</h3>
              <div className="products-detail">
                <table className="products-table-detail">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.products.map((product, index) => (
                      <tr key={index}>
                        <td>{product.category || 'N/A'}</td>
                        <td>{product.description || 'N/A'}</td>
                        <td>{product.qty || '0'}</td>
                        <td>Rs. {formatCurrency(product.price)}</td>
                        <td className="amount">Rs. {formatCurrency(product.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Summary */}
          {customer.payment && (
            <div className="detail-section">
              <h3 className="section-title">Payment Summary</h3>
              <div className="payment-detail">
                <div className="payment-item">
                  <label>Total Amount</label>
                  <span className="amount-large">Rs. {formatCurrency(customer.payment.amount)}</span>
                </div>
                <div className="payment-item">
                  <label>Paid</label>
                  <span className="amount-large paid">Rs. {formatCurrency(customer.payment.paid)}</span>
                </div>
                <div className="payment-item">
                  <label>Remaining</label>
                  <span className={`amount-large ${parseFloat(customer.payment.remaining || 0) > 0 ? 'remaining' : 'paid'}`}>
                    Rs. {formatCurrency(customer.payment.remaining)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {customer.notes && (
            <div className="detail-section">
              <h3 className="section-title">Notes</h3>
              <div className="notes-detail">
                <p>{customer.notes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="detail-footer">
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;

