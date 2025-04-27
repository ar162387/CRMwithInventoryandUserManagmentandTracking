import React, { useState, useEffect } from 'react';
import { getCustomers, searchCustomers, deleteCustomer } from '../../services/customerService';
import AddCustomerModal from './AddCustomerModal';
import EditCustomerModal from './EditCustomerModal';
import { useAuth } from '../../contexts/AuthContext';

const CustomerList = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Check if user is admin
  const isAdmin = user && user.role === 'Admin';

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Function to fetch all customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle search
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      fetchCustomers();
      return;
    }

    try {
      setLoading(true);
      const data = await searchCustomers(query);
      setCustomers(data);
      setError(null);
    } catch (err) {
      console.error('Error searching customers:', err);
      setError('Failed to search customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle customer deletion
  const handleDelete = async (id) => {
    if (!isAdmin) {
      alert('Only administrators can delete customers');
      return;
    }

    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id);
        // Refresh customer list
        fetchCustomers();
      } catch (err) {
        console.error('Error deleting customer:', err);
        setError('Failed to delete customer. Please try again.');
      }
    }
  };

  // Function to open edit modal
  const handleEdit = (customer) => {
    if (!isAdmin) {
      alert('Only administrators can edit customers');
      return;
    }

    setCurrentCustomer(customer);
    setShowEditModal(true);
  };

  // Function to handle modal close and refresh list
  const handleModalClose = (refresh = false) => {
    setShowAddModal(false);
    setShowEditModal(false);
    setCurrentCustomer(null);

    if (refresh) {
      fetchCustomers();
    }
  };

  // Get paginated customers
  const getPaginatedCustomers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return customers.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(customers.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Customer Management</h1>

      {/* Search and Add New Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search customers by name or city..."
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
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          onClick={() => setShowAddModal(true)}
        >
          Add New Customer
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : getPaginatedCustomers().length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                getPaginatedCustomers().map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.phoneNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.city || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {isAdmin ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer._id)}
                            className="text-red-600 hover:text-red-900"
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
      </div>

      {/* Pagination */}
      {!loading && customers.length > 0 && (
        <div className="flex justify-center mt-4 space-x-2">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              className={`px-3 py-1 rounded ${currentPage === index + 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal
          onClose={() => handleModalClose(false)}
          onSave={() => handleModalClose(true)}
        />
      )}

      {/* Edit Customer Modal */}
      {showEditModal && currentCustomer && (
        <EditCustomerModal
          customer={currentCustomer}
          onClose={() => handleModalClose(false)}
          onSave={() => handleModalClose(true)}
        />
      )}
    </div>
  );
};

export default CustomerList; 