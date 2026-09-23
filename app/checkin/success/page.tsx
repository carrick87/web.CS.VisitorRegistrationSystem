'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

interface VisitorData {
  id: string
  name: string
  visitorType: string
  company?: string
  department?: string
  purpose: string
  carPlate?: string
  pin: string
  timeIn: string
  qrCode: string
  warehouse: {
    code: string
    name: string
    siteName: string
  }
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const visitorId = searchParams.get('id')
  const [visitor, setVisitor] = useState<VisitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (visitorId) {
      fetchVisitorData()
    }
  }, [visitorId])

  const fetchVisitorData = async () => {
    try {
      const response = await fetch(`/api/visitor/${visitorId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch visitor data')
      }

      setVisitor(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (error || !visitor) {
    return (
      <div className="card text-center">
        <p className="text-red-600 mb-4">{error || 'Visitor not found'}</p>
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Check-In Successful!</h1>
        <p className="text-gray-500 mt-2">Welcome to {visitor.warehouse.siteName}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-amber-700">Warehouse</p>
            <p className="font-semibold text-amber-900">{visitor.warehouse.name}</p>
          </div>
          <div className="text-right">
            <span className="font-mono bg-amber-100 px-3 py-1 rounded text-amber-800">
              {visitor.warehouse.code}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Your Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Name:</span>
            <span className="font-medium">{visitor.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Type:</span>
            <span className="font-medium">{visitor.visitorType}</span>
          </div>
          {visitor.company && (
            <div className="flex justify-between">
              <span className="text-gray-500">Company:</span>
              <span className="font-medium">{visitor.company}</span>
            </div>
          )}
          {visitor.department && (
            <div className="flex justify-between">
              <span className="text-gray-500">Department:</span>
              <span className="font-medium">{visitor.department}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Purpose:</span>
            <span className="font-medium">{visitor.purpose}</span>
          </div>
          {visitor.carPlate && (
            <div className="flex justify-between">
              <span className="text-gray-500">Car Plate:</span>
              <span className="font-medium">{visitor.carPlate}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Time In:</span>
            <span className="font-medium">{new Date(visitor.timeIn).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Your QR Code</h2>
        <p className="text-sm text-gray-500 mb-4">Show this QR code for quick check-out</p>
        <div className="inline-block bg-white p-4 rounded-lg border-2 border-gray-200">
          <img src={visitor.qrCode} alt="QR Code" className="w-48 h-48" />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-amber-800 mb-2">Your PIN Code</h3>
        <div className="text-center">
          <span className="text-4xl font-bold tracking-widest text-amber-600">{visitor.pin}</span>
        </div>
        <p className="text-sm text-amber-700 mt-2 text-center">
          Remember this PIN for check-out
        </p>
      </div>

      <div className="space-y-3">
        <Link href="/checkout" className="btn-primary w-full block text-center">
          Go to Check-Out
        </Link>
        <Link href="/" className="btn-secondary w-full block text-center">
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default function CheckInSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <Suspense fallback={
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </div>
    </main>
  )
}
