'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserSession {
  name: string
  username: string
  role: string
  siteId?: string
  siteName?: string
}

interface Site {
  id: string
  name: string
  code?: string
  _count: { warehouses: number; users: number }
}

interface Warehouse {
  id: string
  code: string
  name: string
  isActive: boolean
  site: { id: string; name: string }
  _count: { visitors: number; users: number }
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [sites, setSites] = useState<Site[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)

  const [showSiteModal, setShowSiteModal] = useState(false)
  const [showWarehouseModal, setShowWarehouseModal] = useState(false)
  const [siteForm, setSiteForm] = useState({ name: '', code: '' })
  const [warehouseForm, setWarehouseForm] = useState({ siteId: '', code: '', name: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (!data.isLoggedIn) {
        router.push('/login')
        return
      }
      if (data.role !== 'SUPER_ADMIN') {
        if (data.role === 'SITE_ADMIN') {
          router.push('/admin/site')
        } else {
          router.push('/dashboard')
        }
        return
      }
      setUser(data)
      fetchData()
    } catch {
      router.push('/login')
    }
  }

  const fetchData = async () => {
    try {
      const [sitesRes, warehousesRes] = await Promise.all([
        fetch('/api/admin/sites'),
        fetch('/api/admin/warehouses'),
      ])
      const [sitesData, warehousesData] = await Promise.all([
        sitesRes.json(),
        warehousesRes.json(),
      ])
      setSites(sitesData.sites || [])
      setWarehouses(warehousesData.warehouses || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/admin/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteForm),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setShowSiteModal(false)
      setSiteForm({ name: '', code: '' })
      fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create site')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/admin/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(warehouseForm),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setShowWarehouseModal(false)
      setWarehouseForm({ siteId: '', code: '', name: '' })
      fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create warehouse')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <span className="font-bold text-gray-800">Super Admin Console</span>
              <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/users" className="text-gray-600 hover:text-gray-800">
                Users
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
                Visitors
              </Link>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-700">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Sites Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Sites</h2>
              <button
                onClick={() => setShowSiteModal(true)}
                className="btn-primary text-sm py-2"
              >
                + Add Site
              </button>
            </div>
            <div className="space-y-4">
              {sites.length === 0 ? (
                <div className="card text-center py-8 text-gray-500">
                  No sites created yet
                </div>
              ) : (
                sites.map((site) => (
                  <div key={site.id} className="card">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">{site.name}</h3>
                        {site.code && (
                          <span className="text-sm font-mono text-gray-500">{site.code}</span>
                        )}
                      </div>
                      <Link
                        href={`/admin/sites/${site.id}`}
                        className="text-amber-600 hover:text-amber-700 text-sm"
                      >
                        View →
                      </Link>
                    </div>
                    <div className="mt-3 flex space-x-4 text-sm text-gray-500">
                      <span>{site._count.warehouses} warehouses</span>
                      <span>{site._count.users} users</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Warehouses Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Warehouses</h2>
              <button
                onClick={() => setShowWarehouseModal(true)}
                className="btn-primary text-sm py-2"
                disabled={sites.length === 0}
              >
                + Add Warehouse
              </button>
            </div>
            <div className="space-y-4">
              {warehouses.length === 0 ? (
                <div className="card text-center py-8 text-gray-500">
                  No warehouses created yet
                </div>
              ) : (
                warehouses.map((warehouse) => (
                  <div key={warehouse.id} className="card">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-800">{warehouse.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            warehouse.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {warehouse.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="font-mono bg-gray-100 px-1 rounded">{warehouse.code}</span>
                          <span className="mx-2">•</span>
                          <span>{warehouse.site.name}</span>
                        </div>
                      </div>
                      <Link
                        href={`/admin/warehouses/${warehouse.id}`}
                        className="text-amber-600 hover:text-amber-700 text-sm"
                      >
                        View →
                      </Link>
                    </div>
                    <div className="mt-3 flex space-x-4 text-sm text-gray-500">
                      <span>{warehouse._count.visitors} visitors</span>
                      <span>{warehouse._count.users} users</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        Check-in URL: <code className="bg-gray-100 px-1 rounded">/checkin/{warehouse.code}</code>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Site Modal */}
      {showSiteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create Site</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateSite} className="space-y-4">
              <div>
                <label className="label">Site Name *</label>
                <input
                  type="text"
                  required
                  value={siteForm.name}
                  onChange={(e) => setSiteForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Sarawak Region"
                />
              </div>
              <div>
                <label className="label">Site Code (Optional)</label>
                <input
                  type="text"
                  value={siteForm.code}
                  onChange={(e) => setSiteForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="input-field"
                  placeholder="e.g., SWK"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => { setShowSiteModal(false); setError('') }}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Warehouse Modal */}
      {showWarehouseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create Warehouse</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateWarehouse} className="space-y-4">
              <div>
                <label className="label">Site *</label>
                <select
                  required
                  value={warehouseForm.siteId}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, siteId: e.target.value }))}
                  className="select-field"
                >
                  <option value="">Select a site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Warehouse Code *</label>
                <input
                  type="text"
                  required
                  value={warehouseForm.code}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="input-field"
                  placeholder="e.g., KCH01"
                />
                <p className="text-xs text-gray-500 mt-1">Unique code used in check-in URLs</p>
              </div>
              <div>
                <label className="label">Warehouse Name *</label>
                <input
                  type="text"
                  required
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Kuching Main Warehouse"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => { setShowWarehouseModal(false); setError('') }}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
