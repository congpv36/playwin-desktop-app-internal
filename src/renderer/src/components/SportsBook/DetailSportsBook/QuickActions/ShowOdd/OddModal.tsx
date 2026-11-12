import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { GAME_TYPES } from '@shared/common/constants'
import { GetTicketShowOdd, PlaceTicketShowOdd } from '@shared/common/types'

import { OddModalInfo } from './types'

export const OddModal = memo(function OddModal({
  info,
  ticketShowOdd,
  onClose
}: {
  info: OddModalInfo
  ticketShowOdd: GetTicketShowOdd | null
  onClose: () => void
}) {
  const { t } = useTranslation('main')
  const [stake, setStake] = useState('')
  const [creditError, setCreditError] = useState('')
  const [betResult, setBetResult] = useState<{
    success: boolean
    title: string
    detail: string
  } | null>(null)
  const [betPlaced, setBetPlaced] = useState(false)
  const [isBetting, setIsBetting] = useState(false)
  const stakeValue = Number(stake)

  const isError = ticketShowOdd?.code === 1
  const isReady = ticketShowOdd?.code === 0
  const isOddChanged = isReady && ticketShowOdd?.odds !== ticketShowOdd?.oldsOdd
  const min = ticketShowOdd?.min ?? 0
  const max = ticketShowOdd?.max ?? 0

  const isInputDisabled = !isReady

  const isStakeValid = isReady && stake.trim() !== '' && stakeValue >= min && stakeValue <= max

  const creditValue = Number(info.account?.credit ?? 0)

  const handleBet = async () => {
    if (!isStakeValid) return

    if (creditValue < min || creditValue < stakeValue) {
      setCreditError(t('insufficient_credit_error'))
      return
    }

    setCreditError('')
    setBetResult(null)
    setIsBetting(true)

    try {
      const data = (await window.electron.ipcRenderer.invoke('PlaceBetShowOdds', {
        ticketShowOdd: ticketShowOdd,
        stake: stakeValue
      })) as PlaceTicketShowOdd

      setBetPlaced(true)

      if (data.code === 0) {
        setBetResult({
          success: true,
          title: t('bet_success'),
          detail: t('bet_receipt_id', { id: data.response.receiptID })
        })
      } else {
        setBetResult({
          success: false,
          title: t('bet_failed_title'),
          detail: t('bet_failed_reason', { reason: data.response.info })
        })
      }
    } finally {
      setIsBetting(false)
    }
  }

  const betTeam =
    info.side === 'Home'
      ? info.home
      : info.side === 'Away'
        ? info.away
        : info.side === 'Over'
          ? 'Over'
          : 'Under'

  return (
    <div
      className="fixed inset-0 bg-black/50 w-full h-full flex items-center justify-center z-50 rounded-lg"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-5 w-80 text-xs overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-red-700 text-sm">{t('ticket_info_title')}</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-base leading-none"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1.5">
          {info.account && (
            <>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b pt-1">
                {t('account_label')}
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">{t('login_id')}</span>
                <span className="font-semibold text-right">{info.account.loginID}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">{t('platform')}</span>
                <span className="font-semibold text-right">{info.account.platform}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">{t('credit_label')}</span>
                <span
                  className={`font-semibold text-right ${creditValue < min ? 'text-red-500' : ''}`}
                >
                  {info.account.credit}
                </span>
              </div>
            </>
          )}

          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b pt-1">
            {t('match_info_label')}
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 shrink-0">{t('league_label')}</span>
            <span className="font-semibold text-right text-red-700">{info.league}</span>
          </div>
          {info.meta.nameLeague !== info.league && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 shrink-0">{t('league_label')}</span>
              <span className="font-semibold text-right">{info.meta.nameLeague}</span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 shrink-0">{t('match_label')}</span>
            <div className="text-right flex">
              <div className="text-[#dd5a07] font-medium">{info.home}</div>
              <div className="mx-1 font-medium">{t('vs_lower')}</div>

              <div className="text-blue-color font-medium">{info.away}</div>
            </div>
          </div>
          {(info.meta.nameHome !== info.home || info.meta.nameAway !== info.away) && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 shrink-0">{t('team_label')}</span>
              <div className="text-right">
                <div>{info.meta.nameHome}</div>
                <div>{info.meta.nameAway}</div>
              </div>
            </div>
          )}

          {(info.meta.score || info.meta.stat || ticketShowOdd?.ticket.gameType !== null) && (
            <>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b pt-1 pt-1">
                {t('status_label')}
              </div>
              {ticketShowOdd?.ticket.gameType !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('type_col')}</span>
                  <span className="font-semibold">
                    {ticketShowOdd?.ticket.gameType === GAME_TYPES.RUNNING
                      ? t('live_label')
                      : ticketShowOdd?.ticket.gameType}
                  </span>
                </div>
              )}
              {info.meta.score && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('score_col')}</span>
                  <span className="font-semibold">{info.meta.score}</span>
                </div>
              )}
              {info.meta.stat && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('time_col')}</span>
                  <span className="font-semibold">{info.meta.stat}</span>
                </div>
              )}
            </>
          )}

          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b pt-1">
            {t('odds_section_label')}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('bet_type_label')}</span>
            <span className="font-semibold">{info.marketType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('half_label')}</span>
            <span className="font-semibold">{info.half}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('hdp_label')}</span>
            <span className="font-semibold">
              {info.line} ({info.hdp_point})
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">{t('bet')}</span>
            <span className="font-semibold">{betTeam}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-1">
            <span className="text-gray-500">{t('selected_odds_label')}</span>
            <span
              className={`font-bold text-sm ${info.value < 0 ? 'text-red-500' : 'text-green-600'}`}
            >
              {ticketShowOdd?.odds.toFixed(3)}
            </span>
          </div>
          <div>
            {!ticketShowOdd ? (
              <div className="flex items-center justify-center py-4 mt-1">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {!betPlaced && (
                  <div className="flex items-center gap-2 pt-2 mt-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={t('stake_placeholder')}
                      value={stake}
                      disabled={isInputDisabled || isBetting}
                      onChange={(e) => {
                        setStake(e.target.value.replace(/[^0-9]/g, ''))
                        setCreditError('')
                      }}
                      className="flex-1 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleBet}
                      disabled={!isStakeValid || isBetting}
                      className="px-3 py-[5px] rounded bg-red-500 text-white font-semibold text-xs disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-red-800 flex items-center justify-center gap-1.5 min-w-[44px]"
                    >
                      {isBetting ? (
                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        t('bet')
                      )}
                    </button>
                  </div>
                )}

                {creditError && (
                  <div className="mt-1 px-1 text-red-500 text-[11px]">{creditError}</div>
                )}

                {betResult && (
                  <div
                    className={`mt-2 px-2.5 py-2 rounded-md border flex items-start gap-1.5 text-[11px] font-medium leading-snug ${
                      betResult.success
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-600'
                    }`}
                  >
                    <span className="text-sm leading-none shrink-0">
                      {betResult.success ? '✅' : '⛔'}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-semibold">{betResult.title}</span>
                      <span className="font-normal">{betResult.detail}</span>
                    </span>
                  </div>
                )}

                {!betPlaced &&
                  (isError ? (
                    <div className="mt-1 px-1 text-red-500 text-[11px]">
                      {ticketShowOdd?.message}
                    </div>
                  ) : (
                    <div className="mt-1 px-1">
                      <div className="flex justify-between">
                        <span>{t('min_bet_label', { min })}</span>{' '}
                        <span>{t('max_bet_label', { max })}</span>
                      </div>
                      {isOddChanged && (
                        <div className="text-orange-500 text-[11px] mt-0.5">
                          {t('odds_changed_message', {
                            oldOdds: ticketShowOdd?.oldsOdd,
                            newOdds: ticketShowOdd?.odds
                          })}
                        </div>
                      )}
                    </div>
                  ))}
              </>
            )}
          </div>
          {/* <div className="text-[10px]1font-bold text-gray-400 uppercase tracking-wide border-b pt-1 pt-2">
            Raw JSON
          </div>
          <pre className="bg-gray-50 border rounded p-2 text-[9px] leading-4 overflow-x-auto whitespace-pre-wrap break-all text-gray-700 max-h-60 overflow-y-auto">
            {JSON.stringify(info.meta, null, 2)}
          </pre> */}
        </div>
      </div>
    </div>
  )
})
