import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import DateRangePicker from '../../components/DateRangePicker';
import BarChart from '../../components/BarChart';
import ItemAnalysisTable from '../../components/ItemAnalysisTable';

const SalesReportPage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [sectionA, setSectionA] = useState({ revenueFromItems: 0, revenueFromCommissions: 0, totalSales: 0 });
  const [topItems, setTopItems] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return params.toString() ? `?${params.toString()}` : '';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = buildQuery();
      const [invRes, secARes, topItemsRes, topCustRes] = await Promise.all([
        api.get('/sales-report/inventory/total-items'),
        api.get(`/sales-report/section-a${query}`),
        api.get(`/sales-report/top-selling-items${query}`),
        api.get(`/sales-report/top-paying-customers${query}`),
      ]);
      setTotalItems(invRes.data.totalItems || 0);
      setSectionA(secARes.data);
      setTopItems(topItemsRes.data);
      setTopCustomers(topCustRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load sales report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Sales Report</h1>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Inventory Items" value={totalItems} showCurrency={false} />
        <Card title="Revenue From Items" value={sectionA.revenueFromItems} />
        <Card title="Revenue From Commissions" value={sectionA.revenueFromCommissions} />
        <Card title="Total Sales" value={sectionA.totalSales} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartSection title="Top Selling Items" data={topItems} labelKey="itemName" valueKey="revenue" />
        <ChartSection title="Top Paying Customers" data={topCustomers} labelKey="customerName" valueKey="revenue" />
      </div>

      {/* Item Analysis */}
      <ItemAnalysisTable startDate={startDate} endDate={endDate} />
    </div>
  );
};

const Card = ({ title, value, showCurrency = true }) => (
  <div className="bg-white shadow rounded p-4">
    <p className="text-sm text-gray-500 mb-1 truncate">{title}</p>
    <p className="text-xl font-bold text-blue-600 break-words">
      {showCurrency ? formatCurrency(value) : value.toLocaleString()}
    </p>
  </div>
);

const ChartSection = ({ title, data, labelKey, valueKey }) => (
  <div className="bg-white shadow rounded p-4">
    <h2 className="text-lg font-semibold mb-4">{title}</h2>
    {data.length === 0 ? (
      <p className="text-sm text-gray-500">No data available</p>
    ) : (
      <BarChart data={data} labelKey={labelKey} valueKey={valueKey} />
    )}
  </div>
);

export default SalesReportPage; 