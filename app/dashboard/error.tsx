'use client';

import { useEffect } from 'react';
import AddNewButton from '@/features/dashboard/components/add-new-btn';
import AddRepo from '@/features/dashboard/components/add-repo';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps): React.ReactElement {
  useEffect(() => {
    // Log client-side errors to your monitoring service
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col justify-start items-center min-h-screen mx-auto max-w-7xl px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <AddNewButton />
        <AddRepo />
      </div>
      <div className="mt-10 flex flex-col justify-center items-center w-full">
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-red-500 mb-4">We couldn't load your projects. Please try again.</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
