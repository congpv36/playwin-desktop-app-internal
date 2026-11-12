import React, { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { NotificationSave } from '@renderer/components/NotificationPopup/NotificationSave'
import { LeagueFilterContext } from '@renderer/context/LeagueFilterContext'
import InformationCircle from '@renderer/icons/information-circle'

const FooterLeagueFilter = () => {
  const context = useContext(LeagueFilterContext)
  const { t } = useTranslation(['main', 'layout'])
  if (!context) return null

  const { filterType } = context.filterType
  const { blockMajorLeague, allowMajorLeague } = context.actionCheckBoxMajorLeague

  const { setEnableEditLeagueFilter } = context.editLeagueFilter
  const { listAllowLeagueTable, listBlockLeagueTable } = context.tableData as {
    listAllowLeagueTable: { id: string | number; league: string }[]
    listBlockLeagueTable: { id: string | number; league: string }[]
  }

  const [showAlertMsg, setShowAlertMsg] = useState(false)

  const handleOK = () => {
    setShowAlertMsg(false)
    setEnableEditLeagueFilter()
  }

  return (
    <div className="px-4 pt-1 text-sm">
      <p className="mb-1 text-[#94979C]  whitespace-nowrap">
        {t('main:league_name_matching_note')}
      </p>
      <p className="mb-1 text-[#94979C]  whitespace-nowrap">
        {t('main:league_name_matching_example_1')}
      </p>
      <p className="text-[#94979C]  whitespace-nowrap">
        {t('main:league_name_matching_example_2')}
      </p>
      <div className="text-end pb-4 flex justify-between  whitespace-nowrap">
        {filterType == 'Allow' && listAllowLeagueTable.length < 1 && allowMajorLeague == 0 ? (
          <div className="text-red-color font-semibold ">{t('main:all_leagues_blocked')}</div>
        ) : (
          <div></div>
        )}

        <NotificationSave
          title={t('layout:message')}
          messageError={t('main:league_filter_saved')}
          showAlertDialog={showAlertMsg}
          setShowAlertDialog={setShowAlertMsg}
          handleOK={handleOK}
          ReactElement={<InformationCircle className="text-blue-500  mr-1" />}
        />
      </div>
    </div>
  )
}
export default React.memo(FooterLeagueFilter)
