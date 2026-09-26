'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { sortByCode } from '@/lib/utils'

interface Warehouse {
  id: string
  code: string
  name: string
  siteName?: string
  site?: { id: string; name: string }
}

interface Tag {
  id: string
  code: string
  displayNumber: string
  warehouse: {
    id: string
    code: string
    name: string
    siteName: string
  }
  activeVisitorCount: number
  isInUse: boolean
  createdAt: string
}

interface UserSession {
  name: string
  role: string
  siteId?: string
  warehouses?: Warehouse[]
}

function compareTagNumber(a: string, b: string): number {
  const aNum = Number.parseInt(a, 10)
  const bNum = Number.parseInt(b, 10)
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && aNum !== bNum) {
    return aNum - bNum
  }
  return a.localeCompare(b)
}

function groupTagsByWarehouse(source: Tag[]) {
  const groups = new Map<string, { warehouse: Tag['warehouse']; tags: Tag[] }>()
  for (const tag of source) {
    const existing = groups.get(tag.warehouse.id)
    if (existing) {
      existing.tags.push(tag)
    } else {
      groups.set(tag.warehouse.id, { warehouse: tag.warehouse, tags: [tag] })
    }
  }

  return Array.from(groups.values())
    .sort((a, b) => a.warehouse.code.localeCompare(b.warehouse.code))
    .map((group) => ({
      ...group,
      tags: [...group.tags].sort((a, b) => compareTagNumber(a.displayNumber, b.displayNumber)),
    }))
}

