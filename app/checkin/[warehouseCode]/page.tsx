'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { VISITOR_TYPES, PURPOSES, VisitorType } from '@/lib/utils'

interface WarehouseInfo {
  code: string
  name: string
  siteName: string
}

export default function WarehouseCheckInPage() {
  const router = useRouter()
  const params = useParams()
  const warehouseCode = params.warehouseCode as string
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState('')
  const [warehouseInfo, setWarehouseInfo] = useState<WarehouseInfo | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    visitorType: 'EXTERNAL' as VisitorType,
    company: '',
    department: '',
    purpose: 'GENERAL',
    carPlate: '',
  })

  useEffect(() => {
    validateWarehouse()
  }, [warehouseCode])

  const validateWarehouse = async () => {
    try {
      const response = await fetch(`/api/warehouse/${warehouseCode}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid warehouse code')
        return
      }

      setWarehouseInfo({
        code: data.warehouse.code,
        name: data.warehouse.name,
        siteName: data.warehouse.site.name,
      })
    } catch {
      setError('Failed to validate warehouse')
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          warehouseCode: warehouseCode.toUpperCase(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Check-in failed')
      }

      localStorage.setItem('visitorBrowserToken', data.browserToken)
      localStorage.setItem('visitorWarehouseCode', warehouseCode.toUpperCase())
      router.push(`/checkin/success?id=${data.visitorId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVisitorTypeChange = (type: VisitorType) => {
    setFormData(prev => ({
      ...prev,
      visitorType: type,
      purpose: 'GENERAL',
      company: type === 'STAFF' ? '' : prev.company,
      department: type === 'EXTERNAL' ? '' : prev.department,
      carPlate: type === 'STAFF' ? '' : prev.carPlate,
    }))
  }

  const purposes = PURPOSES[formData.visitorType]

  if (validating) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating warehouse...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!warehouseInfo) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-8">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="card text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Warehouse</h1>
            <p className="text-gray-600 mb-4">{error || 'The warehouse code is invalid or inactive.'}</p>
            <p className="text-sm text-gray-500 mb-6">
              Warehouse Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{warehouseCode?.toUpperCase()}</span>
            </p>
            <Link href="/" className="btn-primary inline-block">
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
        <div className="text-center mb-6">
          <div className="inline-block bg-amber-600 text-white px-4 py-1 rounded-full text-sm font-semibold mb-2">
            {warehouseInfo.siteName}
          </div>
          <h2 className="text-lg text-gray-600">{warehouseInfo.name}</h2>
          <p className="text-sm text-gray-500 font-mono">{warehouseInfo.code}</p>
        </div>

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Visitor Check-In</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="label">Visitor Type *</label>
              <div className="grid grid-cols-2 gap-4">
                {VISITOR_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleVisitorTypeChange(type)}
                    className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                      formData.visitorType === type
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {formData.visitorType === 'EXTERNAL' && (
              <div>
                <label className="label">Company *</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="input-field"
                  placeholder="Enter company name"
                />
              </div>
            )}

            {formData.visitorType === 'STAFF' && (
              <div>
                <label className="label">Department *</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="input-field"
                  placeholder="Enter your department"
                />
              </div>
            )}

            <div>
              <label className="label">Purpose of Visit *</label>
              <select
                required
                value={formData.purpose}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                className="select-field"
                disabled={formData.visitorType === 'STAFF'}
              >
                {purposes.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {purpose}
                  </option>
                ))}
              </select>
              {formData.visitorType === 'STAFF' && (
                <p className="text-sm text-gray-500 mt-1">Staff purpose is locked to GENERAL</p>
              )}
            </div>

            {formData.visitorType === 'EXTERNAL' && (
              <div>
                <label className="label">Car Plate Number</label>
                <input
                  type="text"
                  value={formData.carPlate}
                  onChange={(e) => setFormData(prev => ({ ...prev, carPlate: e.target.value.toUpperCase() }))}
                  className="input-field"
                  placeholder="e.g., ABC 1234"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
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
                'Complete Check-In'
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>© 2024 Harrisons Warehouse. All rights reserved.</p>
        </div>
      </div>
    </main>
  )
}
