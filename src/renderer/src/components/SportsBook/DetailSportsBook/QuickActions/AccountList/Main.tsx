import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColumnResizeMode, getCoreRowModel, useReactTable } from '@tanstack/react-table'

import { createColumnsAccountList } from '@renderer/components/AccountList/defaultColumnsAccountList'
import AccountContextMenu from '@renderer/components/SportsBook/DetailSportsBook/QuickActions/AccountList/AccountContextMenu'
import AccountSwitchingSetting from '@renderer/components/SportsBook/DetailSportsBook/QuickActions/AccountList/AccountSwitchingSetting'
import AccountTable from '@renderer/components/SportsBook/DetailSportsBook/QuickActions/AccountList/AccountTable'
import { useAccountRows } from '@renderer/components/SportsBook/DetailSportsBook/QuickActions/AccountList/hooks/useAccountRows'
import { useCellEditing } from '@renderer/components/SportsBook/DetailSportsBook/QuickActions/AccountList/hooks/useCellEditing'
import { useCellSelection } from '@renderer/components/SportsBook/DetailSportsBook/QuickActions/AccountList/hooks/useCellSelection'
import { useClipboard } from '@renderer/components/SportsBook/DetailSportsBook/QuickActions/AccountList/hooks/useClipboard'
import RandomIP from '@renderer/components/SportsBook/DetailSportsBook/QuickActions/AccountList/RandomIP'
import { COUNTRY_IP } from '@renderer/lib/country-ip.data'
import { createEmptyAccountWithURL } from '@renderer/lib/createEmptyAccountWithURL'

import { AccountType } from '@shared/common/types'

