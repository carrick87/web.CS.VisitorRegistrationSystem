'use client'

import Link from 'next/link'

export default function CheckInPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center text-amber-600 hover:text-amber-700 mb-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Home
        </Link>

        <div className="card text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-4">Visitor Check-In</h1>
          <p className="text-gray-500 mb-6">Welcome to Harrisons Warehouse</p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <h2 className="font-semibold text-amber-800 mb-3">How to Check In</h2>
            <ol className="text-sm text-amber-700 space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center font-bold text-amber-800">
                  1
                </span>
                <span>
                  <strong>Get a visitor tag</strong> from the storekeeper at the warehouse entrance
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center font-bold text-amber-800">
                  2
                </span>
                <span>
                  <strong>Scan the QR code</strong> on the tag with your phone camera
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center font-bold text-amber-800">
                  3
                </span>
                <span>
                  <strong>Fill in your details</strong> to complete check-in
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center font-bold text-amber-800">
                  4
                </span>
                <span>
                  <strong>Return the tag</strong> to the storekeeper when you leave
                </span>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Group Visits
            </h3>
            <p className="text-sm text-blue-700">
              Visiting as a group? One tag per group. The first person fills in the full form,
              others just enter their name. The whole group checks out together when you return the
              tag.
            </p>
          </div>

          <p className="text-sm text-gray-500">
            Contact the warehouse staff if you need assistance.
          </p>
        </div>
      </div>
    </main>
  )
}
