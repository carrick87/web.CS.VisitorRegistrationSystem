'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CheckOutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pin, setPin] = useState('')
  const [browserToken, setBrowserToken] = useState<string | null>(null)
  const [visitorData, setVisitorData] = useState<{
    name: string
    timeIn: string
    timeOut: string
  } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('visitorBrowserToken')
    setBrowserToken(token)
    if (!token) {
      setError('No active check-in found. Please check in first.')
    }
  }, [])

  const handlePinChange = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ browserToken, pin }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Check-out failed')
      }

      setVisitorData({
        name: data.name,
        timeIn: data.timeIn,
        timeOut: data.timeOut,
      })
      setSuccess(true)
      localStorage.removeItem('visitorBrowserToken')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success && visitorData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="card">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Check-Out Complete!</h1>
              <p className="text-gray-500 mt-2">Thank you for visiting Harrisons Warehouse</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{visitorData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time In:</span>
                  <span className="font-medium">{new Date(visitorData.timeIn).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time Out:</span>
                  <span className="font-medium">{new Date(visitorData.timeOut).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <Link href="/" className="btn-primary w-full block text-center">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

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
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Visitor Check-Out</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {!browserToken ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">No active check-in session found on this device.</p>
              <Link href="/checkin" className="btn-primary inline-block">
                Go to Check-In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label text-center">Enter Your 4-Digit PIN</label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    className="text-center text-4xl tracking-[0.5em] font-bold w-48 px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="••••"
                    autoFocus
                  />
                </div>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Enter the PIN you received during check-in
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || pin.length !== 4}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Complete Check-Out'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
