'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ROLE_LABELS } from '@/lib/utils'

interface UserSession {
  name: string
  username: string
  role: string
  siteId?: string
  siteName?: string
}

interface User {
  id: string
  username: string
  name: string
  role: string
  site?: { id: string; name: string }
  warehouses: { id: string; code: string; name: string }[]
}

interface Site {
  id: string
  name: string
}

interface Warehouse {
  id: string
  code: string
  name: string
  site: { id: string; name: string }
}

export default function UsersPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'STOREKEEPER',
    siteId: '',
    warehouseIds: [] as string[],
  })
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
      if (data.role !== 'SUPER_ADMIN' && data.role !== 'SITE_ADMIN') {
        router.push('/dashboard')
        return
      }
      setCurrentUser(data)
      fetchData(data)
    } catch {
      router.push('/login')
    }
  }

  const fetchData = async (user: UserSession) => {
    try {
      const [usersRes, sitesRes, warehousesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/sites'),
        fetch('/api/admin/warehouses'),
      ])
      const [usersData, sitesData, warehousesData] = await Promise.all([
        usersRes.json(),
        sitesRes.json(),
        warehousesRes.json(),
      ])
      setUsers(usersData.users || [])
      setSites(sitesData.sites || [])
      setWarehouses(warehousesData.warehouses || [])

      if (user.role === 'SITE_ADMIN' && user.siteId) {
        setForm(prev => ({ ...prev, siteId: user.siteId! }))
      }
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setShowModal(false)
      setForm({
        username: '',
        password: '',
        name: '',
        role: 'STOREKEEPER',
        siteId: currentUser?.role === 'SITE_ADMIN' ? currentUser.siteId || '' : '',
        warehouseIds: [],
      })
      fetchData(currentUser!)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }
      fetchData(currentUser!)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  const filteredWarehouses = warehouses.filter(w => 
    !form.siteId || w.site.id === form.siteId
  )

  const handleWarehouseToggle = (warehouseId: string) => {
    setForm(prev => ({
      ...prev,
      warehouseIds: prev.warehouseIds.includes(warehouseId)
        ? prev.warehouseIds.filter(id => id !== warehouseId)
        : [...prev.warehouseIds, warehouseId],
    }))
  }

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

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
              <Link href={isSuperAdmin ? '/admin' : '/admin/site'} className="font-bold text-gray-800 hover:text-amber-600">
                ← Back
              </Link>
              <span className="text-sm text-gray-500">User Management</span>
            </div>
            <div className="flex items-center space-x-4">
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Users</h1>
            <p className="text-gray-500">
              {isSuperAdmin ? 'Manage all system users' : `Manage users for ${currentUser?.siteName}`}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            + Add User
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site/Warehouses</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-600 font-mono text-sm">
                    {user.username}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'SITE_ADMIN' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {user.role === 'SITE_ADMIN' && user.site && (
                      <span className="text-sm text-gray-600">{user.site.name}</span>
                    )}
                    {user.role === 'STOREKEEPER' && user.warehouses.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {user.warehouses.map(w => (
                          <span key={w.id} className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {w.code}
                          </span>
                        ))}
                      </div>
                    )}
                    {user.role === 'SUPER_ADMIN' && (
                      <span className="text-sm text-gray-400">All sites</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {user.username !== currentUser?.username && user.role !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create User</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="label">Username *</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                  className="input-field"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="label">Password *</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className="input-field"
                  placeholder="Enter password"
                />
              </div>

              {isSuperAdmin && (
                <div>
                  <label className="label">Role *</label>
                  <select
                    required
                    value={form.role}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      role: e.target.value,
                      siteId: '',
                      warehouseIds: [],
                    }))}
                    className="select-field"
                  >
                    <option value="STOREKEEPER">Storekeeper</option>
                    <option value="SITE_ADMIN">Site Admin</option>
                  </select>
                </div>
              )}

              {isSuperAdmin && form.role === 'SITE_ADMIN' && (
                <div>
                  <label className="label">Assigned Site *</label>
                  <select
                    required
                    value={form.siteId}
                    onChange={(e) => setForm(prev => ({ ...prev, siteId: e.target.value }))}
                    className="select-field"
                  >
                    <option value="">Select a site</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {(form.role === 'STOREKEEPER' || !isSuperAdmin) && (
                <>
                  {isSuperAdmin && (
                    <div>
                      <label className="label">Filter by Site</label>
                      <select
                        value={form.siteId}
                        onChange={(e) => setForm(prev => ({ 
                          ...prev, 
                          siteId: e.target.value,
                          warehouseIds: [],
                        }))}
                        className="select-field"
                      >
                        <option value="">All sites</option>
                        {sites.map((site) => (
                          <option key={site.id} value={site.id}>{site.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="label">Warehouse Assignments *</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {filteredWarehouses.length === 0 ? (
                        <p className="text-sm text-gray-500">No warehouses available</p>
                      ) : (
                        filteredWarehouses.map((warehouse) => (
                          <label key={warehouse.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.warehouseIds.includes(warehouse.id)}
                              onChange={() => handleWarehouseToggle(warehouse.id)}
                              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                            />
                            <span className="text-sm">
                              <span className="font-mono bg-gray-100 px-1 rounded">{warehouse.code}</span>
                              <span className="ml-2">{warehouse.name}</span>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                    {form.warehouseIds.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {form.warehouseIds.length} warehouse(s) selected
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError('') }}
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
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
