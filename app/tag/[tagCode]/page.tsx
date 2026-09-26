'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { VISITOR_TYPES, PURPOSES, VisitorType, VEHICLE_TYPES, displayLabel } from '@/lib/utils'

interface TagInfo {
  id: string
  code: string
  displayNumber: string
}

interface WarehouseInfo {
  id: string
  code: string
  name: string
  siteName: string
}

interface GroupInfo {
  company: string | null
  purpose: string | null
  vehicleType: string | null
  carPlate: string | null
  startTime: string
}

export default function TagCheckInPage() {
  const router = useRouter()
  const params = useParams()
  const tagCode = (params.tagCode as string).toUpperCase()

  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState('')
  const [tagInfo, setTagInfo] = useState<TagInfo | null>(null)
  const [warehouseInfo, setWarehouseInfo] = useState<WarehouseInfo | null>(null)
  const [hasActiveGroup, setHasActiveGroup] = useState(false)
  const [activeVisitorCount, setActiveVisitorCount] = useState(0)
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    visitorType: 'EXTERNAL' as VisitorType,
    company: '',
    department: '',
    purpose: 'GENERAL',
    vehicleType: 'NONE',
    carPlate: '',
  })

  useEffect(() => {
    validateTag()
  }, [tagCode])

  const validateTag = async () => {
    try {
      const response = await fetch(`/api/tag/${tagCode}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid tag')
        return
      }

      setTagInfo(data.tag)
      setWarehouseInfo(data.warehouse)
      setHasActiveGroup(data.hasActiveGroup)
      setActiveVisitorCount(data.activeVisitorCount)
      setGroupInfo(data.groupInfo)
    } catch {
      setError('Failed to validate tag')
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = hasActiveGroup
        ? { name: formData.name }
        : {
            name: formData.name,
            visitorType: formData.visitorType,
            company: formData.company,
            department: formData.department,
            purpose: formData.purpose,
            vehicleType: formData.vehicleType,
            carPlate: formData.carPlate,
          }

      const response = await fetch(`/api/tag/${tagCode}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Check-in failed')
      }

      router.push(
        `/tag/success?tagCode=${data.tag.code}&tagNumber=${data.tag.displayNumber}&isLeader=${data.isGroupLeader}&groupSize=${data.groupSize}`
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVisitorTypeChange = (type: VisitorType) => {
    setFormData((prev) => ({
      ...prev,
      visitorType: type,
      purpose: 'GENERAL',
      company: type === 'STAFF' ? '' : prev.company,
      department: type === 'EXTERNAL' ? '' : prev.department,
      carPlate: type === 'STAFF' ? '' : prev.carPlate,
      vehicleType: type === 'STAFF' ? 'NONE' : prev.vehicleType,
    }))
  }

  const purposes = PURPOSES[formData.visitorType]

  if (validating) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating tag...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!tagInfo || !warehouseInfo) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-8">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="card text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Tag</h1>
            <p className="text-gray-600 mb-4">{error || 'This tag code is invalid.'}</p>
            <p className="text-sm text-gray-500 mb-6">
              Tag Code:{' '}
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">{tagCode}</span>
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
          <div className="inline-block bg-amber-800 text-white px-4 py-1 rounded-full text-sm font-semibold mb-2">
            {warehouseInfo.siteName}
          </div>
          <h2 className="text-lg text-gray-600">{warehouseInfo.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-sm text-gray-500 font-mono">{warehouseInfo.code}</span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold">
              Tag {tagInfo.displayNumber}
            </span>
          </div>
        </div>

        {hasActiveGroup && groupInfo && (
          <div className="card mb-6 bg-blue-50 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
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
                  Joining {groupInfo.company || 'Group'}
                </p>
                <p className="text-sm text-blue-700">
                  {activeVisitorCount} {activeVisitorCount === 1 ? 'person' : 'people'} on tag{' '}
                  {tagInfo.displayNumber}
                </p>
              </div>
            </div>
            <p className="text-sm text-blue-600">
              Enter your name to join this group. The company, purpose, and vehicle details are
              already set.
            </p>
          </div>
        )}

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {hasActiveGroup ? 'Join Group Check-In' : 'Visitor Check-In'}
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="visitor-name" className="label">
                Full Name *
              </label>
              <input
                id="visitor-name"
                name="name"
                type="text"
                inputMode="text"
                autoComplete="name"
                autoCapitalize="words"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="input-field"
                placeholder="Enter your full name"
                autoFocus
              />
            </div>

            {!hasActiveGroup && (
              <>
                <fieldset>
                  <legend className="label">Visitor Type *</legend>
                  <div className="grid grid-cols-2 gap-4">
                    {VISITOR_TYPES.map((type) => {
                      const id = `visitor-type-${type.toLowerCase()}`
                      const selected = formData.visitorType === type
                      return (
                        <div key={type}>
                          <input
                            id={id}
                            type="radio"
                            name="visitorType"
                            value={type}
                            checked={selected}
                            onChange={() => handleVisitorTypeChange(type)}
                            className="sr-only"
                          />
                          <label
                            htmlFor={id}
                            className={`block py-3 px-4 rounded-lg border-2 font-semibold text-center cursor-pointer transition-all ${
                              selected
                                ? 'border-amber-800 bg-amber-50 text-amber-900'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {displayLabel(type)}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </fieldset>

                {formData.visitorType === 'EXTERNAL' && (
                  <div>
                    <label htmlFor="visitor-company" className="label">
                      Company *
                    </label>
                    <input
                      id="visitor-company"
                      name="organization"
                      type="text"
                      inputMode="text"
                      autoComplete="organization"
                      required
                      value={formData.company}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, company: e.target.value }))
                      }
                      className="input-field"
                      placeholder="Enter company name"
                    />
                  </div>
                )}

                {formData.visitorType === 'STAFF' && (
                  <div>
                    <label htmlFor="visitor-department" className="label">
                      Department *
                    </label>
                    <input
                      id="visitor-department"
                      name="department"
                      type="text"
                      inputMode="text"
                      autoComplete="organization"
                      required
                      value={formData.department}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, department: e.target.value }))
                      }
                      className="input-field"
                      placeholder="Enter your department"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="visit-purpose" className="label">
                    Purpose of Visit *
                  </label>
                  <select
                    id="visit-purpose"
                    name="purpose"
                    required
                    value={formData.purpose}
                    onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
                    className="select-field"
                    disabled={formData.visitorType === 'STAFF'}
                    aria-describedby={formData.visitorType === 'STAFF' ? 'purpose-locked' : undefined}
                  >
                    {purposes.map((purpose) => (
                      <option key={purpose} value={purpose}>
                        {displayLabel(purpose)}
                      </option>
                    ))}
                  </select>
                  {formData.visitorType === 'STAFF' && (
                    <p id="purpose-locked" className="text-sm text-gray-500 mt-1">
                      Staff purpose is locked to General
                    </p>
                  )}
                </div>

                {formData.visitorType === 'EXTERNAL' && (
                  <>
                    <div>
                      <label htmlFor="vehicle-type" className="label">
                        Vehicle Type
                      </label>
                      <select
                        id="vehicle-type"
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, vehicleType: e.target.value }))
                        }
                        className="select-field"
                      >
                        {VEHICLE_TYPES.map((vType) => (
                          <option key={vType} value={vType}>
                            {displayLabel(vType)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.vehicleType !== 'NONE' && (
                      <div>
                        <label htmlFor="license-plate" className="label">
                          License Plate Number
                        </label>
                        <input
                          id="license-plate"
                          name="car-plate"
                          type="text"
                          inputMode="text"
                          autoComplete="off"
                          autoCapitalize="characters"
                          spellCheck={false}
                          value={formData.carPlate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              carPlate: e.target.value.toUpperCase(),
                            }))
                          }
                          className="input-field"
                          placeholder="e.g., ABC 1234"
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : hasActiveGroup ? (
                'Join Group'
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