export const Main = ({ setOpenModalSetting, sportsBook }) => {
  const { t } = useTranslation(['main', 'layout'])
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, visible: false })

  const {
    data,
    setData,
    platform,
    switchSettings,
    setSwitchSettings,
    randomDelayLoginSettings,
    setRandomDelayLoginSettings,
    loginIDErrors,
    setLoginIDErrors,
    handleMoveUp,
    handleMoveDown,
    handleMoveFinal,
    handleSaveAccountList
  } = useAccountRows({ sportsBook, setOpenModalSetting, t })

  const columns = useMemo(
    () =>
      createColumnsAccountList({
        onMoveUp: handleMoveUp,
        onMoveDown: handleMoveDown,
        onFinal: handleMoveFinal,
        platform,
        t
      }),
    [handleMoveUp, handleMoveDown, handleMoveFinal, platform, t]
  )
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange')

  const table = useReactTable({
    data,
    columns,
    columnResizeMode,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData: (rowIndex: number, columnId: string, value: unknown) => {
        setData((old) =>
          old.map((row, index) => (index === rowIndex ? { ...row, [columnId]: value } : row))
        )
      },
      setHasError: () => {}
    }
  })

  const { selection, setSelection, handleMouseDown, handleMouseEnter, handleMouseUp } =
    useCellSelection(table)

  const {
    editingCell,
    editingValue,
    setEditingValue,
    startEditing,
    saveEditing,
    cancelEditing,
    handleInputChange
  } = useCellEditing({
    data,
    setData,
    platform,
    clearLoginIDErrors: () => setLoginIDErrors({})
  })

  const { handleCopy, handlePaste, handleCut } = useClipboard({
    table,
    data,
    setData,
    selection,
    setSelection,
    platform
  })

  const handleRightClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true
    })
  }

  const handleCloseMenu = () => {
    setContextMenu({ ...contextMenu, visible: false })
  }

  const handleClear = () => {
    if (selection.size === 0) return

    const selectedByRow: Record<number, Record<string, boolean>> = {}

    for (const key of selection) {
      const [rowIndex, colId] = key.split('-')
      const rIdx = parseInt(rowIndex)
      selectedByRow[rIdx] = selectedByRow[rIdx] || {}
      selectedByRow[rIdx][colId] = true
    }

    setData((prev) => {
      let updated = [...prev]

      for (const rowIndexStr in selectedByRow) {
        const rowIndex = parseInt(rowIndexStr)
        const selectedCols = selectedByRow[rowIndex]

        updated[rowIndex] = {
          ...updated[rowIndex],
          ...Object.fromEntries(
            Object.keys(selectedCols)
              .filter((colId) => colId !== 'no' && colId !== 'actions')
              .map((colId) => [colId, ''])
          )
        }
      }

      const lastElement = updated[updated.length - 1]
      const shouldAddEmptyRow = lastElement.loginID?.trim() || lastElement.password?.trim()

      if (shouldAddEmptyRow) {
        updated = [...updated, createEmptyAccountWithURL(platform) as AccountType]
      }

      return updated
    })

    setSelection(new Set())
  }

  const handleSelectCountry = (country: string) => {
    const customIndexes = Array.from(selection)
      .filter((item) => item.includes('customIP'))
      .map((item) => Number(item.split('-')[0]))

    const listIP = COUNTRY_IP[country]
    const shuffledIPs = [...listIP].sort(() => Math.random() - 0.5)
    let ipPointer = 0
    setData((prev) =>
      prev.map((item, index) => {
        if (customIndexes.includes(index)) {
          const randomIP =
            shuffledIPs[ipPointer++] ?? listIP[Math.floor(Math.random() * listIP.length)]

          return {
            ...item,
            customIP: randomIP
          }
        }

        return item
      })
    )
  }

  return (
    <div className="h-full py-3 flex flex-col" onClick={handleCloseMenu}>
      <div className="flex-1 min-h-0 overflow-hidden mb-3">
        <div
          className="h-full w-full border border-border-default bg-white overflow-hidden"
          onContextMenu={handleRightClick}
        >
          <div
            onMouseUp={handleMouseUp}
            style={{ direction: table.options.columnResizeDirection }}
            className="h-full w-full overflow-auto custom-scrollbar pb-16"
          >
            <AccountTable
              table={table}
              columnResizeMode={columnResizeMode}
              selection={selection}
              editingCell={editingCell}
              editingValue={editingValue}
              loginIDErrors={loginIDErrors}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
              onDoubleClick={startEditing}
              onEditingValueChange={handleInputChange}
              onEditingValueSet={setEditingValue}
              onSaveEditing={saveEditing}
              onCancelEditing={cancelEditing}
            />
          </div>

          <AccountContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            visible={contextMenu.visible}
            onCut={handleCut}
            onCopy={handleCopy}
            onPaste={handlePaste}
          />
        </div>
      </div>

      <div>
        <AccountSwitchingSetting
          settings={switchSettings}
          onSettingsChange={setSwitchSettings}
          randomDelaySettings={randomDelayLoginSettings}
          onRandomDelaySettingsChange={setRandomDelayLoginSettings}
        />
      </div>

      <div className="flex gap-[16px] mt-[24px] justify-between">
        <div>
          <button
            className="w-[80px] outline-none border border-border-default hover:border-border-default  h-[40px] font-semibold rounded-[8px] mr-3"
            onClick={handleClear}
          >
            {t('clear', { ns: 'layout' })}
          </button>
          <RandomIP onSelectCountry={handleSelectCountry} />
        </div>
        <div>
          <button
            className="w-[80px] mr-[16px] outline-none border border-border-default hover:border-border-default  h-[40px] font-semibold rounded-[8px]"
            onClick={() => setOpenModalSetting(false)}
          >
            {t('cancel', { ns: 'layout' })}
          </button>
          <button
            className={`bg-brand-color text-white w-[80px] border-none  h-[40px] font-semibold  hover:bg-opacity-90 rounded-[8px]`}
            onClick={handleSaveAccountList}
          >
            {t('save', { ns: 'layout' })}
          </button>
        </div>
      </div>
    </div>
  )
}
