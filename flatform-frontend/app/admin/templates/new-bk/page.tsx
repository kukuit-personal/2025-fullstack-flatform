'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const loadGrapes = () => import('grapesjs')
const loadNewsletterPreset = () => import('grapesjs-preset-newsletter')

export default function TemplatesEditorPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string>('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [{ default: grapesjs }, { default: presetNewsletter }] = await Promise.all([
        loadGrapes(),
        loadNewsletterPreset(),
      ])

      if (!mounted || !containerRef.current) return

      const editor = grapesjs.init({
        container: containerRef.current,
        height: 'calc(100vh - 180px)',
        fromElement: false,
        storageManager: false,
        plugins: [presetNewsletter],
        pluginsOpts: { 'grapesjs-preset-newsletter': { showStylesOnChange: true } },
      })
      editorRef.current = editor
      setNotice('New blank template')
      setLoading(false)
    })()

    return () => {
      mounted = false
      editorRef.current?.destroy()
      editorRef.current = null
    }
  }, [])

  const getFullHtml = useCallback(() => {
    const ed = editorRef.current
    if (!ed) return ''
    const htmlBody = ed.getHtml({ cleanId: true })
    const css = ed.getCss()
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Template</title>
<style>${css}</style>
</head>
<body>
${htmlBody}
</body>
</html>`.trim()
  }, [])

  const handleExport = useCallback(() => {
    const full = getFullHtml()
    if (!full) return
    const blob = new Blob([full], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-export.html'
    a.click()
    URL.revokeObjectURL(url)
  }, [getFullHtml])

  const handleSave = useCallback(async () => {
    const full = getFullHtml()
    if (!full) return
    setNotice('Đang lưu...')
    try {
      const res = await fetch('/api/templates/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: full }),
      })
      if (!res.ok) throw new Error(await res.text())
      setNotice('Đã lưu vào Template (local/dev).')
    } catch (e) {
      console.error(e)
      setNotice('Save lỗi (prod thường read-only).')
    }
  }, [getFullHtml])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Edit: Template</h1>
        {!!notice && <div className="text-sm text-gray-600">{notice}</div>}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => location.reload()}
          className="px-3 py-2 rounded-xl border hover:bg-gray-50"
        >
          ⭮ Reload
        </button>
        <button onClick={handleExport} className="px-3 py-2 rounded-xl bg-black text-white">
          ⬇ Export HTML
        </button>
        <button onClick={handleSave} className="px-3 py-2 rounded-xl bg-emerald-600 text-white">
          💾 Save (Template)
        </button>
      </div>

      <div className="rounded-2xl border overflow-hidden relative min-h-[70vh]">
        {loading && (
          <div className="absolute inset-0 grid place-items-center text-gray-500">
            Đang tải editor…
          </div>
        )}
        <div ref={containerRef} className="min-h-[70vh]" />
      </div>
    </div>
  )
}
