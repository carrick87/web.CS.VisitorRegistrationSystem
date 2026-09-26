'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface WarehouseInfo {
  code: string
  name: string
  siteName: string
}

export default function WarehouseCheckInPage() {
  const params = useParams()
  const warehouseCode = params.warehouseCode as string
  const [validating, setValidating] = useState(true)
  const [warehouseInfo, setWarehouseInfo] = useState<WarehouseInfo | null>(null)

  useEffect(() => {
    validateWarehouse()
  }, [warehouseCode])

  const validateWarehouse = async () => {
    try {
      const response = await fetch(`/api/warehouse/${warehouseCode}`)
      const data = await response.json()

      if (response.ok) {
        setWarehouseInfo({
          code: data.warehouse.code,
          name: data.warehouse.name,
          siteName: data.warehouse.site.name,
        })
      }
    } catch {
      // Warehouse not found, that's okay
    } finally {
      setValidating(false)
    }
  }

  if (validating) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8">
      <div className="container mx-auto px-4 max-w-lg">
        {warehouseInfo && (
          <div className="text-center mb-6">
            <div className="inline-block bg-amber-600 text-white px-4 py-1 rounded-full text-sm font-semibold mb-2">
              {warehouseInfo.siteName}
            </div>
            <h2 className="text-lg text-gray-600">{warehouseInfo.name}</h2>
            <p className="text-sm text-gray-500 font-mono">{warehouseInfo.code}</p>
          </div>
        )}

        <div className="card text-center py-12">
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

          <h1 className="text-2xl font-bold text-gray-800 mb-4">Check-In Has Changed</h1>

          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            We now use <strong>visitor tags</strong> for check-in. Please ask the storekeeper for a
            tag to begin your visit.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-amber-800 mb-2">How it works:</h3>
            <ol className="text-sm text-amber-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">1.</span>
                <span>Get a visitor tag from the storekeeper</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">2.</span>
                <span>Scan the QR code on the tag with your phone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">3.</span>
                <span>Fill in your details to check in</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">4.</span>
                <span>Return the tag when you leave</span>
              </li>
            </ol>
          </div>

          <Link href="/" className="btn-primary inline-block">
            Back to Home
          </Link>
        </div>

        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>© 2024 Harrisons Warehouse. All rights reserved.</p>
        </div>
      </div>
    </main>
  )
}
