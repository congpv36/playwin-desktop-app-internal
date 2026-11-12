import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'

import SelectMultipleAmountRandomizer from '@renderer/components/LeaguePointRandomizer/SelectMultipleAmountRandomizer'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { LeaguePointRandomizerContext } from '@renderer/context/LeaguePointRandomizerContext'

export default function SelectMultipleModal({ onClose }) {
  const context = useContext(LeaguePointRandomizerContext)
  const { t } = useTranslation(['main', 'layout'])
  if (!context) return null

  const { selectedLeague, setSelectedLeague, listSelectedLeague, setListSelectedLeague } = context

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [checked, setChecked] = useState(0)
  const [fromValue, setFrom] = useState('50')
  const [toValue, setTo] = useState('200')

  const isSelectAll =
    listSelectedLeague.length > 0 && selectedIds.length === listSelectedLeague.length

  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedIds([])
    } else {
      setSelectedIds(listSelectedLeague.map((l) => l.id))
    }
  }
  const toggleLeague = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleUpdate = () => {
    if (selectedIds.length === 0) {
      onClose()
    }

    const updatedList = listSelectedLeague.map((league) =>
      selectedIds.includes(league.id)
        ? {
            ...league,
            checked,
            fromValue,
            toValue
          }
        : league
    )

    setListSelectedLeague(updatedList)

    if (selectedLeague && selectedIds.includes(selectedLeague.id)) {
      const updatedSelected = updatedList.find((l) => l.id === selectedLeague.id)
      if (updatedSelected) setSelectedLeague(updatedSelected)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white  rounded-none max-w-7xl w-[500px] max-h-[90vh] flex flex-col">
        <div className="font-bold border-b border-border-default py-4">
          {t('main:quick_select_multiple')}
        </div>
        <div className="border-b border-border-default">
          <div className="h-[500px]">
            <div className="custom-scrollbar overflow-auto h-full">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-50 ">
                  <tr className="border-b border-border-default flex bg-white ">
                    <th
                      onClick={handleSelectAll}
                      className="flex sticky top-0 z-50  text-left pl-3 py-3 text-sm font-medium w-28"
                    >
                      <span className="align-middle mr-2">{t('main:select_all')}</span>
                      <Checkbox
                        onClick={(e) => e.stopPropagation()}
                        checked={isSelectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="ml-2 sticky top-0 z-50  text-left py-3 text-sm font-medium flex-1">
                      {t('main:league_col')}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {listSelectedLeague.length > 0 &&
                    listSelectedLeague.map((league) => (
                      <tr
                        key={league.id}
                        className={`flex items-center py-[1px] cursor-pointer border-b border-border-default  transition-colors duration-200 font-semibold `}
                        onClick={() => toggleLeague(league.id)}
                      >
                        <td className="ml-[77px] mr-2  flex items-center ">
                          <Checkbox
                            checked={selectedIds.includes(league.id)}
                            onCheckedChange={() => toggleLeague(league.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>

                        <td className="px-4">
                          <span className="w-full bg-transparent text-sm outline-none border-none">
                            {league.league}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          <SelectMultipleAmountRandomizer
            checked={checked}
            setChecked={setChecked}
            from={fromValue}
            setFrom={setFrom}
            to={toValue}
            setTo={setTo}
          />
        </div>

        <div>
          <div className="flex justify-between py-3 px-4">
            <div className="flex"></div>
            <div className="gap-3 flex">
              <Button
                onClick={onClose}
                variant="outline"
                className="text-text-default border-border-default  hover:bg-transparent hover:border-gray-600  px-3 py-1.5 w-32"
              >
                {t('layout:cancel')}
              </Button>
              <Button className=" px-3 py-1.5 w-32 text-white" onClick={handleUpdate}>
                {t('layout:update')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
