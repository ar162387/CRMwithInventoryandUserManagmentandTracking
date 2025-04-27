import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-end">
                <span className="text-sm text-gray-500">Logged in as</span>
                <span className="text-base font-medium text-gray-800">{user?.username}</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${user?.role === 'Admin'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-blue-100 text-blue-800'
                }`}>
                {user?.role}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 