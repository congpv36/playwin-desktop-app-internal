export interface AccountBalanceResponse {
  generalBalance: BalanceInfo
  classicGamesBalance: BalanceInfo & {
    incompleteGame: boolean
  }
  isEnableClassicGamesBalance: boolean
}

interface BalanceInfo {
  cashBalance: number
  outstanding: number
  givenCredit: number
  betCredit: number
}

export type OddsInfoItem_TicketSbobet = {
  betCondition: string
  liveAwayScore: number
  liveHomeScore: number
  oddsId: number
  point: number
  price: number
  priceStyle: number
  errorCode: number
  uid: string
  eventId: number
  maxStake: number
  minStake: number
  marketType: number
  option: string
}

export type TypeTicket_Sbobet = {
  minBet: number
  maxBet: number
  balance: number
  oddsInfo: {
    [key: string]: {
      betCondition: string
      liveAwayScore: number
      liveHomeScore: number
      oddsId: number
      point: number
      price: number
      priceStyle: number
      errorCode: number
      uid: string
    }
  }
  errorCode: number
}

export type PlaceBetResponse_Sbobet = {
  isPlaceBetSuccess: boolean
  transId: number
  placeOrderStatus: number
  price: number
  orderStatus: number
  oddsId: number
  option: string
  message: string
  extraInfo: string
}
