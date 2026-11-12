import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { LeagueFilterContext } from '@renderer/context/LeagueFilterContext'
import QuestionMarkCircle from '@renderer/icons/question-mark-circle'

import { MAJOR_LEAGUE } from '@shared/common/constants'

import { Checkbox } from '../ui/checkbox'

const ActionTableLeagueFilter = ({ handleCopy, handlePaste }) => {
  const context = useContext(LeagueFilterContext)
  const { t } = useTranslation(['main', 'layout'])
  if (!context) return null

  const { filterType } = context.filterType
  const { blockMajorLeague, setBlockMajorLeague, allowMajorLeague, setAllowMajorLeague } =
    context.actionCheckBoxMajorLeague

  const stateCheckBox = filterType === 'Block' ? blockMajorLeague : allowMajorLeague
  const setCheckBox = filterType === 'Block' ? setBlockMajorLeague : setAllowMajorLeague

  return (
    <div className="flex items-center justify-between py-3 px-4  border-b border-border-default overflow-hidden min-w-0">
      {/* Left side - Checkbox with label */}
      <div className="flex items-center gap-2 flex-shrink-0 overflow-hidden">
        <Checkbox
          name="BlockMajorLeague"
          id="BlockMajorLeague"
          checked={Boolean(stateCheckBox)}
          onCheckedChange={(checked) => setCheckBox(Number(checked))}
        />
        <label
          htmlFor="BlockMajorLeague"
          className=" text-sm whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {filterType === 'Block' ? t('main:block_major_leagues') : t('main:allow_major_leagues')}
        </label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex-shrink-0">
              <QuestionMarkCircle className=" w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent className=" bg-white text-text-default  rounded shadow-lg">
              {MAJOR_LEAGUE.map((league, index) => (
                <div key={league.league} className="text-xs">
                  {index + 1}) {league.league.replace('%', '')}
                </div>
              ))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <button
          onClick={handlePaste}
          className="px-3 py-1.5 bg-white border border-border-default rounded  text-sm hover:border-[#C0443C] hover:bg-[#C0443C] hover:text-white transition-colors duration-200 whitespace-nowrap"
        >
          {t('main:paste_league')}
        </button>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 bg-white border border-border-default rounded  text-sm hover:border-[#C0443C] hover:bg-[#C0443C] hover:text-white transition-colors duration-200 whitespace-nowrap"
        >
          {t('main:copy_league')}
        </button>
      </div>
    </div>
  )
}

export default React.memo(ActionTableLeagueFilter)
