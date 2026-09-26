'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Warehouse {
  id: string
  code: string
  name: string
  site?: { id: string; name: string }
}

interface TagVisitor {
  id: string
  name: string
  company?: string
  department?: string
  purpose: string
  carPlate?: string
  vehicleType?: string
  visitorType: string
  isGroupLeader: boolean
  timeIn: string
}

interface ActiveTag {
  id: string
  code: string
  displayNumber: string
  warehouse: {
    id: string
    code: string
    name: string
    siteName: string
  }
  visitors: TagVisitor[]
  visitorCount: number
  groupInfo: {
    company: string | null
    purpose: string | null
    vehicleType: string | null
    carPlate: string | null
  } | null
  startTime: string | null
  durationMs: number
  durationHours: number
  isOverdue: boolean
}

interface LegacyVisitor {
  id: string
  name: string
  visitorType: string
  company?: string
  department?: string
  purpose: string
  carPlate?: string
  status: string
  timeIn: string
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

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export default function DashboardPage() {
  const router = useRouter()
  const [activeTags, setActiveTags] = useState<ActiveTag[]>([])
  const [legacyVisitors, setLegacyVisitors] = useState<LegacyVisitor[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserSession | null>(null)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [checkoutModal, setCheckoutModal] = useState<{
    tag: ActiveTag | null
    visitor: TagVisitor | null
    type: 'group' | 'single'
    open: boolean
  }>({ tag: null, visitor: null, type: 'group', open: false })
  const [legacyCheckoutModal, setLegacyCheckoutModal] = useState<{
    visitor: LegacyVisitor | null
    open: boolean
  }>({ visitor: null, open: false })
  const [checkoutForm, setCheckoutForm] = useState({ checkoutBy: '', remarks: '' })
  const [submitting, setSubmitting] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchData()
      const interval = setInterval(fetchData, 30000)
      return () => clearInterval(interval)
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

  const fetchData = async () => {
    try {
      const warehouseParam = selectedWarehouse ? `&warehouseId=${selectedWarehouse}` : ''

      const [tagsRes, legacyRes] = await Promise.all([
        fetch(`/api/tags/active?${warehouseParam}`),
        fetch(`/api/visitors?status=ACTIVE${warehouseParam}`),
      ])

      const [tagsData, legacyData] = await Promise.all([tagsRes.json(), legacyRes.json()])

      setActiveTags(tagsData.activeTags || [])

      const activeTagVisitorIds = new Set(
        (tagsData.activeTags || []).flatMap((t: ActiveTag) => t.visitors.map((v) => v.id))
      )
      const legacyOnly = (legacyData.visitors || []).filter(
        (v: LegacyVisitor) => !activeTagVisitorIds.has(v.id)
      )
      setLegacyVisitors(legacyOnly)
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

  const openGroupCheckout = (tag: ActiveTag) => {
    setCheckoutForm({ checkoutBy: user?.name || '', remarks: '' })
    setCheckoutModal({ tag, visitor: null, type: 'group', open: true })
  }

  const openSingleCheckout = (tag: ActiveTag, visitor: TagVisitor) => {
    setCheckoutForm({ checkoutBy: user?.name || '', remarks: '' })
    setCheckoutModal({ tag, visitor, type: 'single', open: true })
  }

  const openLegacyCheckout = (visitor: LegacyVisitor) => {
    setCheckoutForm({ checkoutBy: user?.name || '', remarks: '' })
    setLegacyCheckoutModal({ visitor, open: true })
  }

  const handleCheckout = async () => {
    if (!checkoutModal.tag || !checkoutForm.checkoutBy) return

    setSubmitting(true)
    try {
      const body =
        checkoutModal.type === 'single' && checkoutModal.visitor
          ? { ...checkoutForm, visitorId: checkoutModal.visitor.id }
          : checkoutForm

      const response = await fetch(`/api/tags/${checkoutModal.tag.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setCheckoutModal({ tag: null, visitor: null, type: 'group', open: false })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to checkout:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLegacyCheckout = async () => {
    if (!legacyCheckoutModal.visitor || !checkoutForm.checkoutBy) return

    setSubmitting(true)
    try {
      const response = await fetch(
        `/api/visitors/${legacyCheckoutModal.visitor.id}/force-complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkoutForm),
        }
      )

      if (response.ok) {
        setLegacyCheckoutModal({ visitor: null, open: false })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to checkout:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredTags = useMemo(() => {
    if (!searchQuery) return activeTags
    const query = searchQuery.toLowerCase()
    return activeTags.filter((tag) => {
      if (tag.code.toLowerCase().includes(query)) return true
      if (tag.displayNumber.toLowerCase().includes(query)) return true
      return tag.visitors.some(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.company?.toLowerCase().includes(query) ||
          v.carPlate?.toLowerCase().includes(query)
      )
    })
  }, [activeTags, searchQuery])

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
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <span className="font-bold text-gray-800 truncate">Harrisons</span>
              <span className="hidden sm:inline text-sm text-gray-500 truncate">
                Welcome, {user?.name}
              </span>
              {user?.role && (
                <span
                  className={`hidden sm:inline text-xs px-2 py-1 rounded whitespace-nowrap ${
                    user.role === 'SUPER_ADMIN'
                      ? 'bg-purple-100 text-purple-700'
                      : user.role === 'SITE_ADMIN'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                  }`}
                >
                  {user.role.replace('_', ' ')}
                </span>
              )}
            </div>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center space-x-4">
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

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden pb-4 space-y-2">
              <div className="text-sm text-gray-600 px-2 py-1">
                {user?.name}
                {user?.role && (
                  <span
                    className={`ml-2 text-xs px-2 py-0.5 rounded ${
                      user.role === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : user.role === 'SITE_ADMIN'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {user.role.replace('_', ' ')}
                  </span>
                )}
              </div>
              {adminLink && (
                <Link
                  href={adminLink}
                  className="block px-2 py-2 text-gray-600 hover:bg-gray-50 rounded"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard/history"
                className="block px-2 py-2 text-gray-600 hover:bg-gray-50 rounded"
              >
                History
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-2 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Active Visitors</h1>
          <p className="text-gray-500">Currently checked-in visitors by tag</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by tag, name, company, or plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
            />
          </div>
          {warehouses.length > 1 && (
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="select-field sm:w-64"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : filteredTags.length === 0 && legacyVisitors.length === 0 ? (
          <div className="card text-center py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-gray-500">No active visitors at the moment</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tag cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className={`card ${tag.isOverdue ? 'border-2 border-red-300 bg-red-50' : ''}`}
                >
                  {/* Tag header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold ${
                          tag.isOverdue
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {tag.displayNumber}
                      </div>
                      <div>
                        <p className="font-mono text-sm text-gray-500">{tag.code}</p>
                        <p className="text-sm text-gray-600">{tag.warehouse.name}</p>
                      </div>
                    </div>
                    {tag.isOverdue && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        Overdue
                      </span>
                    )}
                  </div>

                  {/* Group info */}
                  {tag.groupInfo && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        {tag.groupInfo.company && (
                          <div>
                            <span className="text-gray-400">Company:</span>{' '}
                            <span className="text-gray-700">{tag.groupInfo.company}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400">Purpose:</span>{' '}
                          <span className="text-gray-700">{tag.groupInfo.purpose}</span>
                        </div>
                        {tag.groupInfo.carPlate && (
                          <div>
                            <span className="text-gray-400">Plate:</span>{' '}
                            <span className="text-gray-700">{tag.groupInfo.carPlate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Visitors list */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">
                      {tag.visitorCount} {tag.visitorCount === 1 ? 'person' : 'people'}
                    </p>
                    <ul className="space-y-1">
                      {tag.visitors.map((visitor) => (
                        <li
                          key={visitor.id}
                          className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded"
                        >
                          <span className="flex items-center gap-2">
                            {visitor.isGroupLeader && (
                              <span className="w-2 h-2 bg-amber-500 rounded-full" title="Group leader"></span>
                            )}
                            {visitor.name}
                          </span>
                          {tag.visitorCount > 1 && (
                            <button
                              onClick={() => openSingleCheckout(tag, visitor)}
                              className="text-xs text-gray-500 hover:text-amber-600"
                            >
                              Check out
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Duration and checkout button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span
                      className={`text-sm ${tag.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}
                    >
                      On site {formatDuration(tag.durationMs)}
                    </span>
                    <button
                      onClick={() => openGroupCheckout(tag)}
                      className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Check out {tag.visitorCount > 1 ? 'group' : 'visitor'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Legacy visitors (without tags) */}
            {legacyVisitors.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                  Legacy Visitors (No Tag)
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {legacyVisitors.map((visitor) => (
                    <div key={visitor.id} className="card">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">{visitor.name}</h3>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              visitor.visitorType === 'EXTERNAL'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {visitor.visitorType}
                          </span>
                        </div>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          ACTIVE
                        </span>
                      </div>

                      <div className="mb-3 flex items-center">
                        <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded font-mono">
                          {visitor.warehouse.code}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">{visitor.warehouse.name}</span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        {visitor.company && (
                          <div>
                            <span className="text-gray-400">Company:</span> {visitor.company}
                          </div>
                        )}
                        {visitor.department && (
                          <div>
                            <span className="text-gray-400">Department:</span> {visitor.department}
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400">Purpose:</span> {visitor.purpose}
                        </div>
                        {visitor.carPlate && (
                          <div>
                            <span className="text-gray-400">Car Plate:</span> {visitor.carPlate}
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400">Time In:</span>{' '}
                          {new Date(visitor.timeIn).toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => openLegacyCheckout(visitor)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Check out visitor
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Checkout Modal for Tags */}
      {checkoutModal.open && checkoutModal.tag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {checkoutModal.type === 'group'
                ? `Check Out ${checkoutModal.tag.visitorCount > 1 ? 'Group' : 'Visitor'}`
                : 'Check Out Visitor'}
            </h2>
            <div className="mb-4">
              <p className="text-gray-600">
                {checkoutModal.type === 'group' ? (
                  <>
                    Check out{' '}
                    <strong>
                      {checkoutModal.tag.visitorCount}{' '}
                      {checkoutModal.tag.visitorCount === 1 ? 'person' : 'people'}
                    </strong>{' '}
                    on tag <strong>{checkoutModal.tag.displayNumber}</strong>?
                  </>
                ) : (
                  <>
                    Check out <strong>{checkoutModal.visitor?.name}</strong> from tag{' '}
                    <strong>{checkoutModal.tag.displayNumber}</strong>?
                  </>
                )}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Warehouse:{' '}
                <span className="font-mono bg-gray-100 px-1 rounded">
                  {checkoutModal.tag.warehouse.code}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Checked Out By *</label>
                <input
                  type="text"
                  required
                  value={checkoutForm.checkoutBy}
                  onChange={(e) =>
                    setCheckoutForm((prev) => ({ ...prev, checkoutBy: e.target.value }))
                  }
                  className="input-field"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="label">Remarks</label>
                <textarea
                  value={checkoutForm.remarks}
                  onChange={(e) =>
                    setCheckoutForm((prev) => ({ ...prev, remarks: e.target.value }))
                  }
                  className="input-field"
                  rows={3}
                  placeholder="Optional remarks..."
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={() =>
                  setCheckoutModal({ tag: null, visitor: null, type: 'group', open: false })
                }
                className="btn-secondary flex-1"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                className="btn-primary flex-1"
                disabled={submitting || !checkoutForm.checkoutBy}
              >
                {submitting ? 'Processing...' : 'Check Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal for Legacy Visitors */}
      {legacyCheckoutModal.open && legacyCheckoutModal.visitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Check Out Visitor</h2>
            <p className="text-gray-600 mb-2">
              Check out <strong>{legacyCheckoutModal.visitor.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Warehouse:{' '}
              <span className="font-mono bg-gray-100 px-1 rounded">
                {legacyCheckoutModal.visitor.warehouse.code}
              </span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="label">Checked Out By *</label>
                <input
                  type="text"
                  required
                  value={checkoutForm.checkoutBy}
                  onChange={(e) =>
                    setCheckoutForm((prev) => ({ ...prev, checkoutBy: e.target.value }))
                  }
                  className="input-field"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="label">Remarks</label>
                <textarea
                  value={checkoutForm.remarks}
                  onChange={(e) =>
                    setCheckoutForm((prev) => ({ ...prev, remarks: e.target.value }))
                  }
                  className="input-field"
                  rows={3}
                  placeholder="Optional remarks..."
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setLegacyCheckoutModal({ visitor: null, open: false })}
                className="btn-secondary flex-1"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleLegacyCheckout}
                className="btn-primary flex-1"
                disabled={submitting || !checkoutForm.checkoutBy}
              >
                {submitting ? 'Processing...' : 'Check Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
