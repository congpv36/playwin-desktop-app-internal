import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'

import { NotificationDelete } from '@renderer/components/NotificationPopup/NotificationDelete'
import { NotificationError } from '@renderer/components/NotificationPopup/NotificationError'
import { LeagueFilterContext } from '@renderer/context/LeagueFilterContext'
import InformationCircle from '@renderer/icons/information-circle'
import QuestionMarkCircle from '@renderer/icons/question-mark-circle'

import ActionTableLeagueFilter from './ActionTableLeagueFilter'
import TableLeagueFilter from './TableLeagueFilter'

const BodyLeagueFilter = () => {
  const context = useContext(LeagueFilterContext)
  const { t } = useTranslation(['main', 'layout'])
  if (!context) return null

  const { filterType } = context.filterType
  const {
    listBlockLeagueTable,
    setListBlockLeagueTable,
    listAllowLeagueTable,
    setListAllowLeagueTable
  } = context.tableData as {
    listBlockLeagueTable: { id: string | number; league: string }[]
    setListBlockLeagueTable: React.Dispatch<
      React.SetStateAction<{ id: string | number; league: string }[]>
    >
    listAllowLeagueTable: { id: string | number; league: string }[]
    setListAllowLeagueTable: React.Dispatch<
      React.SetStateAction<{ id: string | number; league: string }[]>
    >
  }

  const listLeagueTable = filterType === 'Block' ? listBlockLeagueTable : listAllowLeagueTable
  const setListLeagueTable =
    filterType === 'Block' ? setListBlockLeagueTable : setListAllowLeagueTable

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [showAlertMsg, setShowAlertMsg] = useState(false)
  const [showAlertMsgRemoveLeague, setShowAlertMsgRemoveLeague] = useState(false)

  useEffect(() => {
    if (listLeagueTable.length > 0) {
      setSelectedRows(new Set([0]))
      setLastSelectedIndex(0)
    }
  }, [filterType, listLeagueTable])

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      event.preventDefault()
      const clipboardText = await navigator.clipboard.readText()
      if (!clipboardText) return

      const pastedData = clipboardText.split('\n').filter((line) => line.trim() !== '')

      setListLeagueTable((prev) => {
        const newTable = [...prev]
        const selectedIndexes = Array.from(selectedRows).sort((a, b) => a - b)
        const startIndex = selectedIndexes.length > 0 ? selectedIndexes[0] : 0

        for (let i = 0; i < pastedData.length; i++) {
          if (startIndex + i < newTable.length) {
            newTable[startIndex + i] = { ...newTable[startIndex + i], league: pastedData[i] }
          } else {
            newTable.push({ id: uuidv4(), league: pastedData[i] })
          }
        }

        return newTable
      })
    },
    [selectedRows, setListLeagueTable]
  )

  useEffect(() => {
    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('paste', handlePaste)
    }
  }, [handlePaste])

  const handleRowClick = useCallback(
    (index: number, event: React.MouseEvent) => {
      setSelectedRows((prev) => {
        const newSelected = new Set(prev)

        if (event.ctrlKey) {
          newSelected.has(index) ? newSelected.delete(index) : newSelected.add(index)
        } else if (event.shiftKey && lastSelectedIndex !== null) {
          newSelected.clear()
          const start = Math.min(lastSelectedIndex, index)
          const end = Math.max(lastSelectedIndex, index)
          for (let i = start; i <= end; i++) newSelected.add(i)
        } else {
          newSelected.clear()
          newSelected.add(index)
        }

        setLastSelectedIndex(index)
        return newSelected
      })
    },
    [lastSelectedIndex]
  )

  const handleKeyDown = useCallback(
    async (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        setSelectedRows(() => {
          const newSelected = new Set<number>()
          listLeagueTable.forEach((_, index) => newSelected.add(index))
          return newSelected
        })
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'c') {
        event.preventDefault()
        if (listLeagueTable.length > 0 && selectedRows.size > 0) {
          const selectedData = listLeagueTable.filter((_, index) => selectedRows.has(index))
          const textToCopy = selectedData.map((item) => item.league).join('\n')
          await navigator.clipboard.writeText(textToCopy)
        }
      }
    },
    [listLeagueTable, selectedRows]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  const handleDelete = () => {
    if (listLeagueTable.length > 0 && selectedRows.size > 0) {
      setListLeagueTable(listLeagueTable.filter((_, index) => !selectedRows.has(index)))
      setSelectedRows(new Set<number>())
      setShowAlertMsgRemoveLeague(false)
    }
  }

  const handleCopy = async () => {
    if (listLeagueTable.length > 0 && selectedRows.size > 0) {
      const selectedData = listLeagueTable.filter((_, index) => selectedRows.has(index))
      const textToCopy = selectedData.map((item) => item.league).join('\n')
      await navigator.clipboard.writeText(textToCopy)
      setShowAlertMsg(true)
    }
  }

  return (
    <div>
      <ActionTableLeagueFilter handleCopy={handleCopy} handlePaste={handlePaste} />
      <TableLeagueFilter selectedRows={selectedRows} handleRowClick={handleRowClick} />

      <NotificationError
        title={t('layout:message')}
        messageError={t('main:league_copied')}
        showAlertDialog={showAlertMsg}
        setShowAlertDialog={setShowAlertMsg}
        ReactElement={<InformationCircle className="text-blue-500  mr-1" />}
      />
      <NotificationDelete
        title={t('layout:confirmation')}
        messageError={t('main:remove_selected_leagues')}
        showAlertDialog={showAlertMsgRemoveLeague}
        setShowAlertDialog={setShowAlertMsgRemoveLeague}
        handleYes={handleDelete}
        ReactElement={<QuestionMarkCircle className="text-blue-500  mr-1" />}
      />
    </div>
  )
}

export default React.memo(BodyLeagueFilter)
