'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [browserToken, setBrowserToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('visitorBrowserToken')
    setBrowserToken(token)
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-amber-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            HARRISONS WAREHOUSE
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Visitor Registration
          </h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Welcome to Harrisons Warehouse. Please check in to register your visit.
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <Link href="/checkin" className="block">
            <div className="card hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-amber-500">
              <div className="flex items-center space-x-4">
                <div className="bg-amber-100 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Check In</h2>
                  <p className="text-gray-500">Register your arrival</p>
                </div>
              </div>
            </div>
          </Link>

          {browserToken && (
            <Link href="/checkout" className="block">
              <div className="card hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-4 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Check Out</h2>
                    <p className="text-gray-500">Complete your visit</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          <Link href="/login" className="block">
            <div className="card hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-gray-400">
              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Staff Login</h2>
                  <p className="text-gray-500">Access dashboard</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>© 2024 Harrisons Warehouse. All rights reserved.</p>
        </div>
      </div>
    </main>
  )
}
