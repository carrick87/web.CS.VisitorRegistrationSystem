'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { displayLabel, formatDateTime } from '@/lib/utils'

interface Warehouse {
  id: string
  code: string
  name: string
}

interface Tag {
  id: string
  code: string
  displayNumber: string
}

interface Visitor {
  id: string
  name: string
  visitorType: string
  company?: string
  department?: string
  purpose: string
  carPlate?: string
  vehicleType?: string
  status: string
  timeIn: string
  timeOut?: string
  checkoutBy?: string
  remarks?: string
  isGroupLeader?: boolean
  tag?: Tag | null
  warehouse: {
    id: string
    code: string
    name: string
    site: { id: string; name: string }
  }
}

interface UserSession {
  name: string
  role: string
  siteId?: string
}

type StatusFilter = 'ALL' | 'COMPLETED' | 'STAFF_CHECKOUT'

export default function HistoryPage() {
  const router = useRouter()
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
  const [deleteModal, setDeleteModal] = useState<{ visitor: Visitor | null; open: boolean }>({
    visitor: null,
    open: false,
  })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchVisitors()
    }
  }, [filter, selectedWarehouse, user])

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

  const fetchVisitors = async () => {
    setLoading(true)
    try {
      const statusParam =
        filter === 'ALL' ? 'COMPLETED,FORCE_COMPLETED,STAFF_CHECKOUT' : filter === 'STAFF_CHECKOUT' ? 'FORCE_COMPLETED,STAFF_CHECKOUT' : filter
      let url = `/api/visitors?status=${statusParam}`
      if (selectedWarehouse) {
        url += `&warehouseId=${selectedWarehouse}`
      }
      const response = await fetch(url)
      const data = await response.json()
      setVisitors(data.visitors || [])
    } catch (error) {
      console.error('Failed to fetch visitors:', error)
    } finally {
      setLoading(false)
    }
  }

  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'SITE_ADMIN'

  const handleDelete = async () => {
    if (!deleteModal.visitor) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/visitors/${deleteModal.visitor.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteModal({ visitor: null, open: false })
        fetchVisitors()
      }
    } catch (error) {
      console.error('Failed to delete visitor:', error)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
            Checked out
          </span>
        )
      case 'FORCE_COMPLETED':
      case 'STAFF_CHECKOUT':
        return (
          <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
            Checked out by staff
          </span>
        )
      default:
        return (
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="font-bold text-gray-800 hover:text-amber-600">
                ← Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Visitor History</h1>
          <p className="text-gray-500">Past visitor records</p>
        </div>

        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'COMPLETED', 'STAFF_CHECKOUT'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-amber-800 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {status === 'ALL'
                  ? 'All'
                  : status === 'COMPLETED'
                    ? 'Self checkout'
                    : 'Staff checkout'}
              </button>
            ))}
          </div>

          {warehouses.length > 1 && (
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="select-field w-full sm:w-64"
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
        ) : visitors.length === 0 ? (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500">No visitor history found</p>
          </div>
        ) : (
          <>
            {/* Mobile view - cards */}
            <div className="sm:hidden space-y-4">
              {visitors.map((visitor) => (
                <div key={visitor.id} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{visitor.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            visitor.visitorType === 'EXTERNAL'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {displayLabel(visitor.visitorType)}
                        </span>
                        {visitor.tag && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                            Tag {visitor.tag.displayNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(visitor.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded">
                        {visitor.warehouse.code}
                      </span>
                      <span className="text-gray-500 text-xs">{visitor.warehouse.name}</span>
                    </div>

                    {(visitor.company || visitor.department) && (
                      <div className="text-gray-600">
                        {visitor.company || visitor.department}
                      </div>
                    )}

                    <div className="text-gray-500">
                      <span className="text-gray-400">Purpose:</span> {displayLabel(visitor.purpose)}
                    </div>

                    {visitor.carPlate && (
                      <div className="text-gray-500">
                        <span className="text-gray-400">Plate:</span> {visitor.carPlate}
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        <span className="text-gray-400">In:</span>{' '}
                        {formatDateTime(visitor.timeIn)}
                      </div>
                      <div>
                        <span className="text-gray-400">Out:</span>{' '}
                        {visitor.timeOut ? formatDateTime(visitor.timeOut) : '-'}
                      </div>
                    </div>

                    {visitor.checkoutBy && (
                      <div className="text-xs text-gray-500">
                        <span className="text-gray-400">By:</span> {visitor.checkoutBy}
                      </div>
                    )}
                    {visitor.remarks && (
                      <div className="text-xs text-gray-400 italic">{visitor.remarks}</div>
                    )}
                  </div>

                  {canDelete && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => setDeleteModal({ visitor, open: true })}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Delete record
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop view - table */}
            <div className="hidden sm:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Warehouse
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visitor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company/Dept
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time In
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Out
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {canDelete && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {visitors.map((visitor) => (
                      <tr key={visitor.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded">
                            {visitor.warehouse.code}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{visitor.name}</div>
                          {visitor.carPlate && (
                            <div className="text-sm text-gray-500">{visitor.carPlate}</div>
                          )}
                          {visitor.tag && (
                            <div className="text-xs text-amber-600">
                              Tag {visitor.tag.displayNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              visitor.visitorType === 'EXTERNAL'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {displayLabel(visitor.visitorType)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {visitor.company || visitor.department || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {displayLabel(visitor.purpose)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDateTime(visitor.timeIn)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {visitor.timeOut ? formatDateTime(visitor.timeOut) : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            {getStatusBadge(visitor.status)}
                            {visitor.checkoutBy && (
                              <div className="text-xs text-gray-500 mt-1">
                                by {visitor.checkoutBy}
                              </div>
                            )}
                            {visitor.remarks && (
                              <div className="text-xs text-gray-400 mt-1">{visitor.remarks}</div>
                            )}
                          </div>
                        </td>
                        {canDelete && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setDeleteModal({ visitor, open: true })}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Delete Modal */}
      {deleteModal.open && deleteModal.visitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Delete Visitor Record</h2>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete the record for{' '}
              <strong>{deleteModal.visitor.name}</strong>?
            </p>
            <p className="text-sm text-red-600 mb-4">This action cannot be undone.</p>

            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteModal({ visitor: null, open: false })}
                className="btn-secondary flex-1"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger flex-1"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
