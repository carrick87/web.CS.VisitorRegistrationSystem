'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const tagCode = searchParams.get('tagCode')
  const tagNumber = searchParams.get('tagNumber')
  const isLeader = searchParams.get('isLeader') === 'true'
  const groupSize = parseInt(searchParams.get('groupSize') || '1', 10)

  if (!tagCode || !tagNumber) {
    return (
      <div className="card text-center">
        <p className="text-red-600 mb-4">Invalid check-in data</p>
        <Link href="/" className="btn-primary inline-block">
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">You&apos;re Checked In!</h1>
        <p className="text-gray-500 mt-2">
          {isLeader ? 'Group visit started' : 'You have joined the group'}
        </p>
      </div>

      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6 text-center">
        <p className="text-sm text-amber-700 font-medium mb-2">Your Tag Number</p>
        <div className="text-5xl font-bold text-amber-800 mb-2">{tagNumber}</div>
        <p className="text-sm font-mono text-amber-600">{tagCode}</p>
      </div>

      {groupSize > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-600"
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
            </div>
            <div>
              <p className="font-semibold text-blue-900">
                {groupSize} {groupSize === 1 ? 'person' : 'people'} on this tag
              </p>
              <p className="text-sm text-blue-700">
                {isLeader ? 'Others can scan this tag to join your group' : 'You are part of a group visit'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-amber-600"
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
          <div>
            <p className="font-semibold text-gray-800">When You Leave</p>
            <p className="text-sm text-gray-600 mt-1">
              Hand this tag back to the storekeeper. They will check you out.
            </p>
          </div>
        </div>
      </div>

      <Link href="/" className="btn-secondary w-full block text-center">
        Done
      </Link>
    </div>
  )
}

export default function TagSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <Suspense
          fallback={
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </div>
    </main>
  )
}
