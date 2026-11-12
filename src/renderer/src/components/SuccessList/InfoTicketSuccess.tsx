import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal } from '@renderer/components/Common/Modal'

import { TicketInfoDataBetType } from '@shared/common/types'

export const InfoTicketSuccess = ({
  setShowInfoTicketSuccess,
  ticket
}: {
  setShowInfoTicketSuccess: Dispatch<SetStateAction<boolean>>
  ticket: TicketInfoDataBetType
}) => {
  const { t } = useTranslation(['main', 'layout'])
  return (
    <Modal
      title={`[${ticket.company.split('-')[1]}] ${ticket.league} : ${ticket.nameHome} -vs- ${ticket.nameAway} `}
      onClose={() => setShowInfoTicketSuccess(false)}
    >
      <div className="pb-2 bg-layout-color rounded-b-2xl">
        <div className="p-2">
          <span>
            {`[${ticket.company.split('-')[1]}] ${ticket.league} : ${ticket.nameHome} -vs- ${ticket.nameAway} : ${ticket.bet} @${ticket.coverage}${(() => {
              if (ticket.bet === ticket.nameHome || ticket.bet === ticket.nameAway) return 'HDP'
              return 'OU'
            })()} ${ticket.hdp_point}, ${ticket.odd} `}
          </span>
          <div className="border border-white px-2 py-1">
            <div className="flex">
              <span className="w-36">Date</span>
              <span className="pr-2">:</span>
              <span>{ticket.time}</span>
            </div>
            <div className="flex">
              <span className="w-36">Bet Date</span>
              <span className="pr-2">:</span>
            </div>
            <div className="flex">
              <span className="w-36">Bet Date Time</span>
              <span className="pr-2">:</span>
              <span>2010/01/01 00:00:00</span>
            </div>
            <div className="flex">
              <span className="w-36">Sports</span>
              <span className="pr-2">:</span>
              <span>Soccer</span>
            </div>
            <div className="flex">
              <span className="w-36">Sportsbook</span>
              <span className="pr-2">:</span>
              <span>{ticket.platform}</span>
            </div>
            <div className="flex">
              <span className="w-36">Account</span>
              <span className="pr-2">:</span>
              <span>{ticket.company.split('-')[1]}</span>
            </div>
            <div className="flex">
              <span className="w-36">{t('red_card')}</span>
              <span className="pr-2">:</span>
              <span>0-0</span>
            </div>
            <div className="flex">
              <span className="w-36">HomeOdds</span>
              <span className="pr-2">:</span>
              <span>{ticket.home_over}</span>
            </div>
            <div className="flex">
              <span className="w-36">AwayOdds</span>
              <span className="pr-2">:</span>
              <span>{ticket.away_under}</span>
            </div>
            <div className="flex">
              <span className="w-36">AmountRange</span>
              <span className="pr-2">:</span>
              <span>MYR6 - 988</span>
            </div>
            <div className="flex">
              <span className="w-36">{t('game_type_col')}</span>
              <span className="pr-2">:</span>
              <span>{ticket.gameType}</span>
            </div>
            <div className="flex">
              <span className="w-36">OddsType</span>
              <span className="pr-2">:</span>
              <span>Malay</span>
            </div>
            <div className="flex">
              <span className="w-36">BetTarget</span>
              <span className="pr-2">:</span>
              <span>
                {ticket.coverage}_
                {(() => {
                  if (ticket.bet === ticket.nameHome) return t('home_team')
                  if (ticket.bet === ticket.nameAway) return t('away_team')
                  return ticket.bet
                })()}
              </span>
            </div>
            <div className="flex">
              <span className="w-36">RunningCoverage</span>
              <span className="pr-2">:</span>
              <span>{ticket.coverage}</span>
            </div>
            <div className="flex">
              <span className="w-36">{t('receipt_id')}</span>
              <span className="pr-2">:</span>
              <span>{ticket.receiptID}</span>
            </div>
            <div className="flex">
              <span className="w-36">{t('receipt_status')}</span>
              <span className="pr-2">:</span>
              <span>Success</span>
            </div>
          </div>
        </div>
        <div
          className="border rounded-md border-gray-500 flex justify-center py-[1px] items-center mx-1 hover:border-blue-500 bg-white cursor-pointer"
          onClick={() => setShowInfoTicketSuccess(false)}
        >
          {t('ok', { ns: 'layout' })}
        </div>
      </div>
    </Modal>
  )
}
