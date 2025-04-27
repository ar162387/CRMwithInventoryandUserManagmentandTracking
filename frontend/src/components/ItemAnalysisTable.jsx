import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/helpers';

const headers = [
  { key: 'itemName', label: 'Item' },
  { key: 'soldQuantity', label: 'Sold Qty' },
  { key: 'itemRevenue', label: 'Revenue' },
  { key: 'orderCount', label: 'Order Count' },
  { key: 'soldCount', label: 'Sold Count' },
];

const ItemAnalysisTable = ({ startDate, endDate }) => {
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('itemRevenue');
  const [sortOrder, setSortOrder] = useState('desc');

  const pageSize = 8;

  const buildQuery = () => {
    const params = new URLSearchParams({ page, pageSize, search, sortField, sortOrder });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return `?${params.toString()}`;
  };

  const fetchData = async () => {
    try {
      const res = await api.get(`/sales-report/item-analysis${buildQuery()}`);
      setData(res.data.data);
      setTotalRecords(res.data.totalRecords);
    } catch (err) {
      console.error('Item analysis fetch error', err);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, page, search, sortField, sortOrder]);

  const totalPages = Math.ceil(totalRecords / pageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="bg-white shadow rounded p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Item Analysis</h2>
        <input
          type="text"
          placeholder="Search item"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border px-2 py-1 rounded text-sm"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              {headers.map((h) => (
                <th
                  key={h.key}
                  className="px-4 py-2 text-left text-gray-600 font-medium cursor-pointer select-none"
                  onClick={() => handleSort(h.key)}
                >
                  {h.label}
                  {sortField === h.key && (
                    <span className="ml-1 text-xs">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-2 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">{row.itemName}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{row.soldQuantity}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(row.itemRevenue)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{row.orderCount}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{row.soldCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center space-x-2 mt-2 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-2 py-1 border rounded ${page === 1 ? 'text-gray-400 border-gray-300' : 'hover:bg-gray-100'}`}
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className={`px-2 py-1 border rounded ${page === totalPages ? 'text-gray-400 border-gray-300' : 'hover:bg-gray-100'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ItemAnalysisTable; 