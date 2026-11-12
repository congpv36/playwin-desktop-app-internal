import { FailedBetList, LeaguePointRandomizer, Setting, SportsBook } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'
import type { MessagePort } from 'worker_threads'

import { LeaguePointRandomizerType, SportBookSettingType } from '@shared/common/types'
import { GenerateTicketUpdateType, SportsBookType } from '@shared/common/types'

import { calculateBetAmountStd } from '@/worker/lib/calculateBetAmountStd'
import { formatTime } from '@/worker/lib/formatTime'
import { getRandomBetAmountValue } from '@/worker/lib/getRandomBetAmountValue'
import { getRandomValue } from '@/worker/lib/getRandomValue'
import { isOddInRange } from '@/worker/lib/isOddInRange'
import { isTicketBet } from '@/worker/lib/isTicketBet'

type PlatformInfo = {
  info: string
  setting: SportBookSettingType
  ticket: GenerateTicketUpdateType
}

export function validateSettingBeforeBet(
  ticketUpdate: GenerateTicketUpdateType[],
  sportBook1: SportBookSettingType,
  sportBook2: SportBookSettingType,
  gameType: string,
  port: MessagePort
):
  | {
      valid: true
      platforms: PlatformInfo[]
      betAmountStandardValid: string[]
      isTicketBetFlags: [number, number]
    }
  | { valid: false; fieldError: string } {
  const platforms = [
    { info: sportBook1.name, setting: sportBook1, ticket: ticketUpdate[0] },
    { info: sportBook2.name, setting: sportBook2, ticket: ticketUpdate[1] }
  ]

  const sendFail = (messageFn: (platform: (typeof platforms)[0]) => string) => {
    const ticketUpdate = platforms.map(({ info, setting, ticket }) => ({
      ...ticket,
      company: info,
      coverage: ticket.number === 0 ? 'FT' : 'FirstHalf',
      gameType,
      time: formatTime(),
      info: messageFn({ info, setting, ticket }),
      receiptID: '',
      receiptStatus: ''
    }))
    const recordDB = FailedBetList.create({ dataPair: JSON.stringify(ticketUpdate) })
    port?.postMessage({ type: 'FailedBetList', recordDB })
  }

  const isCheckOddPlatformPair = platforms.some((platform) => platform.setting.checkOdd)
  if (isCheckOddPlatformPair) {
    const invalidPlatforms = platforms.filter(
      ({ setting, ticket }) => !isOddInRange(setting.oddFrom, setting.oddTo, String(ticket.odd))
    )

    if (invalidPlatforms.length > 0) {
      sendFail((platform) => {
        const odd = String(platform.ticket.odd)
        const isValid = isOddInRange(platform.setting.oddFrom, platform.setting.oddTo, odd)
        return isValid
          ? 'Get Ticket Failed: Do not have any available for betting!'
          : `Get Ticket Failed: SportBook ${platform.info} odds ${odd} is out of range!`
      })
      return { valid: false, fieldError: 'Odd out of range' }
    }
  }

  const isNoBetPlatformPair = platforms.every(
    (platform) => platform.setting.generalSetting == 'NoBet'
  )
  if (isNoBetPlatformPair) {
    sendFail(
      (platform) =>
        `Get Ticket Failed: SportBook ${platform.info} setting select ${platform.setting.generalSetting}!`
    )
    return { valid: false, fieldError: 'Setting select NoBet' }
  }

  const isTicketBetFlags: [number, number] = [1, 1]
  const isCheckBetSelected = platforms.some(
    ({ setting }) => setting.generalSetting === 'BetSelected'
  )
  if (isCheckBetSelected) {
    const statusBets = platforms.map((platform) => isTicketBet(platform, gameType))
    if (!statusBets[0] && !statusBets[1])
      return { valid: false, fieldError: 'Setting select is not bet range' }
    if (!statusBets[0]) isTicketBetFlags[0] = 0
    if (!statusBets[1]) isTicketBetFlags[1] = 0
  }

  const settingApp = Setting.findAll() as SettingSchemaType[]
  let formValue = settingApp[0].fromRandomizer
  let toValue = settingApp[0].toRandomizer

  const betAmountStandardValid = platforms.map(({ setting, ticket }) => {
    const sportsBook = SportsBook.findOne({ platform: setting.name }) as SportsBookType
    let betAmount = sportsBook.betFixedAmountValue

    const { rounder, roundValue, roundType } = setting.amountRounderSetting

    if (!ticket.league) return betAmount

    const leaguePointRandomizer = LeaguePointRandomizer.findOne({
      league: ticket.league
    }) as LeaguePointRandomizerType

    if (leaguePointRandomizer && leaguePointRandomizer.checked == 1) {
      formValue = leaguePointRandomizer.fromValue
      toValue = leaguePointRandomizer.toValue

      const randomValue = getRandomValue(
        Number(betAmount),
        getRandomBetAmountValue(Number(formValue), Number(toValue))
      )
      if (randomValue !== 0) {
        betAmount = String(randomValue)
      }
    } else {
      if (settingApp[0].enableRandomizer) {
        const randomValue = getRandomValue(
          Number(betAmount),
          getRandomBetAmountValue(Number(formValue), Number(toValue))
        )
        if (randomValue !== 0) {
          betAmount = String(randomValue)
        }
      }
    }

    if (rounder) {
      betAmount = String(calculateBetAmountStd(betAmount, Number(roundValue), roundType))
    }

    if (settingApp[0].amountRoundingEnabled) {
      betAmount = String(
        calculateBetAmountStd(
          betAmount,
          Number(settingApp[0].roundingNumber),
          settingApp[0].roundType
        )
      )
    }

    return betAmount
  })

  return {
    valid: true,
    platforms,
    betAmountStandardValid,
    isTicketBetFlags
  }
}
