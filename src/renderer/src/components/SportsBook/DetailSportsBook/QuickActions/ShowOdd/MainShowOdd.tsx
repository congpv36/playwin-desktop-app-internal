import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useVirtualizer } from '@tanstack/react-virtual'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'

import { AccountType, GetTicketShowOdd, ShowOddsResult, SportsBookType } from '@shared/common/types'

import { LeagueHeaderRow } from './LeagueHeaderRow'
import { MatchDataRow } from './MatchDataRow'
import { OddModal } from './OddModal'
import { LeagueEntry, MockAccountInfo, OddModalInfo } from './types'
import { flattenData } from './utils'

const LEAGUE_ROW_HEIGHT = 24
const MATCH_ROW_HEIGHT = 68
const HIGHLIGHT_MS = 4000
const POLL_INTERVAL_MS = 100
const LOADING_TIMEOUT_MS = 60000
const SHOW_ODDS_POLL_INTERVAL_MS = 500

export default function MainShowOdd({ sportsBook: _sportsBook }: { sportsBook: SportsBookType }) {
  const { t } = useTranslation('main')
  const [data, setData] = useState<LeagueEntry[]>([])
  const [changedKeys, setChangedKeys] = useState<Set<string>>(new Set())
  const [selectedOdd, setSelectedOdd] = useState<OddModalInfo | null>(null)
  const [ticketShowOdd, setTicketShowOdd] = useState<GetTicketShowOdd | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasDataRef = useRef(false)

  const [accounts, setAccounts] = useState<MockAccountInfo[]>([])
  const [accountsLoaded, setAccountsLoaded] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? null

  const flatRows = useMemo(() => flattenData(data), [data])

  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => {
      const row = flatRows[i]
      return row.type === 'league' ? LEAGUE_ROW_HEIGHT : MATCH_ROW_HEIGHT * row.markets.length
    },
    overscan: 8
  })

  useEffect(() => {
    let cancelled = false
    let pollTimeout: ReturnType<typeof setTimeout>

    const getShowOdds = async () => {
      const result = (await window.electron.ipcRenderer.invoke('ActivePlatformShowOdds', {
        platform: _sportsBook.platform
      })) as ShowOddsResult

      if (cancelled) return

      if (!result.data.length) {
        pollTimeout = setTimeout(getShowOdds, SHOW_ODDS_POLL_INTERVAL_MS)
        return
      }

      hasDataRef.current = true
      setIsLoading(false)
      setData(result.data as LeagueEntry[])
    }

    const getAccounts = async () => {
      const result = (await window.electron.ipcRenderer.invoke('GetAccountShowOdds', {
        platform: _sportsBook.platform
      })) as AccountType[]

      const mapped = result.map((acc) => ({
        id: acc.id,
        loginID: acc.loginID,
        platform: acc.platformName,
        credit: acc.credit
      }))

      setAccounts(mapped)
      setSelectedAccountId((prev) =>
        mapped.some((a) => a.id === prev) ? prev : (mapped[0]?.id ?? '')
      )
      setAccountsLoaded(true)
    }
    getShowOdds()
    getAccounts()

    return () => {
      cancelled = true
      clearTimeout(pollTimeout)
    }
  }, [_sportsBook])

  useEffect(() => {
    setIsLoading(true)
    hasDataRef.current = false

    let elapsedMs = 0
    const pollTimer = setInterval(() => {
      elapsedMs += POLL_INTERVAL_MS

      if (hasDataRef.current) {
        clearInterval(pollTimer)
        return
      }

      if (elapsedMs >= LOADING_TIMEOUT_MS) {
        clearInterval(pollTimer)
        setIsLoading(false)
      }
    }, POLL_INTERVAL_MS)

    window.electron.ipcRenderer.on('CrawlDone', (_, result: ShowOddsResult) => {
      hasDataRef.current = true
      clearInterval(pollTimer)
      setIsLoading(false)

      if (!result.data.length) {
        setData([])
        return
      }
      setAccountsLoaded(false)

      setData(result.data as LeagueEntry[])

      if (result.changedKeys.length > 0) {
        const newKeys = new Set(result.changedKeys)
        setChangedKeys((prev) => new Set([...prev, ...newKeys]))
        setTimeout(() => {
          setChangedKeys((prev) => {
            const next = new Set(prev)
            newKeys.forEach((k) => next.delete(k))
            return next
          })
        }, HIGHLIGHT_MS)
      }
    })

    return () => {
      clearInterval(pollTimer)
      window.electron.ipcRenderer.removeAllListeners('CrawlDone')
    }
  }, [])

  const handleOnclick = async (info: OddModalInfo) => {
    if (!info.account) return

    setSelectedOdd(info)
    setTicketShowOdd(null)

    const dataGetTicketShowOdd = (await window.electron.ipcRenderer.invoke('GetTicketShowOdd', {
      ticket: info.meta,
      infoBet: {
        account: info.account,
        bet:
          info.side === 'Home'
            ? info.home
            : info.side === 'Away'
              ? info.away
              : info.side === 'Over'
                ? 'Over'
                : 'Under',
        odd: Number(info.value.toFixed(3))
      }
    })) as GetTicketShowOdd

    setTicketShowOdd(dataGetTicketShowOdd)
  }

  const handleCloseOddModal = () => {
    setSelectedOdd(null)
    setTicketShowOdd(null)
  }

  if (accountsLoaded && !accounts.length) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-500">
        {t('no_data')}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-brand-color border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-500">
        {t('no_data')}
      </div>
    )
  }

  return (
    <>
      {selectedOdd && (
        <OddModal info={selectedOdd} ticketShowOdd={ticketShowOdd} onClose={handleCloseOddModal} />
      )}
      <div className="h-full text-xs flex flex-col items-center">
        <div className="flex items-center gap-1  px-[16px] pb-2 ">
          <span className="font-medium w-[140px] text-sm leading-none">
            {t('account_bet_label')}:
          </span>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="h-[26px] text-sm pl-3 pr-1 border-border-default rounded-[3px] leading-none">
              <SelectValue placeholder={t('select_account')} />
            </SelectTrigger>
            <SelectContent className="border-border-default h-max-48">
              <SelectGroup className="bg-white">
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id} className="text-sm pl-3 px-2 h-7">
                    {acc.loginID}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div ref={scrollRef} className="overflow-y-auto overflow-x-hidden flex-1 w-fit">
          <div className="w-fit border border-y-0">
            <div className="border-y bg-white grid grid-cols-[70px_300px_0px_240px_0px_240px] sticky top-0 z-10">
              <div className="border-r relative">
                <div className="absolute top-2 left-0 right-0 flex items-center justify-center text-red-700 font-bold">
                  {t('time')}
                </div>
              </div>
              <div className="border-r relative">
                <div className="absolute top-2 left-0 right-0 flex items-center justify-center text-red-700 font-bold">
                  {t('event_col')}
                </div>
              </div>
              <div className="col-span-2 border-r">
                <div className="flex items-center justify-center text-red-700 font-bold">
                  {t('match_col')}
                </div>
                <div className="grid grid-cols-2 border-t">
                  <div className="border-r flex items-center justify-center text-red-700 font-bold">
                    {t('hdp')}
                  </div>
                  <div className="flex items-center justify-center text-red-700 font-bold">
                    {t('ou_col')}
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-center text-red-700 font-bold">
                  {t('first_half_col').toUpperCase()}
                </div>
                <div className="grid grid-cols-2 border-t">
                  <div className="border-r flex items-center justify-center text-red-700 font-bold">
                    {t('hdp')}
                  </div>
                  <div className="flex items-center justify-center text-red-700 font-bold">
                    {t('ou_col')}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const row = flatRows[virtualItem.index]

                const matchBg =
                  row.type === 'match'
                    ? row.matchIndexInLeague % 2 === 0
                      ? 'bg-brand-color/5'
                      : 'bg-brand-color/10'
                    : ''

                return (
                  <div
                    key={virtualItem.key}
                    className={matchBg}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`
                    }}
                  >
                    {row.type === 'league' ? (
                      <LeagueHeaderRow league={row.league} />
                    ) : (
                      <MatchDataRow
                        league={row.league}
                        home={row.home}
                        away={row.away}
                        gameType={row.gameType}
                        date={row.date}
                        time={row.time}
                        score={row.score}
                        stat={row.stat}
                        markets={row.markets}
                        li={row.leagueIndex}
                        changedKeys={changedKeys}
                        account={selectedAccount}
                        onOddClick={handleOnclick}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
