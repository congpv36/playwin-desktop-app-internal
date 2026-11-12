import { useState } from 'react'

import { createEmptyAccountWithURL } from '@renderer/lib/createEmptyAccountWithURL'

import { AccountType, PlatformType } from '@shared/common/types'

import { CellPosition } from './useCellSelection'

export const useCellEditing = ({
  data,
  setData,
  platform,
  clearLoginIDErrors
}: {
  data: AccountType[]
  setData: React.Dispatch<React.SetStateAction<AccountType[]>>
  platform?: PlatformType
  clearLoginIDErrors: () => void
}) => {
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null)
  const [editingValue, setEditingValue] = useState('')

  const startEditing = (rowIndex: number, columnId: string) => {
    if (columnId === 'no' || columnId === 'actions') return
    setEditingCell({ rowIndex, columnId })
    setEditingValue(String(data[rowIndex][columnId as keyof AccountType] ?? ''))

    clearLoginIDErrors()
  }

  const saveEditing = () => {
    if (!editingCell) return
    const { rowIndex, columnId } = editingCell

    setData((prev) => {
      const updated = [...prev]
      updated[rowIndex] = { ...updated[rowIndex], [columnId]: editingValue }
      return updated
    })

    setEditingCell(null)
    setEditingValue('')
  }

  const cancelEditing = () => {
    setEditingCell(null)
    setEditingValue('')
  }

  const handleInputChange = (rowIndex: number, columnId: string, value: string) => {
    setEditingValue(value)

    if (rowIndex === data.length - 1) {
      setData((prev) => [...prev, createEmptyAccountWithURL(platform)])
    }

    setData((prev) =>
      prev.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...row,
            [columnId]: value
          }
        }
        return row
      })
    )
  }

  return {
    editingCell,
    editingValue,
    setEditingValue,
    startEditing,
    saveEditing,
    cancelEditing,
    handleInputChange
  }
}
