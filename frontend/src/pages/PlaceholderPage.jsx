import React from 'react';
import { Link } from 'react-router-dom';

const PlaceholderPage = ({ title = 'Page', description = 'This page is under construction.' }) => {
  return (
    <div className="py-6">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{title}</h1>
        <div className="border-t border-gray-200 pt-4">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <svg
              className="w-16 h-16 text-blue-500 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-lg text-gray-600">{description}</p>
            <p className="text-gray-500">
              This feature will be implemented in an upcoming phase.
            </p>
            <Link
              to="/"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage; 