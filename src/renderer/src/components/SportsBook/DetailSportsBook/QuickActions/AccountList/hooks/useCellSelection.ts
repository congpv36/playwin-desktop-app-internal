import { useEffect, useRef, useState } from 'react'
import { Table } from '@tanstack/react-table'

import { AccountType } from '@shared/common/types'

export interface CellPosition {
  rowIndex: number
  columnId: string
}

export const cellKey = (rowIndex: number, columnId: string) => `${rowIndex}-${columnId}`

export const useCellSelection = (table: Table<AccountType>) => {
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [dragStart, setDragStart] = useState<CellPosition | null>(null)
  const [lastSelected, setLastSelected] = useState<CellPosition | null>(null)
  const isDraggingRef = useRef(false)

  const selectRange = (
    rowIndex: number,
    columnId: string,
    columnIds: string[],
    anchor: CellPosition
  ) => {
    const startRow = Math.min(anchor.rowIndex, rowIndex)
    const endRow = Math.max(anchor.rowIndex, rowIndex)
    const startColIndex = columnIds.indexOf(anchor.columnId)
    const endColIndex = columnIds.indexOf(columnId)

    const newSet = new Set<string>()
    for (let r = startRow; r <= endRow; r++) {
      for (
        let c = Math.min(startColIndex, endColIndex);
        c <= Math.max(startColIndex, endColIndex);
        c++
      ) {
        newSet.add(cellKey(r, columnIds[c]))
      }
    }
    return newSet
  }

  const handleSelection = (rowIndex: number, columnId: string, event: React.MouseEvent) => {
    const key = cellKey(rowIndex, columnId)
    const columnIds = table.getAllLeafColumns().map((col) => col.id)

    if (event.ctrlKey || event.metaKey) {
      setSelection((prev) => {
        const newSet = new Set(prev)
        newSet.has(key) ? newSet.delete(key) : newSet.add(key)
        return newSet
      })
      setLastSelected({ rowIndex, columnId })
    } else if (event.shiftKey && lastSelected) {
      setSelection(selectRange(rowIndex, columnId, columnIds, lastSelected))
    } else {
      setSelection(new Set([key]))
      setLastSelected({ rowIndex, columnId })
    }
  }

  const handleMouseDown = (rowIndex: number, columnId: string, event: React.MouseEvent) => {
    if (event.button !== 0 || columnId === 'actions') return

    handleSelection(rowIndex, columnId, event)
    setDragStart({ rowIndex, columnId })
    isDraggingRef.current = true
  }

  const handleMouseEnter = (rowIndex: number, columnId: string) => {
    if (!isDraggingRef.current || !dragStart || columnId === 'actions') return

    const columnIds = table.getAllLeafColumns().map((col) => col.id)
    setSelection(selectRange(rowIndex, columnId, columnIds, dragStart))
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
    setDragStart(null)
  }

  useEffect(() => {
    const handleSelectAll = (e: KeyboardEvent) => {
      if (!((e.ctrlKey || e.metaKey) && e.key === 'a')) return

      e.preventDefault()
      const allCellKeys = new Set<string>()
      const columnIds = table.getAllLeafColumns().map((col) => col.id)

      table.getRowModel().rows.forEach((_, rowIndex) => {
        columnIds.forEach((colId) => allCellKeys.add(cellKey(rowIndex, colId)))
      })

      setSelection(allCellKeys)
    }

    window.addEventListener('keydown', handleSelectAll)
    return () => window.removeEventListener('keydown', handleSelectAll)
  }, [table])

  useEffect(() => {
    const firstColumnId = table.getAllLeafColumns()[0]?.id || 'no'

    handleSelection(0, firstColumnId, {
      preventDefault: () => {},
      stopPropagation: () => {},
      persist: () => {},
      nativeEvent: new MouseEvent('mousedown', { bubbles: true })
    } as unknown as React.MouseEvent)
  }, [])

  return {
    selection,
    setSelection,
    handleSelection,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp
  }
}
