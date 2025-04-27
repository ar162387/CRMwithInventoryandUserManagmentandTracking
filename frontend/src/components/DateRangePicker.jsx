import React from 'react';

const DateRangePicker = ({ startDate, endDate, setStartDate, setEndDate }) => {
  return (
    <div className="flex space-x-2">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border px-2 py-1 rounded text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border px-2 py-1 rounded text-sm"
        />
      </div>
    </div>
  );
};

export default DateRangePicker; 