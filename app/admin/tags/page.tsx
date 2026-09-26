'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { getTagCheckInUrl } from '@/lib/utils'

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

export default function TagManagementPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printWarehouse, setPrintWarehouse] = useState<Warehouse | null>(null)
  const [createForm, setCreateForm] = useState({ warehouseId: '', displayNumber: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ tag: Tag | null; open: boolean }>({
    tag: null,
    open: false,
  })
  const [deleting, setDeleting] = useState(false)
  const [menuTagId, setMenuTagId] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchTags()
    }
  }, [user, selectedWarehouse])

  useEffect(() => {
    if (!menuTagId) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuTagId(null)
    }
    const onPointer = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-tag-menu]')) return
      setMenuTagId(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [menuTagId])

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
      setWarehouses(data.warehouses || [])
    } catch {
      router.push('/login')
    }
  }

  const fetchTags = async () => {
    setLoading(true)
    try {
      const warehouseParam = selectedWarehouse ? `?warehouseId=${selectedWarehouse}` : ''
      const response = await fetch(`/api/admin/tags${warehouseParam}`)
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

  const openPrintModal = (warehouseId?: string) => {
    if (warehouseId) {
      const fromList = warehouses.find((w) => w.id === warehouseId)
      const fromTag = tags.find((tag) => tag.warehouse.id === warehouseId)?.warehouse
      const warehouse = fromList
        ? {
            ...fromList,
            siteName: fromList.site?.name || fromList.siteName || '',
          }
        : fromTag
          ? {
              id: fromTag.id,
              code: fromTag.code,
              name: fromTag.name,
              siteName: fromTag.siteName,
            }
          : null
      if (!warehouse) return
      setPrintWarehouse(warehouse)
    } else {
      setPrintWarehouse(null)
    }
    setMenuTagId(null)
    setShowPrintModal(true)
  }

  const handlePrint = () => {
    if (!printRef.current) return
    const title = printWarehouse?.code ? `Tag Labels - ${printWarehouse.code}` : 'Tag Labels'
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>${LABEL_PRINT_CSS}</style>
      </head>
      <body>
        ${printRef.current.innerHTML}
        <script>window.onload = function() { window.print(); }<\/script>
      </body>
      </html>`)
    printWindow.document.close()
  }

  const tagsForPrint = printWarehouse
    ? tags.filter((t) => t.warehouse.id === printWarehouse.id)
    : tags

  const groupedTags = tags.reduce(
    (acc, tag) => {
      const key = tag.warehouse.id
      if (!acc[key]) {
        acc[key] = {
          warehouse: tag.warehouse,
          tags: [],
        }
      }
      acc[key].tags.push(tag)
      return acc
    },
    {} as Record<string, { warehouse: Tag['warehouse']; tags: Tag[] }>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <style>{LABEL_CLASS_CSS}</style>
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
              onClick={() => openPrintModal()}
              className="btn-primary"
              disabled={tags.length === 0}
            >
              Print Labels
            </button>
            <button type="button" onClick={() => setShowCreateModal(true)} className="btn-secondary">
              + Create Tag
            </button>
          </div>
        </div>

        {/* Warehouse filter */}
        {warehouses.length > 1 && (
          <div className="mb-6">
            <label htmlFor="warehouse-filter" className="label">
              Warehouse
            </label>
            <select
              id="warehouse-filter"
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
            {Object.values(groupedTags).map(({ warehouse, tags: warehouseTags }) => (
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
                    type="button"
                    onClick={() => openPrintModal(warehouse.id)}
                    className="text-sm text-amber-800 hover:text-amber-900 flex items-center gap-1 min-h-[44px] px-2"
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
                    Print these
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {warehouseTags.map((tag) => (
                    <div
                      key={tag.id}
                      className={`card p-4 text-center relative ${tag.isInUse ? 'bg-green-50 border border-green-200' : ''} ${menuTagId === tag.id ? 'z-30' : ''}`}
                    >
                      <div className="text-3xl font-bold text-amber-800 mb-1">
                        {tag.displayNumber}
                      </div>
                      <div className="text-xs font-mono text-gray-500 mb-2">{tag.code}</div>
                      {tag.isInUse && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          In use ({tag.activeVisitorCount})
                        </span>
                      )}
                      <div className="relative mt-1" data-tag-menu>
                        <button
                          type="button"
                          aria-haspopup="menu"
                          aria-expanded={menuTagId === tag.id}
                          aria-label={`Actions for tag ${tag.displayNumber}`}
                          onClick={() =>
                            setMenuTagId((current) => (current === tag.id ? null : tag.id))
                          }
                          className="min-h-[44px] min-w-[44px] rounded-lg text-xl leading-none text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        >
                          ⋯
                        </button>
                        {menuTagId === tag.id && (
                          <div
                            role="menu"
                            className="absolute left-1/2 z-20 mt-1 w-44 -translate-x-1/2 rounded-lg border border-gray-200 bg-white py-1 text-left shadow-lg"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              disabled={tag.isInUse}
                              onClick={() => {
                                setMenuTagId(null)
                                setError('')
                                setDeleteModal({ tag, open: true })
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
                            >
                              Delete
                            </button>
                            {tag.isInUse && (
                              <p className="px-3 pb-2 text-xs text-gray-500">
                                Check out visitors before deleting.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
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
                <label htmlFor="create-warehouse" className="label">
                  Warehouse *
                </label>
                <select
                  id="create-warehouse"
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
                <label htmlFor="create-tag-number" className="label">
                  Tag Number *
                </label>
                <input
                  id="create-tag-number"
                  type="number"
                  inputMode="numeric"
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
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 my-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Print Labels{printWarehouse ? ` - ${printWarehouse.code}` : ''}
                </h2>
                <p className="text-sm text-gray-500">
                  A4, two columns of five. Cut along the dashed lines.
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handlePrint} className="btn-primary">
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>

            <div ref={printRef}>
              <div className="label-sheet">
                {tagsForPrint.map((tag) => (
                  <TagLabel key={tag.id} tag={tag} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const LABEL_CLASS_CSS = `
  .label-sheet {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 58mm;
    width: 100%;
  }
  .tag-label {
    box-sizing: border-box;
    height: 58mm;
    border-right: 0.25mm dashed #4b5563;
    border-bottom: 0.25mm dashed #4b5563;
    padding: 3mm 4mm 2.5mm;
    display: flex;
    flex-direction: column;
    font-family: Arial, Helvetica, sans-serif;
    color: #171717;
    overflow: hidden;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .tag-label:nth-child(odd) {
    border-left: 0.25mm dashed #4b5563;
  }
  .tag-label:nth-child(10n + 1),
  .tag-label:nth-child(10n + 2) {
    border-top: 0.25mm dashed #4b5563;
  }
  .tag-label-top {
    display: flex;
    align-items: center;
    gap: 4mm;
    height: 32mm;
  }
  .tag-label-qr {
    width: 32mm;
    height: 32mm;
    flex: 0 0 auto;
  }
  .tag-label-qr img {
    width: 32mm;
    height: 32mm;
    display: block;
  }
  .tag-label-number {
    font-size: 20mm;
    line-height: 1;
    font-weight: 800;
    color: #171717;
    letter-spacing: -0.03em;
  }
  .tag-label-code {
    margin-top: 2mm;
    font-size: 12pt;
    line-height: 1.15;
    font-weight: 700;
    color: #171717;
  }
  .tag-label-warehouse {
    margin-top: 0.6mm;
    font-size: 11pt;
    line-height: 1.15;
    font-weight: 400;
    color: #6b7280;
  }
  .tag-label-instruction {
    margin-top: 0.6mm;
    font-size: 11pt;
    line-height: 1.15;
    font-weight: 700;
    color: #92400e;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
`

const LABEL_PRINT_CSS = `
  @page { size: A4 portrait; margin: 3.5mm 5mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: Arial, Helvetica, sans-serif; color: #171717; }
  ${LABEL_CLASS_CSS}
`

function TagLabel({ tag }: { tag: Tag }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const checkInUrl = getTagCheckInUrl(tag.code)

  useEffect(() => {
    let cancelled = false
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(checkInUrl, {
          width: 480,
          margin: 1,
          errorCorrectionLevel: 'H',
        })
        if (!cancelled) setQrDataUrl(dataUrl)
      } catch (err) {
        console.error('Failed to generate QR:', err)
      }
    }
    generateQR()
    return () => {
      cancelled = true
    }
  }, [checkInUrl])

  return (
    <div className="tag-label">
      <div className="tag-label-top">
        <div className="tag-label-qr">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt={`QR code for tag ${tag.code}`}
              data-checkin-url={checkInUrl}
            />
          )}
        </div>
        <div className="tag-label-number">{tag.displayNumber}</div>
      </div>
      <div className="tag-label-code">{tag.code}</div>
      <div className="tag-label-warehouse">{tag.warehouse.name}</div>
      <div className="tag-label-instruction">Scan to check in</div>
    </div>
  )
}