export default function TagManagementPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printTarget, setPrintTarget] = useState<'all' | string | null>(null)
  const [createForm, setCreateForm] = useState({ warehouseId: '', displayNumber: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ tag: Tag | null; open: boolean }>({
    tag: null,
    open: false,
  })
  const [deleting, setDeleting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchTags()
    }
  }, [user])

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
      setUser(data)

      const warehousesResponse = await fetch('/api/admin/warehouses')
      if (warehousesResponse.ok) {
        const warehousesData = await warehousesResponse.json()
        const warehouseList = (warehousesData.warehouses || []).map(
          (warehouse: Warehouse & { site?: { id: string; name: string } }) => ({
            id: warehouse.id,
            code: warehouse.code,
            name: warehouse.name,
            siteName: warehouse.site?.name || warehouse.siteName,
            site: warehouse.site,
          })
        )
        setWarehouses(sortByCode(warehouseList))
      } else {
        setWarehouses(sortByCode(data.warehouses || []))
      }
    } catch {
      router.push('/login')
    }
  }

  const fetchTags = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/tags')
      const data = await response.json()
      setTags(data.tags || [])
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setShowCreateModal(false)
      setCreateForm({ warehouseId: '', displayNumber: '' })
      fetchTags()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create tag')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.tag) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/tags/${deleteModal.tag.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setDeleteModal({ tag: null, open: false })
      fetchTags()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag')
    } finally {
      setDeleting(false)
    }
  }

  const visibleTags = selectedWarehouse
    ? tags.filter((tag) => tag.warehouse.id === selectedWarehouse)
    : tags
  const groupedTags = groupTagsByWarehouse(visibleTags)
  const printSections =
    showPrintModal && printTarget
      ? groupTagsByWarehouse(
          printTarget === 'all'
            ? tags
            : tags.filter((tag) => tag.warehouse.id === printTarget)
        )
      : []
  const printTitle =
    printTarget === 'all' ? 'All Warehouses' : printSections[0]?.warehouse.code || ''

  const openPrintModal = (target: 'all' | string) => {
    setPrintTarget(target)
    setShowPrintModal(true)
  }

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Tag Labels - ${printTitle}</title>
            <style>
              @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none; }
              }
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
              }
              .label-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .label {
                border: 2px dashed #ccc;
                padding: 20px;
                text-align: center;
                page-break-inside: avoid;
              }
              .label-qr {
                margin-bottom: 10px;
              }
              .label-qr img {
                width: 120px;
                height: 120px;
              }
              .label-number {
                font-size: 48px;
                font-weight: bold;
                color: #b45309;
                margin: 10px 0;
              }
              .label-code {
                font-family: monospace;
                font-size: 14px;
                color: #666;
                margin-bottom: 5px;
              }
              .label-warehouse {
                font-size: 12px;
                color: #888;
              }
              .label-instruction {
                font-size: 11px;
                color: #b45309;
                margin-top: 10px;
                font-weight: 500;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .header p {
                color: #666;
                margin: 5px 0 0 0;
              }
              .warehouse-sheet + .warehouse-sheet {
                page-break-before: always;
                break-before: page;
              }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
            <script>window.onload = function() { window.print(); }</script>
          </body>
          </html>
        `)
        printWindow.document.close()
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href={user?.role === 'SUPER_ADMIN' ? '/admin' : '/admin/site'}
                className="font-bold text-gray-800 hover:text-amber-600"
              >
                ← Admin
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Tag Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Visitor Tags</h1>
            <p className="text-gray-500">Manage physical visitor tags for each warehouse</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => openPrintModal('all')}
              className="btn-secondary"
              disabled={tags.length === 0}
            >
              Print all labels
            </button>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              + Create Tag
            </button>
          </div>
        </div>

        {/* Warehouse filter */}
        {warehouses.length > 1 && (
          <div className="mb-6">
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
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : tags.length === 0 ? (
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <p className="text-gray-500 mb-4">No tags created yet</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              Create Your First Tag
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedTags.map(({ warehouse, tags: warehouseTags }) => (
              <div key={warehouse.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded">
                      {warehouse.code}
                    </span>
                    <span className="font-semibold text-gray-800">{warehouse.name}</span>
                    <span className="text-sm text-gray-500">({warehouseTags.length} tags)</span>
                  </div>
                  <button
                    onClick={() => openPrintModal(warehouse.id)}
                    className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    Print Labels
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {warehouseTags.map((tag) => (
                    <div
                      key={tag.id}
                      className={`card p-4 text-center ${tag.isInUse ? 'bg-green-50 border border-green-200' : ''}`}
                    >
                      <div className="text-3xl font-bold text-amber-700 mb-1">
                        {tag.displayNumber}
                      </div>
                      <div className="text-xs font-mono text-gray-500 mb-2">{tag.code}</div>
                      {tag.isInUse ? (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          In use ({tag.activeVisitorCount})
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteModal({ tag, open: true })}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Tag Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create Tag</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Warehouse *</label>
                <select
                  required
                  value={createForm.warehouseId}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, warehouseId: e.target.value }))
                  }
                  className="select-field"
                >
                  <option value="">Select a warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tag Number *</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  required
                  value={createForm.displayNumber}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, displayNumber: e.target.value }))
                  }
                  className="input-field"
                  placeholder="e.g., 1, 2, 3..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will create tag code: {createForm.warehouseId && warehouses.find((w) => w.id === createForm.warehouseId)?.code}-T
                  {createForm.displayNumber.padStart(2, '0')}
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setError('')
                  }}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && deleteModal.tag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Delete Tag</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete tag{' '}
              <strong>{deleteModal.tag.displayNumber}</strong> ({deleteModal.tag.code})?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setDeleteModal({ tag: null, open: false })
                  setError('')
                }}
                className="btn-secondary flex-1"
                disabled={deleting}
              >
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-danger flex-1" disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && printTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Print Labels - {printTitle}
              </h2>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="btn-primary" disabled={printSections.length === 0}>
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrintModal(false)
                    setPrintTarget(null)
                  }}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>

            <div ref={printRef}>
              {printSections.map(({ warehouse, tags: warehouseTags }) => (
                <div key={warehouse.id} className="warehouse-sheet mb-8">
                  <div className="header">
                    <h1>Visitor Tags - {warehouse.name}</h1>
                    <p>{warehouse.code}</p>
                  </div>
                  <div className="label-grid">
                    {warehouseTags.map((tag) => (
                      <TagLabel
                        key={tag.id}
                        tag={tag}
                        baseUrl={typeof window !== 'undefined' ? window.location.origin : ''}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TagLabel({ tag, baseUrl }: { tag: Tag; baseUrl: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = `${baseUrl}/tag/${tag.code}`
        const dataUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 1,
        })
        setQrDataUrl(dataUrl)
      } catch (err) {
        console.error('Failed to generate QR:', err)
      }
    }
    generateQR()
  }, [tag.code, baseUrl])

  return (
    <div className="label">
      <div className="label-qr">
        {qrDataUrl && <img src={qrDataUrl} alt={`QR code for tag ${tag.displayNumber}`} />}
      </div>
      <div className="label-number">{tag.displayNumber}</div>
      <div className="label-code">{tag.code}</div>
      <div className="label-warehouse">{tag.warehouse.name}</div>
      <div className="label-instruction">Scan to check in</div>
    </div>
  )
}
