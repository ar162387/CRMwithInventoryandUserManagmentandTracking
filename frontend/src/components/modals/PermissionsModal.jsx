import React, { useState, useEffect } from 'react';
import { updateUser } from '../../services/userService';
import routeMap from '../../routes/routeMap';

const PermissionsModal = ({ isOpen, onClose, onSuccess, userToEdit }) => {
  const [permissions, setPermissions] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userToEdit && isOpen) {
      // Initialize permissions from user data or with defaults
      const initialPermissions = userToEdit.permissions || generateDefaultPermissions();
      setPermissions(initialPermissions);

      // Initialize all sections as expanded
      const sections = {};
      Object.keys(routeMap).forEach(key => {
        sections[key] = true;
      });
      setExpandedSections(sections);
    }
  }, [userToEdit, isOpen]);

  const generateDefaultPermissions = () => {
    // Create a permissions object with all routes set to false
    const perms = {};

    // Process main routes
    Object.keys(routeMap).forEach(key => {
      perms[key] = false;

      // Process children routes if they exist
      if (routeMap[key].children) {
        Object.keys(routeMap[key].children).forEach(childKey => {
          perms[`${key}.${childKey}`] = false;
        });
      }
    });

    return perms;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePermissionChange = (permKey, checked) => {
    setPermissions(prev => {
      const updated = { ...prev, [permKey]: checked };

      // If it's a parent permission, update all children
      if (!permKey.includes('.')) {
        // If parent is unchecked, uncheck all children
        if (!checked) {
          Object.keys(routeMap[permKey]?.children || {}).forEach(childKey => {
            updated[`${permKey}.${childKey}`] = false;
          });
        }
      } else {
        // If it's a child permission, don't affect parent
        // Only update the child's own state
        return updated;
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Submitting permissions for user:', userToEdit._id);
      console.log('Permissions being sent:', permissions);

      await updateUser(userToEdit._id, { permissions });
      console.log('Permissions updated successfully');

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating permissions:', err);
      setError(err.response?.data?.message || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !userToEdit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Permissions for {userToEdit.fullname}</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-4">
              Select which areas of the application this user can access.
            </div>

            <div className="space-y-4">
              {Object.keys(routeMap).map(sectionKey => (
                <div key={sectionKey} className="border rounded-md overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={permissions[sectionKey] || false}
                          onChange={(e) => handlePermissionChange(sectionKey, e.target.checked)}
                          className="mr-3 h-5 w-5 text-blue-600"
                        />
                        <span className="font-medium">{routeMap[sectionKey].label || sectionKey}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSection(sectionKey)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className={`w-5 h-5 transition-transform duration-200 ${expandedSections[sectionKey] ? 'transform rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </label>
                  </div>

                  {expandedSections[sectionKey] && routeMap[sectionKey].children && (
                    <div className="p-3 pl-8 space-y-2 bg-white">
                      {Object.keys(routeMap[sectionKey].children).map(childKey => (
                        <label key={`${sectionKey}.${childKey}`} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions[`${sectionKey}.${childKey}`] || false}
                            onChange={(e) => handlePermissionChange(`${sectionKey}.${childKey}`, e.target.checked)}
                            className="mr-3 h-5 w-5 text-blue-600"
                          />
                          <span>{routeMap[sectionKey].children[childKey].label || childKey}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PermissionsModal; 