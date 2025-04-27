import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import routeMap from '../routes/routeMap';

const Sidebar = ({ collapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({
    settings: false,
    activityLog: false,
    inventory: false,
    financial: false,
    customers: false,
    vendors: false,
    brokers: false,
    commissioners: false
  });

  // Log user data when it changes
  useEffect(() => {
    console.log('Sidebar user data:', user);
  }, [user]);

  const toggleExpand = (section) => {
    setExpandedItems(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Check if a path is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Get the active item class
  const activeClass = 'bg-blue-600 text-white';
  const inactiveClass = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

  // Permission functions
  const hasPermission = (permissionKey) => {
    // Admins have access to everything
    if (user?.role === 'Admin') {
      console.log(`Admin user has access to: ${permissionKey}`);
      return true;
    }

    // For workers, check their permissions object
    if (user?.permissions && typeof user.permissions === 'object') {
      const hasAccess = user.permissions[permissionKey] === true;
      console.log(`Permission check for ${permissionKey}: ${hasAccess}, User permissions:`, user.permissions);
      return hasAccess;
    }

    console.log('No valid permissions found for user:', user);
    return false;
  };

  // Check if section should be visible
  const isVisible = (sectionKey) => {
    const hasAccess = hasPermission(sectionKey);
    console.log(`Section visibility check for ${sectionKey}: ${hasAccess}`);
    return hasAccess;
  };

  // Check if child item should be visible
  const isChildVisible = (parentKey, childKey) => {
    const permissionKey = `${parentKey}.${childKey}`;
    const hasAccess = hasPermission(permissionKey);
    console.log(`Child visibility check for ${permissionKey}: ${hasAccess}`);
    return hasAccess;
  };

  // Get all child items that are visible for a section
  const getVisibleChildren = (sectionKey) => {
    if (!routeMap[sectionKey]?.children) {
      console.log(`No children found for section: ${sectionKey}`);
      return {};
    }

    const visibleChildren = {};
    Object.keys(routeMap[sectionKey].children).forEach(childKey => {
      if (isChildVisible(sectionKey, childKey)) {
        visibleChildren[childKey] = routeMap[sectionKey].children[childKey];
      }
    });

    console.log(`Visible children for ${sectionKey}:`, Object.keys(visibleChildren));
    return visibleChildren;
  };

  return (
    <div className={`flex flex-col h-full bg-white shadow-md ${collapsed ? 'w-20' : 'w-64'} transition-width duration-300`}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>}
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={toggleSidebar}
        >
          {collapsed ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {/* Dashboard - always visible */}
          {isVisible('dashboard') && (
            <li>
              <Link
                to={routeMap.dashboard.path}
                className={`flex items-center p-2 rounded-md ${isActive(routeMap.dashboard.path) && !isActive('/settings') ? activeClass : inactiveClass}`}
              >
                <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {!collapsed && <span>Dashboard</span>}
              </Link>
            </li>
          )}

          {/* Fake Invoices */}
          {isVisible('fakeInvoices') && (
            <li>
              <Link
                to={routeMap.fakeInvoices.path}
                className={`flex items-center p-2 rounded-md ${isActive(routeMap.fakeInvoices.path) ? activeClass : inactiveClass}`}
              >
                <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {!collapsed && <span>Fake Invoices</span>}
              </Link>
            </li>
          )}

          {/* Inventory Management */}
          {isVisible('inventory') && Object.keys(getVisibleChildren('inventory')).length > 0 && (
            <li>
              <button
                onClick={() => toggleExpand('inventory')}
                className={`w-full flex items-center justify-between p-2 rounded-md ${isActive(routeMap.inventory.path) ? activeClass : inactiveClass}`}
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  {!collapsed && <span>Inventory</span>}
                </div>
                {!collapsed && (
                  <svg className={`w-4 h-4 transition-transform duration-200 ${expandedItems.inventory ? 'transform rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {expandedItems.inventory && !collapsed && (
                <ul className="pl-10 mt-1 space-y-1">
                  {Object.entries(getVisibleChildren('inventory')).map(([childKey, childRoute]) => (
                    <li key={childKey}>
                      <Link
                        to={childRoute.path}
                        className={`block p-2 rounded-md ${location.pathname === childRoute.path ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                      >
                        {childRoute.label || childKey}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )}

          {/* Financial Management */}
          {isVisible('financial') && Object.keys(getVisibleChildren('financial')).length > 0 && (
            <li>
              <button
                onClick={() => toggleExpand('financial')}
                className={`w-full flex items-center justify-between p-2 rounded-md ${isActive(routeMap.financial.path) ? activeClass : inactiveClass}`}
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {!collapsed && <span>Financial</span>}
                </div>
                {!collapsed && (
                  <svg className={`w-4 h-4 transition-transform duration-200 ${expandedItems.financial ? 'transform rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {expandedItems.financial && !collapsed && (
                <ul className="pl-10 mt-1 space-y-1">
                  {Object.entries(getVisibleChildren('financial')).map(([childKey, childRoute]) => (
                    <li key={childKey}>
                      <Link
                        to={childRoute.path}
                        className={`block p-2 rounded-md ${location.pathname === childRoute.path ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                      >
                        {childRoute.label || childKey}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )}

          {/* Customer Management */}
          {isVisible('customers') && Object.keys(getVisibleChildren('customers')).length > 0 && (
            <li>
              <button
                onClick={() => toggleExpand('customers')}
                className={`w-full flex items-center justify-between p-2 rounded-md ${isActive(routeMap.customers.path) ? activeClass : inactiveClass}`}
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {!collapsed && <span>Customers</span>}
                </div>
                {!collapsed && (
                  <svg className={`w-4 h-4 transition-transform duration-200 ${expandedItems.customers ? 'transform rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {expandedItems.customers && !collapsed && (
                <div className="mt-1 pl-6 space-y-1">
                  {Object.entries(getVisibleChildren('customers')).map(([childKey, childRoute]) => (
                    <Link
                      key={childKey}
                      to={childRoute.path}
                      className={`block p-2 rounded-md ${location.pathname === childRoute.path ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                      {childRoute.label || childKey}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          )}

          {/* Vendor Management */}
          {isVisible('vendors') && Object.keys(getVisibleChildren('vendors')).length > 0 && (
            <li>
              <button
                onClick={() => toggleExpand('vendors')}
                className={`w-full flex items-center justify-between p-2 rounded-md ${isActive(routeMap.vendors.path) ? activeClass : inactiveClass}`}
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {!collapsed && <span>Vendors</span>}
                </div>
                {!collapsed && (
                  <svg className={`w-4 h-4 transition-transform duration-200 ${expandedItems.vendors ? 'transform rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {expandedItems.vendors && !collapsed && (
                <div className="mt-1 pl-6 space-y-1">
                  {Object.entries(getVisibleChildren('vendors')).map(([childKey, childRoute]) => (
                    <Link
                      key={childKey}
                      to={childRoute.path}
                      className={`block p-2 rounded-md ${location.pathname === childRoute.path ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                      {childRoute.label || childKey}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          )}

          {/* Broker Management */}
          {isVisible('brokers') && Object.keys(getVisibleChildren('brokers')).length > 0 && (
            <li>
              <button
                onClick={() => toggleExpand('brokers')}
                className={`w-full flex items-center justify-between p-2 rounded-md ${isActive(routeMap.brokers.path) ? activeClass : inactiveClass}`}
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {!collapsed && <span>Brokers</span>}
                </div>
                {!collapsed && (
                  <svg className={`w-4 h-4 transition-transform duration-200 ${expandedItems.brokers ? 'transform rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {expandedItems.brokers && !collapsed && (
                <div className="mt-1 pl-6 space-y-1">
                  {Object.entries(getVisibleChildren('brokers')).map(([childKey, childRoute]) => (
                    <Link
                      key={childKey}
                      to={childRoute.path}
                      className={`block p-2 rounded-md ${location.pathname === childRoute.path ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                      {childRoute.label || childKey}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          )}

          {/* Commissioner Management */}
          {isVisible('commissioners') && Object.keys(getVisibleChildren('commissioners')).length > 0 && (
            <li>
              <button
                onClick={() => toggleExpand('commissioners')}
                className={`w-full flex items-center justify-between p-2 rounded-md ${isActive(routeMap.commissioners.path) ? activeClass : inactiveClass}`}
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {!collapsed && <span>Commissioners</span>}
                </div>
                {!collapsed && (
                  <svg className={`w-4 h-4 transition-transform duration-200 ${expandedItems.commissioners ? 'transform rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {expandedItems.commissioners && !collapsed && (
                <div className="mt-1 pl-6 space-y-1">
                  {Object.entries(getVisibleChildren('commissioners')).map(([childKey, childRoute]) => (
                    <Link
                      key={childKey}
                      to={childRoute.path}
                      className={`block p-2 rounded-md ${location.pathname === childRoute.path ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                      {childRoute.label || childKey}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          )}

          {/* Settings */}
          {isVisible('settings') && Object.keys(getVisibleChildren('settings')).length > 0 && (
            <li>
              <button
                onClick={() => toggleExpand('settings')}
                className={`w-full flex items-center justify-between p-2 rounded-md ${isActive(routeMap.settings.path) ? activeClass : inactiveClass}`}
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {!collapsed && <span>Settings</span>}
                </div>
                {!collapsed && (
                  <svg className={`w-4 h-4 transition-transform duration-200 ${expandedItems.settings ? 'transform rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {expandedItems.settings && !collapsed && (
                <div className="mt-1 pl-6 space-y-1">
                  {/* Account settings is always visible to logged in users */}
                  <Link
                    to={routeMap.settings.children.account.path}
                    className={`block p-2 rounded-md ${location.pathname === routeMap.settings.children.account.path ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                  >
                    Account Settings
                  </Link>

                  {/* User management is only visible to admins */}
                  {isChildVisible('settings', 'users') && (
                    <Link
                      to={routeMap.settings.children.users.path}
                      className={`block p-2 rounded-md ${location.pathname === routeMap.settings.children.users.path ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                      User Management
                    </Link>
                  )}
                </div>
              )}
            </li>
          )}

          {/* Activity Log */}
          {isVisible('activityLog') && Object.keys(getVisibleChildren('activityLog')).length > 0 && (
            <li>
              <button
                onClick={() => toggleExpand('activityLog')}
                className={`w-full flex items-center justify-between p-2 rounded-md ${isActive(routeMap.activityLog.path) ? activeClass : inactiveClass}`}
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  {!collapsed && <span>Activity Log</span>}
                </div>
                {!collapsed && (
                  <svg className={`w-4 h-4 transition-transform duration-200 ${expandedItems.activityLog ? 'transform rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {expandedItems.activityLog && !collapsed && (
                <div className="mt-1 pl-6 space-y-1">
                  {Object.entries(getVisibleChildren('activityLog')).map(([childKey, childRoute]) => (
                    <Link
                      key={childKey}
                      to={childRoute.path}
                      className={`block p-2 rounded-md ${location.pathname === childRoute.path ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                      {childRoute.label || childKey}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          )}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 