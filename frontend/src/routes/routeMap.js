/**
 * Master route map for the application
 * This file serves as a central registry for all routes in the application
 */

const routeMap = {
  // Dashboard
  dashboard: {
    path: '/',
    label: 'Dashboard',
  },

  // Fake Invoices
  fakeInvoices: {
    path: '/fake-invoices',
    label: 'Fake Invoices',
  },

  // Inventory Management
  inventory: {
    path: '/inventory',
    label: 'Inventory',
    children: {
      manage: {
        path: '/inventory',
        label: 'Manage Inventory',
      },
    },
  },

  // Financial Management
  financial: {
    path: '/financial',
    label: 'Financial',
    children: {
      salesReport: {
        path: '/financial/sales-report',
        label: 'Sales Report',
      },
      balanceSheet: {
        path: '/financial/balance-sheet',
        label: 'Balance Sheet',
      },
    },
  },

  // Customer Management
  customers: {
    path: '/customers',
    label: 'Customers',
    children: {
      list: {
        path: '/customers/list',
        label: 'List Customers',
      },
      invoices: {
        path: '/customer-invoices',
        label: 'Customer Invoices',
      },
      generateInvoice: {
        path: '/generate-customer-invoice',
        label: 'Generate Invoice',
      },
      payables: {
        path: '/customers/payables',
        label: 'Customer Payables',
      },
    },
  },

  // Vendor Management
  vendors: {
    path: '/vendors',
    label: 'Vendors',
    children: {
      list: {
        path: '/vendors/list',
        label: 'List Vendors',
      },
      invoices: {
        path: '/vendors/invoices',
        label: 'Vendor Invoices',
      },
      generate: {
        path: '/vendors/generate',
        label: 'Generate Vendor Invoice',
      },
      payables: {
        path: '/vendors/payables',
        label: 'Vendor Payables',
      },
    },
  },

  // Broker Management
  brokers: {
    path: '/brokers',
    label: 'Brokers',
    children: {
      list: {
        path: '/brokers/list',
        label: 'List Brokers',
      },
      payables: {
        path: '/brokers/payables',
        label: 'Broker Payables',
      },
    },
  },

  // Commissioner Management
  commissioners: {
    path: '/commissioners',
    label: 'Commissioners',
    children: {
      list: {
        path: '/commissioners/list',
        label: 'List Commissioners',
      },
      addSheet: {
        path: '/commissioners/add-sheet',
        label: 'Add Commission Sheet',
      },
      sheets: {
        path: '/commissioners/sheets',
        label: 'Commission Sheets',
      },
    },
  },

  // Settings
  settings: {
    path: '/settings',
    label: 'Settings',
    children: {
      account: {
        path: '/settings/account',
        label: 'Account Settings',
      },
      users: {
        path: '/settings/users',
        label: 'User Management',
      },
    },
  },

  // Activity Log
  activityLog: {
    path: '/activity-log',
    label: 'Activity Log',
    children: {
      viewLogs: {
        path: '/activity-log',
        label: 'View Logs',
      },
    },
  },
};

export default routeMap; 