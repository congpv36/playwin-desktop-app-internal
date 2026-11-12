import { PerMatchDetail } from '@db/model'
import { PlatformPerMatchDetailsType } from '@db/schema/platformPerMatchDetails'

export const saveOrUpdateBetRecordPerMatchDetail = (ticket) => {
  const existingRecord = PerMatchDetail.findOne({
    platform: ticket.platform,
    coverage: ticket.coverage,
    gameStatus: ticket.gameType,
    league: ticket.nameLeague,
    home: ticket.home,
    away: ticket.away,
    bet: ticket.bet,
    HDP: ticket.HDP
  }) as PlatformPerMatchDetailsType

  if (!existingRecord) {
    PerMatchDetail.create({
      platform: ticket.platform,
      sport: 'Soccer',
      coverage: ticket.coverage,
      gameStatus: ticket.gameType,
      redCard: ticket.redCard,
      score: ticket.score,
      league: ticket.nameLeague,
      home: ticket.home,
      away: ticket.away,
      bet: ticket.bet,
      HDP: ticket.HDP,
      amount: ticket.betAmount_Standard,
      count: '1'
    })
    return
  }
  PerMatchDetail.update(
    { id: existingRecord.id },
    {
      amount: String(Number(ticket.betAmount_Standard) + Number(existingRecord.amount)),
      count: String(Number(existingRecord.count) + 1)
    }
  )
}
