import { useEffect } from 'react'
import { Table } from '@tanstack/react-table'

import { createEmptyAccountWithURL } from '@renderer/lib/createEmptyAccountWithURL'

import { AccountType, PlatformType } from '@shared/common/types'

import { cellKey } from './useCellSelection'

const VALID_PROXY_SCOPES = ['OnlyLogin', 'Full', 'None']

export const useClipboard = ({
  table,
  data,
  setData,
  selection,
  setSelection,
  platform
}: {
  table: Table<AccountType>
  data: AccountType[]
  setData: React.Dispatch<React.SetStateAction<AccountType[]>>
  selection: Set<string>
  setSelection: React.Dispatch<React.SetStateAction<Set<string>>>
  platform?: PlatformType
}) => {
  const handleCopy = (e: ClipboardEvent) => {
    const rows = table.getRowModel().rows
    const colIds = table.getAllLeafColumns().map((col) => col.id)
    const selected: string[][] = rows.map((_, r) =>
      colIds.map((colId) =>
        selection.has(cellKey(r, colId))
          ? colId === 'no'
            ? String(r + 1)
            : String(rows[r].getValue(colId))
          : ''
      )
    )

    const cleanedText = selected
      .map((row) =>
        row
          .map((cell) => cell.trim())
          .join('\t')
          .trim()
      )
      .join('\n')
      .trim()

    navigator.clipboard
      .writeText(cleanedText)
      .then(() => {
        console.log('Copied to clipboard successfully!')
      })
      .catch((err) => {
        console.error('Failed to copy to clipboard: ', err)
      })

    e.preventDefault()
  }

  const handlePaste = (e: ClipboardEvent) => {
    if (document.activeElement?.tagName === 'INPUT') {
      return
    }

    const clipboardData = e.clipboardData?.getData('text/plain')
    if (!clipboardData || selection.size === 0) return

    const rows = clipboardData
      .trim()
      .split(/\r?\n/)
      .map((row) => row.trim().split(/\s+/))
    if (rows.length === 0) return

    const selected = Array.from(selection).map((key) => {
      const [rowIndex, colId] = key.split('-')
      return { rowIndex: parseInt(rowIndex), colId }
    })

    const columnIds = table.getAllLeafColumns().map((col) => col.id)
    const minRow = Math.min(...selected.map((s) => s.rowIndex))
    const minColIndex = Math.min(...selected.map((s) => columnIds.indexOf(s.colId)))

    setData((prev) => {
      let updated = [...prev]

      const requiredRows = minRow + rows.length
      if (requiredRows > updated.length) {
        const newRows = Array.from({ length: requiredRows - updated.length }, () =>
          createEmptyAccountWithURL(platform)
        ) as AccountType[]
        updated = [...updated, ...newRows]
      }

      for (let r = 0; r < rows.length; r++) {
        const dataRow = rows[r]
        for (let c = 0; c < dataRow.length; c++) {
          const targetRow = minRow + r
          const targetColIndex = minColIndex + c
          const targetColId = columnIds[targetColIndex]

          if (targetRow < updated.length && targetColId && targetColId !== 'no') {
            let value = dataRow[c]?.trim()

            if (targetColId === 'proxyScope') {
              if (!VALID_PROXY_SCOPES.includes(value)) {
                value = 'None'
              }
            }

            updated[targetRow] = {
              ...updated[targetRow],
              [targetColId]: value
            }
          }
        }
      }

      const lastElement = updated[updated.length - 1]
      const shouldAddEmptyRow = lastElement.loginID?.trim() || lastElement.password?.trim()

      if (shouldAddEmptyRow) {
        updated = [...updated, createEmptyAccountWithURL(platform) as AccountType]
      }

      return updated
    })

    // Reset selection to the pasted area
    const newSelection = new Set<string>()
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[0].length; c++) {
        const targetRow = minRow + r
        const targetColIndex = minColIndex + c
        const targetColId = columnIds[targetColIndex]
        if (targetColId && targetColId !== 'no') {
          newSelection.add(cellKey(targetRow, targetColId))
        }
      }
    }
    setSelection(newSelection)

    e.preventDefault()
  }

  const handleCut = (e: KeyboardEvent) => {
    if (!((e.ctrlKey || e.metaKey) && e.key === 'x') || selection.size === 0) return

    e.preventDefault()
    const rows = table.getRowModel().rows
    const colIds = table.getAllLeafColumns().map((col) => col.id)
    const selectedByRow: Record<number, Record<string, boolean>> = {}
    let isNoSelected = false

    for (const key of selection) {
      const [rowIndex, colId] = key.split('-')
      const rIdx = parseInt(rowIndex)
      selectedByRow[rIdx] = selectedByRow[rIdx] || {}
      selectedByRow[rIdx][colId] = true
      if (colId === 'no') isNoSelected = true
    }

    const clipboardLines: string[] = []
    const newData = [...data]

    for (const rowIndexStr in selectedByRow) {
      const rowIndex = parseInt(rowIndexStr)
      const selectedCols = selectedByRow[rowIndex]
      const row = rows[rowIndex]
      const line: string[] = []

      for (const colId of colIds) {
        if (colId === 'no') {
          line.push(isNoSelected && selectedCols[colId] ? String(rowIndex + 1).trim() : '')
        } else if (selectedCols[colId]) {
          const val = row.getValue(colId) ?? ''
          line.push(String(val).trim())
          newData[rowIndex] = { ...newData[rowIndex], [colId]: '' }
        } else {
          line.push('')
        }
      }
      clipboardLines.push(line.join('\t').trim())
    }

    navigator.clipboard.writeText(clipboardLines.join('\n'))
    setData(newData)
  }

  useEffect(() => {
    window.addEventListener('copy', handleCopy)
    window.addEventListener('paste', handlePaste)
    window.addEventListener('keydown', handleCut)
    return () => {
      window.removeEventListener('copy', handleCopy)
      window.removeEventListener('paste', handlePaste)
      window.removeEventListener('keydown', handleCut)
    }
  }, [selection, table, data])

  return { handleCopy, handlePaste, handleCut }
}
