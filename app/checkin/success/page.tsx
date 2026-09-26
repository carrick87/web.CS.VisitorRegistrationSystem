'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const visitorId = searchParams.get('id')

  if (!visitorId) {
    return (
      <div className="card text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Check-In System Updated</h1>
        <p className="text-gray-600 mb-6">
          The check-in system has been updated to use visitor tags. Please ask the storekeeper for a
          visitor tag to check in.
        </p>
        <Link href="/" className="btn-primary inline-block">
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="card text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Check-In System Updated</h1>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        Self-service check-out is no longer available. When you leave, please{' '}
        <strong>return your visitor tag</strong> to the storekeeper and they will check you out.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
        <h3 className="font-semibold text-amber-800 mb-2">To check out:</h3>
        <ol className="text-sm text-amber-700 space-y-2">
          <li className="flex items-start gap-2">
            <span className="font-bold text-amber-600">1.</span>
            <span>Find the storekeeper at the warehouse entrance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-amber-600">2.</span>
            <span>Hand back your visitor tag</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-amber-600">3.</span>
            <span>The storekeeper will check you out</span>
          </li>
        </ol>
      </div>

      <Link href="/" className="btn-primary inline-block">
        Back to Home
      </Link>
    </div>
  )
}

export default function CheckInSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <Suspense
          fallback={
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </div>
    </main>
  )
}
