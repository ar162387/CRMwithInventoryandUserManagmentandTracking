import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useAuth } from '../hooks/useAuth';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  // Pending totals
  const [pendingTotals, setPendingTotals] = useState({
    customers: 0,
    vendors: 0,
    brokers: 0,
    commissioners: 0,
  });

  // Circulating supply
  const [supply, setSupply] = useState(null);

  // Reminder lists
  const [customerReminders, setCustomerReminders] = useState([]);
  const [vendorReminders, setVendorReminders] = useState([]);
  const [brokerReminders, setBrokerReminders] = useState([]);
  const [commissionerReminders, setCommissionerReminders] = useState([]);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Parallel requests
        const [custRem, vendRem, broRem, comRem, custPend, vendPend, broPend, comPend, supplyRes] = await Promise.all([
          api.get('/dashboard/customers/reminders'),
          api.get('/dashboard/vendors/reminders'),
          api.get('/dashboard/brokers/reminders'),
          api.get('/dashboard/commissioners/reminders'),
          api.get('/dashboard/customers/remaining'),
          api.get('/dashboard/vendors/remaining'),
          api.get('/dashboard/brokers/remaining'),
          api.get('/dashboard/commissioners/remaining'),
          api.get('/dashboard/circulating-supply'),
        ]);

        setCustomerReminders(custRem.data);
        setVendorReminders(vendRem.data);
        setBrokerReminders(broRem.data);
        setCommissionerReminders(comRem.data);

        setPendingTotals({
          customers: custPend.data.totalRemaining || 0,
          vendors: vendPend.data.totalRemaining || 0,
          brokers: broPend.data.totalRemaining || 0,
          commissioners: comPend.data.totalRemaining || 0,
        });

        setSupply(supplyRes.data);
        setError(null);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome, {user?.fullname || user?.username || 'User'}!</p>
        </div>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Logout
        </button>
      </div>

      {/* Pending Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Pending Customer Payments" value={pendingTotals.customers} />
        <Card title="Pending Vendor Payments" value={pendingTotals.vendors} />
        <Card title="Pending Broker Payments" value={pendingTotals.brokers} />
        <Card title="Pending Commissioner Payments" value={pendingTotals.commissioners} />
      </div>

      {/* Circulating Supply */}
      {supply && (
        <div className="bg-white p-6 shadow rounded">
          <h2 className="text-xl font-semibold mb-4">Circulating Supply</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <SupplyRow label="Total Balance" value={supply.totalBalance} />
            <SupplyRow label="Total Paid Customers" value={supply.totalPaidCustomers} />
            <SupplyRow label="Total Paid Vendors" value={supply.totalPaidVendors} />
            <SupplyRow label="Total Paid Brokers" value={supply.totalPaidBrokers} />
            <SupplyRow label="Total Paid Commissioners" value={supply.totalPaidCommissioners} />
            <SupplyRow label="Balance" value={supply.balance} bold />
          </div>
        </div>
      )}

      {/* Reminders Section */}
      <div className="space-y-8">
        <ReminderTable
          title="Customer Invoice Reminders"
          data={customerReminders}
          headers={['Invoice #', 'Customer', 'Remaining', 'Status', 'Due Date']}
          rowRenderer={(inv) => [
            inv.invoiceNumber,
            inv.customerName,
            formatCurrency(inv.remainingAmount),
            inv.status,
            inv.dueDate ? formatDate(inv.dueDate) : '-',
          ]}
        />

        <ReminderTable
          title="Vendor Invoice Reminders"
          data={vendorReminders}
          headers={['Invoice #', 'Vendor', 'Remaining', 'Status', 'Due Date']}
          rowRenderer={(inv) => [
            inv.invoiceNumber,
            inv.vendorName,
            formatCurrency(inv.remainingAmount),
            inv.status,
            inv.dueDate ? formatDate(inv.dueDate) : '-',
          ]}
        />

        <ReminderTable
          title="Broker Reminders"
          data={brokerReminders}
          headers={['Broker', 'Remaining', 'Status', 'Due Date']}
          rowRenderer={(b) => [
            b.brokerName,
            formatCurrency(b.totalRemaining),
            b.status,
            b.dueDate ? formatDate(b.dueDate) : '-',
          ]}
        />

        <ReminderTable
          title="Commissioner Reminders"
          data={commissionerReminders}
          headers={['Commissioner', 'Remaining', 'Status', 'Due Date']}
          rowRenderer={(c) => [
            c.commissionerName,
            formatCurrency(c.totalRemaining),
            c.status,
            c.dueDate ? formatDate(c.dueDate) : '-',
          ]}
        />
      </div>
    </div>
  );
};

const Card = ({ title, value }) => (
  <div className="bg-white shadow rounded p-4">
    <p className="text-sm text-gray-500 mb-1">{title}</p>
    <p className="text-xl font-bold text-blue-600">{formatCurrency(value)}</p>
  </div>
);

const SupplyRow = ({ label, value, bold = false }) => (
  <div className="flex justify-between bg-gray-50 p-2 rounded">
    <span className="text-gray-600">{label}</span>
    <span className={`text-right ${bold ? 'font-bold text-blue-700' : ''}`}>{formatCurrency(value)}</span>
  </div>
);

const ReminderTable = ({ title, data, headers, rowRenderer }) => {
  const [filterDate, setFilterDate] = useState('');

  const filteredData = data.filter((item) => {
    if (!filterDate) return true;
    const due = item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '';
    return due === filterDate;
  });

  return (
    <div className="bg-white shadow rounded p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border px-2 py-1 rounded text-sm"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-2 text-left text-gray-600 font-medium uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-2 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item._id || Math.random()} className="hover:bg-gray-50">
                  {rowRenderer(item).map((cell, idx) => (
                    <td key={idx} className="px-4 py-2 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardPage; 