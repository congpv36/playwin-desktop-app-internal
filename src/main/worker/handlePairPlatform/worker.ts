/* eslint-disable no-constant-condition */
const { parentPort, workerData } = require('worker_threads')
import { setTimeout } from 'timers/promises'

import db from '@db/config/database'
import { BetListResult, createModel, DataBet, Setting, SportBookCombination } from '@db/model'
import dataCrawlByPlatformSchema from '@db/schema/dataCrawlByPlatform'
import { SettingSchemaType } from '@db/schema/setting'
import { SportBookCombinationDBType } from '@db/schema/sportBookCombination'

import { GAME_TYPES } from '@shared/common/constants'
import { SportBookSettingType } from '@shared/common/types'
import { DataCrawlType } from '@shared/common/types'

import { calculateProfit } from '@/worker/lib/calculateProfit'
import { checkOddsSetting } from '@/worker/lib/checkOddsSetting'
import { clearTablesForGameType } from '@/worker/lib/clearTablesForGameType'
import { generateTicketUpdate } from '@/worker/lib/generateTicketUpdate'
import { handleCheckCombinationSetting } from '@/worker/lib/handleCheckCombinationSetting'
import { isCheckNumberHalf } from '@/worker/lib/isCheckNumberHalf'
import { createIsValidData } from '@/worker/lib/isValidData'
import { validateRunningScore } from '@/worker/lib/validateRunningScore'
import { TABLE_NAME_BY_PLATFORM } from '@/worker/platform/platform.config'

let gameType: string | null = null
const key = workerData.pair as string

async function startWorking() {
  while (true) {
    const platformPair = SportBookCombination.findOne({ key }) as SportBookCombinationDBType
    if (!platformPair) return
    const sportBook1 = JSON.parse(platformPair.sportBook1) as SportBookSettingType
    const sportBook2 = JSON.parse(platformPair.sportBook2) as SportBookSettingType
    await handleCombinationPlatform(platformPair, sportBook1, sportBook2)

    await setTimeout(1500)
  }
}

const modelByTable = new Map<string, ReturnType<typeof createModel>>()

function getPlatformModel(platformName: string) {
  const tableName = TABLE_NAME_BY_PLATFORM[platformName] ?? platformName
  let model = modelByTable.get(tableName)
  if (!model) {
    model = createModel(tableName, dataCrawlByPlatformSchema)
    modelByTable.set(tableName, model)
  }
  return model
}

const getMatchKey = (data: DataCrawlType) =>
  `${data.league}\u0001${data.home}\u0001${data.away}\u0001${data.typeOdd}\u0001${data.hdp_point}\u0001${data.number}`

const isMapped = (data: DataCrawlType) => Boolean(data.league && data.home && data.away)

const normalizeName = (name: string | null | undefined) =>
  (name ?? '').toLowerCase().replace(/\s+/g, ' ').trim()

const normalizeDate = (date: string | null | undefined) => {
  const parts = (date ?? '').match(/\d+/g)
  if (!parts || parts.length < 2) return ''
  const [month, day] = parts[0].length === 4 ? parts.slice(1, 3) : parts.slice(0, 2)
  if (!month || !day) return ''
  return `${month.padStart(2, '0')}/${day.padStart(2, '0')}`
}

const getFallbackKey = (data: DataCrawlType) => {
  const nameHome = normalizeName(data.nameHome)
  const nameAway = normalizeName(data.nameAway)
  const date = normalizeDate(data.date)
  if (!nameHome || !nameAway || !date) return null

  if (nameHome.startsWith('unknown') || nameAway.startsWith('unknown')) return null
  return `${nameHome}\u0001${nameAway}\u0001${date}\u0001${data.typeOdd}\u0001${data.hdp_point}\u0001${data.number}`
}

const fillStandardNames = (data: DataCrawlType, other: DataCrawlType): DataCrawlType => {
  if (isMapped(data)) return data
  const source = isMapped(other) ? other : null
  return {
    ...data,
    league: data.league || source?.league || data.nameLeague,
    home: data.home || source?.home || data.nameHome,
    away: data.away || source?.away || data.nameAway
  }
}

const MAX_LOGGED_FALLBACK = 5_000
const loggedFallbackPairs = new Set<string>()

