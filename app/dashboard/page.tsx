'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Warehouse {
  id: string
  code: string
  name: string
  site?: { id: string; name: string }
}

interface Visitor {
  id: string
  name: string
  visitorType: string
  company?: string
  department?: string
  purpose: string
  carPlate?: string
  status: string
  timeIn: string
  timeOut?: string
  checkoutBy?: string
  remarks?: string
  warehouse: {
    id: string
    code: string
    name: string
    site: { id: string; name: string }
  }
}

interface UserSession {
  name: string
  username: string
  role: string
  siteId?: string
  siteName?: string
  warehouses?: Warehouse[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [activeVisitors, setActiveVisitors] = useState<Visitor[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserSession | null>(null)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
  const [forceCompleteModal, setForceCompleteModal] = useState<{ visitor: Visitor | null; open: boolean }>({ visitor: null, open: false })
  const [forceCompleteForm, setForceCompleteForm] = useState({ checkoutBy: '', remarks: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchActiveVisitors()
    }
  }, [user, selectedWarehouse])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (!data.isLoggedIn) {
        router.push('/login')
        return
      }
      setUser(data)
      setWarehouses(data.warehouses || [])
    } catch {
      router.push('/login')
    }
  }

  const fetchActiveVisitors = async () => {
    try {
      const url = selectedWarehouse 
        ? `/api/visitors?status=ACTIVE&warehouseId=${selectedWarehouse}`
        : '/api/visitors?status=ACTIVE'
      const response = await fetch(url)
      const data = await response.json()
      setActiveVisitors(data.visitors || [])
    } catch (error) {
      console.error('Failed to fetch visitors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const openForceComplete = (visitor: Visitor) => {
    setForceCompleteForm({ checkoutBy: user?.name || '', remarks: '' })
    setForceCompleteModal({ visitor, open: true })
  }

  const handleForceComplete = async () => {
    if (!forceCompleteModal.visitor || !forceCompleteForm.checkoutBy) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/visitors/${forceCompleteModal.visitor.id}/force-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forceCompleteForm),
      })

      if (response.ok) {
        setForceCompleteModal({ visitor: null, open: false })
        fetchActiveVisitors()
      }
    } catch (error) {
      console.error('Failed to force complete:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getAdminLink = () => {
    if (user?.role === 'SUPER_ADMIN') return '/admin'
    if (user?.role === 'SITE_ADMIN') return '/admin/site'
    return null
  }

  const adminLink = getAdminLink()

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <span className="font-bold text-gray-800">Harrisons Dashboard</span>
              <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
              {user?.role && (
                <span className={`text-xs px-2 py-1 rounded ${
                  user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                  user.role === 'SITE_ADMIN' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {user.role.replace('_', ' ')}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {adminLink && (
                <Link href={adminLink} className="text-gray-600 hover:text-gray-800">
                  Admin
                </Link>
              )}
              <Link href="/dashboard/history" className="text-gray-600 hover:text-gray-800">
                History
              </Link>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-700">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Active Visitors</h1>
            <p className="text-gray-500">Currently checked-in visitors</p>
          </div>
          
          {/* Warehouse Filter */}
          {warehouses.length > 1 && (
            <div className="mt-4 md:mt-0">
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="select-field w-full md:w-64"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : activeVisitors.length === 0 ? (
          <div className="card text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500">No active visitors at the moment</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeVisitors.map((visitor) => (
              <div key={visitor.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{visitor.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      visitor.visitorType === 'EXTERNAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {visitor.visitorType}
                    </span>
                  </div>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                    ACTIVE
                  </span>
                </div>

                {/* Warehouse Badge */}
                <div className="mb-3 flex items-center">
                  <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded font-mono">
                    {visitor.warehouse.code}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">{visitor.warehouse.name}</span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {visitor.company && (
                    <div><span className="text-gray-400">Company:</span> {visitor.company}</div>
                  )}
                  {visitor.department && (
                    <div><span className="text-gray-400">Department:</span> {visitor.department}</div>
                  )}
                  <div><span className="text-gray-400">Purpose:</span> {visitor.purpose}</div>
                  {visitor.carPlate && (
                    <div><span className="text-gray-400">Car Plate:</span> {visitor.carPlate}</div>
                  )}
                  <div><span className="text-gray-400">Time In:</span> {new Date(visitor.timeIn).toLocaleString()}</div>
                </div>

                <button
                  onClick={() => openForceComplete(visitor)}
                  className="btn-danger w-full text-sm"
                >
                  Force Complete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {forceCompleteModal.open && forceCompleteModal.visitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Force Complete Check-Out</h2>
            <p className="text-gray-600 mb-2">
              Force check-out for <strong>{forceCompleteModal.visitor.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Warehouse: <span className="font-mono bg-gray-100 px-1 rounded">{forceCompleteModal.visitor.warehouse.code}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="label">Checked Out By *</label>
                <input
                  type="text"
                  required
                  value={forceCompleteForm.checkoutBy}
                  onChange={(e) => setForceCompleteForm(prev => ({ ...prev, checkoutBy: e.target.value }))}
                  className="input-field"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="label">Remarks</label>
                <textarea
                  value={forceCompleteForm.remarks}
                  onChange={(e) => setForceCompleteForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Optional remarks..."
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setForceCompleteModal({ visitor: null, open: false })}
                className="btn-secondary flex-1"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleForceComplete}
                className="btn-danger flex-1"
                disabled={submitting || !forceCompleteForm.checkoutBy}
              >
                {submitting ? 'Processing...' : 'Force Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
