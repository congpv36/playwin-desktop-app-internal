import { ColumnResizeMode, flexRender, Table } from '@tanstack/react-table'

import { AccountType } from '@shared/common/types'

import { cellKey, CellPosition } from './hooks/useCellSelection'

interface AccountTableProps {
  table: Table<AccountType>
  columnResizeMode: ColumnResizeMode
  selection: Set<string>
  editingCell: CellPosition | null
  editingValue: string
  loginIDErrors: Record<number, string>
  onMouseDown: (rowIndex: number, columnId: string, event: React.MouseEvent) => void
  onMouseEnter: (rowIndex: number, columnId: string) => void
  onDoubleClick: (rowIndex: number, columnId: string) => void
  onEditingValueChange: (rowIndex: number, columnId: string, value: string) => void
  onEditingValueSet: (value: string) => void
  onSaveEditing: () => void
  onCancelEditing: () => void
}

const AccountTable = ({
  table,
  columnResizeMode,
  selection,
  editingCell,
  editingValue,
  loginIDErrors,
  onMouseDown,
  onMouseEnter,
  onDoubleClick,
  onEditingValueChange,
  onEditingValueSet,
  onSaveEditing,
  onCancelEditing
}: AccountTableProps) => {
  return (
    <table style={{ width: table.getCenterTotalSize() }} className="border-collapse">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                colSpan={header.colSpan}
                style={{
                  width: header.getSize(),
                  maxWidth: header.getSize(),
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                className="sticky top-[-1px] z-10 truncate border border-border-default text-start pl-1 text-sm bg-white"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
                <div
                  onDoubleClick={() => header.column.resetSize()}
                  onMouseDown={header.getResizeHandler()}
                  onTouchStart={header.getResizeHandler()}
                  className={`resizer ${table.options.columnResizeDirection} ${
                    header.column.getIsResizing() ? 'isResizing' : ''
                  }`}
                  style={{
                    transform:
                      columnResizeMode === 'onEnd' && header.column.getIsResizing()
                        ? `translateX(${
                            (table.options.columnResizeDirection === 'rtl' ? -1 : 1) *
                            (table.getState().columnSizingInfo.deltaOffset ?? 0)
                          }px)`
                        : ''
                  }}
                />
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row, rowIndex) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => {
              const key = cellKey(rowIndex, cell.column.id)
              const isSelected = selection.has(key)
              const isEditing =
                editingCell?.rowIndex === rowIndex && editingCell?.columnId === cell.column.id

              return (
                <td
                  key={cell.id}
                  style={{
                    width: cell.column.getSize(),
                    maxWidth: cell.column.getSize()
                  }}
                  className={`border border-border-default p-0 truncate cursor-pointer text-sm ${
                    isSelected ? 'bg-blue-200 text-black' : ''
                  }`}
                  onMouseDown={(e) => onMouseDown(rowIndex, cell.column.id, e)}
                  onMouseEnter={() => onMouseEnter(rowIndex, cell.column.id)}
                  onDoubleClick={() => onDoubleClick(rowIndex, cell.column.id)}
                >
                  <div className="relative text-xs">
                    {isEditing && cell.column.id !== 'proxyScope' ? (
                      <input
                        autoFocus
                        value={editingValue}
                        onChange={(e) =>
                          onEditingValueChange(rowIndex, cell.column.id, e.target.value)
                        }
                        onPaste={(e) => {
                          const pastedValue = e.clipboardData.getData('text/plain')
                          onEditingValueSet(pastedValue)
                          e.preventDefault()
                        }}
                        onBlur={onSaveEditing}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') onSaveEditing()
                          if (e.key === 'Escape') onCancelEditing()
                        }}
                        className="w-full px-1 h-5 text-black text-xs"
                      />
                    ) : (
                      <div className={cell.column.id !== 'proxyScope' ? 'px-1' : ''}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    )}
                    {cell.column.id === 'loginID' && loginIDErrors[rowIndex] && (
                      <div className="text-red-500 text-xs mt-1 px-1">
                        {loginIDErrors[rowIndex]}
                      </div>
                    )}
                  </div>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default AccountTable
