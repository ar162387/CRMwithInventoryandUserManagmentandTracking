import React, { useState, useEffect, useRef } from 'react';
import { getActivityLogs } from '../services/activityLogService';
import { useAuth } from '../hooks/useAuth';

const ActivityLogPage = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const logsPerPage = 30;

  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userInput, setUserInput] = useState('');
  const [actionInput, setActionInput] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Autocomplete states
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [actionOptions, setActionOptions] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredActions, setFilteredActions] = useState([]);

  // Refs for dropdowns
  const userRef = useRef(null);
  const actionRef = useRef(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await getActivityLogs();
        setLogs(data);
        setFilteredLogs(data);
        setError(null);

        // Extract unique users and actions for autocomplete
        const users = [...new Set(data.map(log => log.username))];
        const actions = [...new Set(data.map(log => log.action))];

        setUserOptions(users);
        setFilteredUsers(users);
        setActionOptions(actions);
        setFilteredActions(actions);

        setTotalPages(Math.ceil(data.length / logsPerPage));
      } catch (err) {
        console.error('Error fetching activity logs:', err);
        setError('Failed to load activity logs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userRef.current && !userRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }

      if (actionRef.current && !actionRef.current.contains(event.target)) {
        setShowActionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter users based on input
  useEffect(() => {
    if (userInput) {
      const filtered = userOptions.filter(username =>
        username.toLowerCase().includes(userInput.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(userOptions);
    }
  }, [userInput, userOptions]);

  // Filter actions based on input
  useEffect(() => {
    if (actionInput) {
      const filtered = actionOptions.filter(action =>
        action.toLowerCase().includes(actionInput.toLowerCase())
      );
      setFilteredActions(filtered);
    } else {
      setFilteredActions(actionOptions);
    }
  }, [actionInput, actionOptions]);

  // Apply all filters
  useEffect(() => {
    let result = [...logs];

    // Apply date filters
    if (startDate) {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      result = result.filter(log => new Date(log.timestamp) >= startDateTime);
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      result = result.filter(log => new Date(log.timestamp) <= endDateTime);
    }

    // Apply user filter
    if (userInput) {
      result = result.filter(log =>
        log.username.toLowerCase().includes(userInput.toLowerCase())
      );
    }

    // Apply action filter
    if (actionInput) {
      result = result.filter(log =>
        log.action.toLowerCase().includes(actionInput.toLowerCase())
      );
    }

    // Apply search filter to details
    if (searchInput) {
      result = result.filter(log => {
        // Check log details
        if (log.details) {
          const detailsStr = JSON.stringify(log.details).toLowerCase();
          if (detailsStr.includes(searchInput.toLowerCase())) {
            return true;
          }
        }

        // Also check other fields
        return (
          log.username.toLowerCase().includes(searchInput.toLowerCase()) ||
          log.action.toLowerCase().includes(searchInput.toLowerCase()) ||
          (log.role && log.role.toLowerCase().includes(searchInput.toLowerCase()))
        );
      });
    }

    // Sort by timestamp (newest first)
    result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setFilteredLogs(result);
    setTotalPages(Math.ceil(result.length / logsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [logs, startDate, endDate, userInput, actionInput, searchInput]);

  // Handle user selection
  const handleUserSelect = (username) => {
    setUserInput(username);
    setShowUserDropdown(false);
  };

  // Handle action selection
  const handleActionSelect = (action) => {
    setActionInput(action);
    setShowActionDropdown(false);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get current logs for pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Activity Log</h1>

      {/* Filters Section */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Filter */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* User Selection */}
          <div ref={userRef} className="relative">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="userInput">
              User
            </label>
            <input
              type="text"
              id="userInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onClick={() => setShowUserDropdown(true)}
              placeholder="Filter by username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {showUserDropdown && filteredUsers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredUsers.map((username, index) => (
                  <div
                    key={index}
                    onClick={() => handleUserSelect(username)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    {username}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Selection */}
          <div ref={actionRef} className="relative">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="actionInput">
              Action
            </label>
            <input
              type="text"
              id="actionInput"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              onClick={() => setShowActionDropdown(true)}
              placeholder="Filter by action"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {showActionDropdown && filteredActions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredActions.map((action, index) => (
                  <div
                    key={index}
                    onClick={() => handleActionSelect(action)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    {action}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Field */}
          <div className="lg:col-span-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="searchInput">
              Search Details
            </label>
            <input
              type="text"
              id="searchInput"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search in log details"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        No activity logs found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    currentLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {log.username}
                              </div>
                              {log.role && (
                                <div className="text-sm text-gray-500">
                                  {log.role}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.details && (
                            <span className="text-xs">
                              {JSON.stringify(log.details, null, 2)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium
                    ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Show limited page numbers with ellipsis for better UX
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium
                          ${pageNumber === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <span
                        key={pageNumber}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium
                    ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}

          {/* Results Summary */}
          <div className="text-center mt-4 text-sm text-gray-600">
            Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, filteredLogs.length)} of {filteredLogs.length} results
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityLogPage; 