const logFallbackPair = (data1: DataCrawlType, data2: DataCrawlType) => {
  const logKey = `${data1.platform}\u0001${data1.idEvent}\u0001${data2.platform}\u0001${data2.idEvent}`
  if (loggedFallbackPairs.has(logKey)) return
  if (loggedFallbackPairs.size >= MAX_LOGGED_FALLBACK) loggedFallbackPairs.clear()
  loggedFallbackPairs.add(logKey)
  // console.log(
  //   `[Pair fallback] ${data1.platform}: ${data1.nameLeague} | ${data1.nameHome} vs ${data1.nameAway}` +
  //     ` (mapped: ${data1.league ?? '-'} | ${data1.home ?? '-'} vs ${data1.away ?? '-'})` +
  //     ` <-> ${data2.platform}: ${data2.nameLeague} | ${data2.nameHome} vs ${data2.nameAway}` +
  //     ` (mapped: ${data2.league ?? '-'} | ${data2.home ?? '-'} vs ${data2.away ?? '-'})` +
  //     ` @ ${data1.date} ${data1.typeOdd} ${data1.hdp_point} #${data1.number}`
  // )
}

async function handleCombinationPlatform(
  platformPair: SportBookCombinationDBType,
  sportBook1: SportBookSettingType,
  sportBook2: SportBookSettingType
) {
  const settingInfo = Setting.findAll()[0] as SettingSchemaType

  if (gameType !== settingInfo.gameType) {
    gameType = settingInfo.gameType
    clearTablesForGameType()
    return
  }

  const Platform1_Model = getPlatformModel(sportBook1.name)
  const Platform2_Model = getPlatformModel(sportBook2.name)

  const [listDataCrawlPlatform1, listDataCrawlPlatform2] = db.transaction(() => [
    Platform1_Model.findAll() as DataCrawlType[],
    Platform2_Model.findAll() as DataCrawlType[]
  ])()
  if (!listDataCrawlPlatform1.length || !listDataCrawlPlatform2.length) return

  const dataCrawlPlatform2ByKey = new Map<string, DataCrawlType>()

  const dataCrawlPlatform2ByFallbackKey = new Map<string, DataCrawlType | null>()
  for (const dataCrawlPlatform2 of listDataCrawlPlatform2) {
    if (isMapped(dataCrawlPlatform2)) {
      const matchKey = getMatchKey(dataCrawlPlatform2)

      if (!dataCrawlPlatform2ByKey.has(matchKey)) {
        dataCrawlPlatform2ByKey.set(matchKey, dataCrawlPlatform2)
      }
    }

    const fallbackKey = getFallbackKey(dataCrawlPlatform2)
    if (!fallbackKey) continue
    dataCrawlPlatform2ByFallbackKey.set(
      fallbackKey,
      dataCrawlPlatform2ByFallbackKey.has(fallbackKey) ? null : dataCrawlPlatform2
    )
  }

  const isRunning = settingInfo.gameType === GAME_TYPES.RUNNING
  const candidatesPlatform1 = listDataCrawlPlatform1.filter(({ score }) => !(isRunning && !score))

  // Pass 1: standardized key. Pass 2: fallback key, only for unpaired rows and
  // platform2 rows not already used, so one row is never paired twice
  const pairs: [DataCrawlType, DataCrawlType][] = []
  const pairedPlatform1 = new Set<DataCrawlType>()
  const usedPlatform2 = new Set<DataCrawlType>()

  for (const dataCrawlPlatform1 of candidatesPlatform1) {
    if (!isMapped(dataCrawlPlatform1)) continue
    const dataCrawlPlatform2 = dataCrawlPlatform2ByKey.get(getMatchKey(dataCrawlPlatform1))
    if (!dataCrawlPlatform2) continue
    pairs.push([dataCrawlPlatform1, dataCrawlPlatform2])
    pairedPlatform1.add(dataCrawlPlatform1)
    usedPlatform2.add(dataCrawlPlatform2)
  }

  for (const dataCrawlPlatform1 of candidatesPlatform1) {
    if (pairedPlatform1.has(dataCrawlPlatform1)) continue
    const fallbackKey = getFallbackKey(dataCrawlPlatform1)
    if (!fallbackKey) continue
    const dataCrawlPlatform2 = dataCrawlPlatform2ByFallbackKey.get(fallbackKey)
    if (!dataCrawlPlatform2 || usedPlatform2.has(dataCrawlPlatform2)) continue
    usedPlatform2.add(dataCrawlPlatform2)
    logFallbackPair(dataCrawlPlatform1, dataCrawlPlatform2)
    pairs.push([
      fillStandardNames(dataCrawlPlatform1, dataCrawlPlatform2),
      fillStandardNames(dataCrawlPlatform2, dataCrawlPlatform1)
    ])
  }

  const isValidData = createIsValidData()
  let dataBetCount = DataBet.count()

  for (const [dataCrawlPlatform1, dataCrawlPlatform2] of pairs) {
    //[Setting] - Check General Setting (1st Half - 2nd Half)
    if (!isCheckNumberHalf(dataCrawlPlatform1, settingInfo)) continue

    // DB-backed checks last: only run for rows that actually have a pair
    if (!isValidData(dataCrawlPlatform1) || !isValidData(dataCrawlPlatform2)) continue

    const profitCombos = [
      {
        odd1: dataCrawlPlatform1.home_over,
        odd1Sub: dataCrawlPlatform1.away_under,

        odd2: dataCrawlPlatform2.away_under,
        odd2Sub: dataCrawlPlatform2.home_over,

        bet1: dataCrawlPlatform1.typeOdd === 'SPREAD' ? dataCrawlPlatform1.nameHome : 'Over',
        bet1Sub: dataCrawlPlatform1.typeOdd === 'SPREAD' ? dataCrawlPlatform1.nameAway : 'Under',

        bet2: dataCrawlPlatform2.typeOdd === 'SPREAD' ? dataCrawlPlatform2.nameAway : 'Under',
        bet2Sub: dataCrawlPlatform2.typeOdd === 'SPREAD' ? dataCrawlPlatform2.nameHome : 'Over'
      },
      {
        odd1: dataCrawlPlatform1.away_under,
        odd1Sub: dataCrawlPlatform1.home_over,

        odd2: dataCrawlPlatform2.home_over,
        odd2Sub: dataCrawlPlatform2.away_under,

        bet1: dataCrawlPlatform1.typeOdd === 'SPREAD' ? dataCrawlPlatform1.nameAway : 'Under',
        bet1Sub: dataCrawlPlatform1.typeOdd === 'SPREAD' ? dataCrawlPlatform1.nameHome : 'Over',

        bet2: dataCrawlPlatform2.typeOdd === 'SPREAD' ? dataCrawlPlatform2.nameHome : 'Over',
        bet2Sub: dataCrawlPlatform2.typeOdd === 'SPREAD' ? dataCrawlPlatform2.nameAway : 'Under'
      }
    ]

    for (const { odd1, odd1Sub, odd2, odd2Sub, bet1, bet1Sub, bet2, bet2Sub } of profitCombos) {
      //[Setting] - Check Profit Commission
      const profitResult = calculateProfit(Number(odd1), Number(odd2))
      if (profitResult.status !== 'OK') continue

      //[Setting] - Check Odds Setting
      const checkOdds = checkOddsSetting(odd1, odd2, profitResult.profit)
      if (checkOdds.ErrorCode == 1) continue

      const score =
        gameType === GAME_TYPES.RUNNING
          ? (dataCrawlPlatform1.score ?? dataCrawlPlatform2.score ?? '0-0')
          : ''
      const redCard =
        gameType === GAME_TYPES.RUNNING
          ? (dataCrawlPlatform1.redCard ?? dataCrawlPlatform2.redCard ?? '0-0')
          : ''
      const stat = dataCrawlPlatform1.stat ?? dataCrawlPlatform2.stat ?? ''
      const type = dataCrawlPlatform1.type ?? dataCrawlPlatform2.type

      const commonData = { score, redCard, stat, type }

      const dataTicketI = { ...dataCrawlPlatform1, ...commonData } as DataCrawlType
      const dataTicketII = { ...dataCrawlPlatform2, ...commonData } as DataCrawlType

      const is_valid_score_running = validateRunningScore(score, settingInfo)

      if (is_valid_score_running === false) continue

      const ticketUpdate = generateTicketUpdate(
        dataTicketI,
        bet1,
        bet1Sub,
        odd1,
        odd1Sub,
        checkOdds.Data.infoOdd1,
        dataTicketII,
        bet2,
        bet2Sub,
        odd2,
        odd2Sub,
        checkOdds.Data.infoOdd2,
        profitResult.profit,
        settingInfo.gameType
      )

      //[Bet Setting] -  Check Combination Setting
      const validBetTicketPairs = handleCheckCombinationSetting(
        ticketUpdate,
        sportBook1,
        sportBook2,
        gameType,
        parentPort
      )

      if (!validBetTicketPairs) continue
      const record = BetListResult.create({ dataPair: JSON.stringify(validBetTicketPairs) })
      parentPort.postMessage({ type: 'BetList', recordDB: record })

      if (dataBetCount < 50) {
        DataBet.create({
          idPlatformPair: platformPair.id,
          dataPair: JSON.stringify(validBetTicketPairs)
        })
        dataBetCount++
      }
    }
  }
}

startWorking()
