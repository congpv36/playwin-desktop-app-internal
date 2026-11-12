import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ColumnResizeDirection,
  ColumnResizeMode,
  flexRender,
  getCoreRowModel,
  RowData,
  useReactTable
} from '@tanstack/react-table'
import clsx from 'clsx'

import { defaultColumns } from '@renderer/components/BetListContraListSuccessList/defaultColumns'

import { TicketInfoDataBetType } from '@shared/common/types'

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void
    setHasError: (hasError: boolean) => void
  }
}

const TableData = ({ dataTable, enableScroll, scrollToTop = false }) => {
  const { t } = useTranslation(['main', 'layout'])
  const [data, setData] = useState<TicketInfoDataBetType[]>(dataTable)
  const [columns] = useState(() => [...defaultColumns(t)])
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange')
  const [columnResizeDirection] = useState<ColumnResizeDirection>('ltr')

  const [selectedRowId, setSelectedRowId] = useState(null)

  const tableContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setData(dataTable)
  }, [dataTable])

  useEffect(() => {
    if (enableScroll && tableContainerRef.current) {
      tableContainerRef.current.scrollTop = scrollToTop ? 0 : tableContainerRef.current.scrollHeight
    }
  }, [data, enableScroll, scrollToTop])

  const table = useReactTable({
    data,
    columns,
    columnResizeMode,
    columnResizeDirection,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData: (rowIndex, columnId, value) => {
        setData((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...row,
                [columnId]: value
              }
            }
            return row
          })
        )
      },
      setHasError: (hasError: boolean) => {
        console.error('An error occurred:', hasError)
      }
    }
  })

  const handleRowClick = (rowId) => {
    setSelectedRowId(rowId)
  }

  return (
    <div
      className="flex-1 flex flex-col min-w-[968px] border border-border-default overflow-y-auto custom-scrollbar bg-white"
      ref={tableContainerRef}
      style={{ direction: table.options.columnResizeDirection }}
    >
      <div className="h-[100px]">
        <table
          style={{ width: table.getCenterTotalSize() }}
          className="border-separate border-spacing-0"
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    {...{
                      colSpan: header.colSpan,
                      style: {
                        width: header.getSize(),
                        maxWidth: header.getSize(),
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }
                    }}
                    className="sticky top-[-1px] z-10 truncate border border-border-default text-start pl-1 bg-gray-100 text-xs"
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
            {table.getRowModel().rows.map((row) => {
              const info = row.original.info as string
              const isBetSuccess = info?.includes('Bet Success')

              return (
                <tr
                  key={row.id}
                  className={clsx(
                    'hover:bg-green-200 font-medium',
                    isBetSuccess ? 'bg-green-100' : 'bg-white',
                    selectedRowId === row.id && '!bg-green-200'
                  )}
                  onClick={() => handleRowClick(row.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        width: cell.column.getSize(),
                        maxWidth: cell.column.getSize(),
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      className="shadow-none"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default React.memo(TableData)
