'use client'

import Link from 'next/link'

export default function CheckInPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <Link href="/" className="inline-flex items-center text-amber-600 hover:text-amber-700 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Home
        </Link>

        <div className="card">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Visitor Check-In</h1>
            <p className="text-gray-500 mt-2">Welcome to Harrisons Warehouse</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-amber-800 mb-2">How to Check In</h2>
            <p className="text-sm text-amber-700">
              To check in, please scan the QR code at the warehouse gate or use the check-in link provided by the warehouse staff.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-2">Check-in URL Format</h3>
              <code className="text-sm bg-white px-3 py-2 rounded border border-gray-200 block">
                /checkin/[WAREHOUSE_CODE]
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Example: /checkin/KCH01 for Kuching Warehouse 01
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Contact the warehouse staff if you need assistance.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
