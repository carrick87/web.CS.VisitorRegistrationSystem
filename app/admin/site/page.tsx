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

interface Warehouse {
  id: string
  code: string
  name: string
  isActive: boolean
  _count: { visitors: number; users: number }
}

interface User {
  id: string
  username: string
  name: string
  role: string
  warehouses: { id: string; code: string; name: string }[]
}

export default function SiteAdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'warehouses' | 'users'>('warehouses')

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
      if (data.role === 'SUPER_ADMIN') {
        router.push('/admin')
        return
      }
      if (data.role !== 'SITE_ADMIN') {
        router.push('/dashboard')
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
      const [warehousesRes, usersRes] = await Promise.all([
        fetch('/api/admin/warehouses'),
        fetch('/api/admin/users'),
      ])
      const [warehousesData, usersData] = await Promise.all([
        warehousesRes.json(),
        usersRes.json(),
      ])
      setWarehouses(warehousesData.warehouses || [])
      setUsers(usersData.users?.filter((u: User) => u.role === 'STOREKEEPER') || [])
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
              <span className="font-bold text-gray-800">Site Admin Console</span>
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {user?.siteName}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/users" className="text-gray-600 hover:text-gray-800">
                Users
              </Link>
              <Link href="/admin/tags" className="text-gray-600 hover:text-gray-800">
                Tags
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}</h1>
          <p className="text-gray-500">Manage warehouses and storekeepers for {user?.siteName}</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'warehouses'
                ? 'bg-white text-gray-800 shadow'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Warehouses ({warehouses.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-gray-800 shadow'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Storekeepers ({users.length})
          </button>
        </div>

        {activeTab === 'warehouses' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.length === 0 ? (
              <div className="card text-center py-8 text-gray-500 col-span-full">
                No warehouses assigned to your site
              </div>
            ) : (
              warehouses.map((warehouse) => (
                <div key={warehouse.id} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{warehouse.name}</h3>
                      <span className="text-sm font-mono text-gray-500">{warehouse.code}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      warehouse.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {warehouse.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex space-x-4 text-sm text-gray-500 mb-3">
                    <span>{warehouse._count.visitors} visitors</span>
                    <span>{warehouse._count.users} users</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Tag URL format:</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                      /tag/{warehouse.code}-T01
                    </code>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex justify-end mb-4">
              <Link href="/admin/users" className="btn-primary text-sm py-2">
                + Add Storekeeper
              </Link>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        No storekeepers yet
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-4 text-gray-600 font-mono text-sm">{u.username}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {u.warehouses.map(w => (
                              <span key={w.id} className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                {w.code}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
