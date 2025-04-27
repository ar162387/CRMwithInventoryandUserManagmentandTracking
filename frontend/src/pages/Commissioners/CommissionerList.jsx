import React, { useState, useEffect } from 'react';
import { getCommissioners, searchCommissioners, deleteCommissioner } from '../../services/commissionerService';
import AddCommissionerModal from './AddCommissionerModal';
import EditCommissionerModal from './EditCommissionerModal';
import { useAuth } from '../../contexts/AuthContext';

const CommissionerList = () => {
  const { user } = useAuth();
  const [commissioners, setCommissioners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCommissioner, setCurrentCommissioner] = useState(null);

  // Check if user is admin
  const isAdmin = user && user.role === 'Admin';

  // Fetch commissioners on component mount
  useEffect(() => {
    fetchCommissioners();
  }, []);

  // Function to fetch all commissioners
  const fetchCommissioners = async () => {
    try {
      setLoading(true);
      const data = await getCommissioners();
      setCommissioners(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching commissioners:', err);
      setError('Failed to load commissioners. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle search
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      fetchCommissioners();
      return;
    }

    try {
      setLoading(true);
      const data = await searchCommissioners(query);
      setCommissioners(data);
      setError(null);
    } catch (err) {
      console.error('Error searching commissioners:', err);
      setError('Failed to search commissioners. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle commissioner deletion
  const handleDelete = async (id, totalRemaining) => {
    if (totalRemaining !== 0) {
      alert('Cannot delete commissioner with remaining balance.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this commissioner?')) {
      try {
        await deleteCommissioner(id);
        // Refresh commissioner list
        fetchCommissioners();
      } catch (err) {
        console.error('Error deleting commissioner:', err);
        if (err.response?.data?.message) {
          alert(err.response.data.message);
        } else {
          setError('Failed to delete commissioner. Please try again.');
        }
      }
    }
  };

  // Function to open edit modal
  const handleEdit = (commissioner) => {
    setCurrentCommissioner(commissioner);
    setShowEditModal(true);
  };

  // Function to handle modal close and refresh list
  const handleModalClose = (refresh = false) => {
    setShowAddModal(false);
    setShowEditModal(false);
    setCurrentCommissioner(null);

    if (refresh) {
      fetchCommissioners();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Commissioner Management</h1>

      {/* Search and Add New Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search commissioners by name or city..."
            value={searchQuery}
            onChange={handleSearch}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-300"
          onClick={() => setShowAddModal(true)}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add New Commissioner
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      )}

      {/* Commissioners Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commissioner Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone Number
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Commission (PKR)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Paid (PKR)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remaining (PKR)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600 mr-2"></div>
                    Loading commissioners...
                  </div>
                </td>
              </tr>
            ) : commissioners.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchQuery ? 'No commissioners match your search.' : 'No commissioners found. Add your first commissioner!'}
                </td>
              </tr>
            ) : (
              commissioners.map(commissioner => (
                <tr key={commissioner._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{commissioner.commissionerName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{commissioner.phoneNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{commissioner.city || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{commissioner.totalCommission.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{commissioner.totalPaid.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{commissioner.totalRemaining.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {isAdmin ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(commissioner)}
                          className="text-indigo-600 hover:text-indigo-900 transition duration-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(commissioner._id, commissioner.totalRemaining)}
                          className="text-red-600 hover:text-red-900 transition duration-300"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">No actions available</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Commissioner Modal */}
      {showAddModal && (
        <AddCommissionerModal
          onClose={() => handleModalClose(false)}
          onSave={() => handleModalClose(true)}
        />
      )}

      {/* Edit Commissioner Modal */}
      {showEditModal && currentCommissioner && (
        <EditCommissionerModal
          commissioner={currentCommissioner}
          onClose={() => handleModalClose(false)}
          onSave={() => handleModalClose(true)}
        />
      )}
    </div>
  );
};

export default CommissionerList; 