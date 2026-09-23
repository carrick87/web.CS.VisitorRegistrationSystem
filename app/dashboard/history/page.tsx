'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
}

export default function HistoryPage() {
  const router = useRouter()
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'FORCE_COMPLETED'>('ALL')

  useEffect(() => {
    checkAuth()
    fetchVisitors()
  }, [filter])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (!data.isLoggedIn) {
        router.push('/login')
      }
    } catch {
      router.push('/login')
    }
  }

  const fetchVisitors = async () => {
    setLoading(true)
    try {
      const statusParam = filter === 'ALL' ? 'COMPLETED,FORCE_COMPLETED' : filter
      const response = await fetch(`/api/visitors?status=${statusParam}`)
      const data = await response.json()
      setVisitors(data.visitors || [])
    } catch (error) {
      console.error('Failed to fetch visitors:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">COMPLETED</span>
      case 'FORCE_COMPLETED':
        return <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">FORCE COMPLETED</span>
      default:
        return <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{status}</span>
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

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Visitor History</h1>
            <p className="text-gray-500">Past visitor records</p>
          </div>

          <div className="mt-4 md:mt-0 flex space-x-2">
            {(['ALL', 'COMPLETED', 'FORCE_COMPLETED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : visitors.length === 0 ? (
          <div className="card text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No visitor history found</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company/Dept</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visitors.map((visitor) => (
                    <tr key={visitor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{visitor.name}</div>
                        {visitor.carPlate && (
                          <div className="text-sm text-gray-500">{visitor.carPlate}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          visitor.visitorType === 'EXTERNAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {visitor.visitorType}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {visitor.company || visitor.department || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {visitor.purpose}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(visitor.timeIn).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {visitor.timeOut ? new Date(visitor.timeOut).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          {getStatusBadge(visitor.status)}
                          {visitor.checkoutBy && (
                            <div className="text-xs text-gray-500 mt-1">by {visitor.checkoutBy}</div>
                          )}
                          {visitor.remarks && (
                            <div className="text-xs text-gray-400 mt-1">{visitor.remarks}</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
