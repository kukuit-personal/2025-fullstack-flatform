'use client'

import { useState } from 'react'

interface ConfirmModalProps {
  trigger: React.ReactNode
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
}

export default function ConfirmModal({
  trigger,
  title = 'Xác nhận',
  message = 'Bạn có chắc chắn muốn tiếp tục?',
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ',
  onConfirm,
}: ConfirmModalProps) {
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    onConfirm()
    setOpen(false)
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-2">{title}</h2>
          <p className="text-sm text-gray-600 mb-6 break-all whitespace-pre-line">{message}</p>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            >
              Huỷ
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>

      )}
    </>
  )
}
