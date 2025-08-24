'use client'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const images = [
  '/images/templates/template1.png',
  '/images/templates/template2.png',
  '/images/templates/template3.png',
]

export default function TemplatesPage() {
  const [showPopup, setShowPopup] = useState(false)

  // ====== DEMO FILTER UI STATES (no functionality) ======
  const [searchName, setSearchName] = useState('')
  const [searchTag, setSearchTag] = useState('')
  const [createdFrom, setCreatedFrom] = useState<string>('')
  const [createdTo, setCreatedTo] = useState<string>('')

  // ====== DATA + PAGINATION ======
  const creators = useMemo(
    () => ['Admin', ...Array.from({ length: 25 }, (_, i) => `User ${i + 1}`)],
    []
  )

  const pageSize = 6
  const items = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i + 1,
        image: images[i % images.length],
        updatedDaysAgo: (i % 9) + 1,
        creator: creators[(i * 7) % creators.length], // "random" ổn định theo index
        price: 5.0,
      })),
    [creators]
  )

  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(items.length / pageSize)
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page])
  const startIndex = (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, items.length)

  return (
    <div className="space-y-6">
      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">Templates</h1>
          <Link
            href="./templates/new"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black text-white text-sm hover:bg-gray-900"
          >
            + Add
          </Link>
        </div>

        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{startIndex}</span>–
          <span className="font-medium">{endIndex}</span> of{' '}
          <span className="font-medium">{items.length}</span>
        </div>
      </div>

      {/* Filters (Demo only) */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Search by name */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Search by name</span>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="e.g. Template #12"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            />
          </label>

          {/* Search by tag */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Tag</span>
            <input
              type="text"
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              placeholder="e.g. newsletter, landing, promo"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            />
          </label>

          {/* Created from */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Created from</span>
            <input
              type="date"
              value={createdFrom}
              onChange={(e) => setCreatedFrom(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            />
          </label>

          {/* Created to */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Created to</span>
            <input
              type="date"
              value={createdTo}
              onChange={(e) => setCreatedTo(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            />
          </label>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pageData.map((item) => {
          const isAdmin = item.creator === 'Admin'
          return (
            <div key={item.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="aspect-video relative">
                <Image src={item.image} alt={`Template ${item.id}`} fill className="object-cover" />
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">Template #{item.id}</div>
                  <div className="text-xs text-gray-500">
                    Updated {item.updatedDaysAgo} {item.updatedDaysAgo === 1 ? 'day' : 'days'} ago
                  </div>

                  {/* Created by (highlight) */}
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">Created by</span>{' '}
                    <span
                      className={
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ' +
                        (isAdmin
                          ? 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                          : 'bg-amber-50 text-amber-700 ring-amber-200')
                      }
                    >
                      {item.creator}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-md text-gray-500">${item.price.toFixed(2)}</div>
                  <Link
                    href="./templates/edit"
                    className="px-3 py-1.5 rounded-xl bg-black text-white text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setShowPopup(true)}
                    className="px-3 py-1.5 rounded-xl bg-gray-700 text-white text-sm"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Page <span className="font-medium">{page}</span> / {totalPages}
        </div>
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1
            const isCurrent = p === page
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={
                  'px-3 py-1.5 rounded-lg text-sm border ' +
                  (isCurrent ? 'bg-black text-white border-black' : 'hover:bg-gray-50')
                }
              >
                {p}
              </button>
            )
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </nav>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative bg-white rounded-2xl shadow-lg p-4">
            <div className="w-[80vw] h-[80vh] relative">
              <Image
                src="/images/templates/template3-full.png"
                alt="Template Full"
                fill
                className="object-contain rounded-xl"
              />
            </div>
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-2 right-2 bg-gray-200 rounded-full px-2 py-1 text-sm hover:bg-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
