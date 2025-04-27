import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditVendorInvoiceModal from './EditVendorInvoiceModal';

const EditVendorInvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/vendors/invoices');
  };

  const handleUpdate = () => {
    // After successful update, navigate back to the invoices list with a refresh flag
    navigate('/vendors/invoices', { state: { refresh: true } });
  };

  return (
    <div>
      <EditVendorInvoiceModal
        invoiceId={id}
        onClose={handleClose}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default EditVendorInvoicePage; 