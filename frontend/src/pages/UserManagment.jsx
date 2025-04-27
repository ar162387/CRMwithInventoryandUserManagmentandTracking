import React, { useState, useEffect } from 'react';
import { getAllUsers, deleteUser } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import AddUserModal from '../components/modals/AddUserModal';
import EditUserModal from '../components/modals/EditUserModal';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';
import PermissionsModal from '../components/modals/PermissionsModal';

// TODO: Import Modal components when created
// import AddUserModal from '../components/modals/AddUserModal';
// import EditUserModal from '../components/modals/EditUserModal';
// import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };
  const handleOpenDeleteModal = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };
  const handleOpenPermissionsModal = (user) => {
    setSelectedUser(user);
    setIsPermissionsModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsPermissionsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSuccess = () => {
    fetchUsers();
  };

  // Check if permissions button should be shown
  const showPermissionsButton = (user) => {
    return user.role === 'Worker';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">User Management</h1>

      {/* User Management Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Users</h2>
          <button
            onClick={handleOpenAddModal}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
          >
            Add User
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.fullname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>

                        {showPermissionsButton(user) && (
                          <button
                            onClick={() => handleOpenPermissionsModal(user)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Permissions
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenDeleteModal(user)}
                          disabled={user.username === 'admin' || user._id === currentUser?.id}
                          className={`text-red-600 hover:text-red-900 ${(user.username === 'admin' || user._id === currentUser?.id) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModals}
        onSuccess={handleSuccess}
      />
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModals}
        onSuccess={handleSuccess}
        userToEdit={selectedUser}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        onSuccess={handleSuccess}
        userToDelete={selectedUser}
      />
      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={handleCloseModals}
        onSuccess={handleSuccess}
        userToEdit={selectedUser}
      />

      {/* TODO: Render Modals */}
      {/* {isAddModalOpen && (
        <AddUserModal 
          isOpen={isAddModalOpen} 
          onClose={handleCloseModals} 
          onSuccess={() => { handleCloseModals(); fetchUsers(); }} 
        />
      )} */}
      {/* {isEditModalOpen && selectedUser && (
        <EditUserModal 
          isOpen={isEditModalOpen} 
          onClose={handleCloseModals} 
          userToEdit={selectedUser}
          onSuccess={() => { handleCloseModals(); fetchUsers(); }} 
        />
      )} */}
      {/* {isDeleteModalOpen && selectedUser && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseModals}
          onConfirm={handleDeleteUser}
          itemName={selectedUser.username}
        />
      )} */}

    </div>
  );
};

export default UserManagementPage; 