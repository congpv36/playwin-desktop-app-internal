import { getTicket_1XBet } from './1XBet/actions/getTicket'
import { placeBet_1XBet } from './1XBet/actions/placeBet'
import createWorkerCrawl1XBet from './1XBet/workerCrawl?nodeWorker'
import createWorkerCrawl1XBet_AccountOrder2 from './1XBet/workerCrawl_AccountOrder2?nodeWorker'
import createWorkerLogin1XBet from './1XBet/workerLogin?nodeWorker'
import createWorkerCrawl3IN1Bet from './3In1bet/workerCrawl?nodeWorker'
import createWorkerCrawl3In1bet_AccountOrder2 from './3In1bet/workerCrawl_AccountOrder2?nodeWorker'
import createWorkerLogin3IN1Bet from './3In1bet/workerLogin?nodeWorker'
import createWorkerCrawlDafaBet from './DafaBet/workerCrawl?nodeWorker'
import createWorkerCrawlDafaBet_AccountOrder2 from './DafaBet/workerCrawl_AccountOrder2?nodeWorker'
import createWorkerLoginDafaBet from './DafaBet/workerLogin?nodeWorker'
import createWorkerCrawlFishBet88 from './FishBet88/workerCrawl?nodeWorker'
import createWorkerCrawlFishBet88_AccountOrder2 from './FishBet88/workerCrawl_AccountOrder2?nodeWorker'
import createWorkerLoginFishBet88 from './FishBet88/workerLogin?nodeWorker'
import createWorkerCrawlPs3838 from './Ps3838/workerCrawl?nodeWorker'
import createWorkerCrawlPs3838_AccountOrder2 from './Ps3838/workerCrawl_AccountOrder2?nodeWorker'
import createWorkerLoginPs3838 from './Ps3838/workerLogin?nodeWorker'
import createWorkerCrawlSbobet from './Sbobet/workerCrawl?nodeWorker'
import createWorkerCrawlSbobet_AccountOrder2 from './Sbobet/workerCrawl_AccountOrder2?nodeWorker'
import createWorkerLoginSbobet from './Sbobet/workerLogin?nodeWorker'
import createWorkerCrawlSingBet from './SingBet/workerCrawl?nodeWorker'
import createWorkerCrawlSingBet_AccountOrder2 from './SingBet/workerCrawl_AccountOrder2?nodeWorker'
import createWorkerLoginSingBet from './SingBet/workerLogin?nodeWorker'
import createWorkerCrawlViva88 from './Viva88/workerCrawl?nodeWorker'
import createWorkerCrawlViva88_AccountOrder2 from './Viva88/workerCrawl_AccountOrder2?nodeWorker'
import createWorkerLoginViva88 from './Viva88/workerLogin?nodeWorker'
import createWorkerCrawlWbet from './Wbet/workerCrawl?nodeWorker'
import createWorkerCrawlWbet_AccountOrder2 from './Wbet/workerCrawl_AccountOrder2?nodeWorker'
import createWorkerLoginWbet from './Wbet/workerLogin?nodeWorker'

import { getTicket_3in1Bet } from '@/worker/platform/3In1bet/actions/getTicket'
import { placeBet_3in1Bet } from '@/worker/platform/3In1bet/actions/placeBet'
import { getTicket_DafaBet } from '@/worker/platform/DafaBet/actions/getTicket'
import { placeBet_DafaBet } from '@/worker/platform/DafaBet/actions/placeBet'
import { getTicket_FishBet88 } from '@/worker/platform/FishBet88/actions/getTicket'
import { placeBet_FishBet88 } from '@/worker/platform/FishBet88/actions/placeBet'
import { getTicket_Ps3838 } from '@/worker/platform/Ps3838/actions/getTicket'
import { placeBet_Ps3838 } from '@/worker/platform/Ps3838/actions/placeBet'
import { getTicket_Sbobet } from '@/worker/platform/Sbobet/actions/getTicket'
import { placeBet_Sbobet } from '@/worker/platform/Sbobet/actions/placeBet'
import { getTicket_SingBet } from '@/worker/platform/SingBet/actions/getTicket'
import { placeBet_SingBet } from '@/worker/platform/SingBet/actions/placeBet'
import { getTicket_Viva88Bet } from '@/worker/platform/Viva88/actions/getTicket'
import { placeBet_Viva88Bet } from '@/worker/platform/Viva88/actions/placeBet'
import { getTicket_WBet } from '@/worker/platform/Wbet/actions/getTicket'
import { placeBet_WBet } from '@/worker/platform/Wbet/actions/placeBet'

export const PLATFORM = {
  VIVA88BET: 'Viva88Bet',
  SBOBET: 'Sbobet',
  WBET: 'WBet',
  '3IN1BET': '3in1Bet',
  PS3838: 'Ps3838',
  '1XBET': '1XBet',
  SINGBET: 'SingBet',
  DAFABET: 'DafaBet',
  FISHBET88: 'FishBet88'
}

const PLATFORM_DEFINITIONS: Record<
  string,
  {
    tableName?: string
    login: unknown
    crawl: unknown
    crawl_AccountOrder2: unknown
    getTicket: unknown
    placeBet: unknown
  }
> = {
  [PLATFORM.VIVA88BET]: {
    login: createWorkerLoginViva88,
    crawl: createWorkerCrawlViva88,
    crawl_AccountOrder2: createWorkerCrawlViva88_AccountOrder2,
    getTicket: getTicket_Viva88Bet,
    placeBet: placeBet_Viva88Bet
  },
  [PLATFORM.SBOBET]: {
    login: createWorkerLoginSbobet,
    crawl: createWorkerCrawlSbobet,
    crawl_AccountOrder2: createWorkerCrawlSbobet_AccountOrder2,
    getTicket: getTicket_Sbobet,
    placeBet: placeBet_Sbobet
  },
  [PLATFORM.WBET]: {
    login: createWorkerLoginWbet,
    crawl: createWorkerCrawlWbet,
    crawl_AccountOrder2: createWorkerCrawlWbet_AccountOrder2,
    getTicket: getTicket_WBet,
    placeBet: placeBet_WBet
  },
  [PLATFORM['3IN1BET']]: {
    tableName: 'IIIin1Bet',
    login: createWorkerLogin3IN1Bet,
    crawl: createWorkerCrawl3IN1Bet,
    crawl_AccountOrder2: createWorkerCrawl3In1bet_AccountOrder2,
    getTicket: getTicket_3in1Bet,
    placeBet: placeBet_3in1Bet
  },
  [PLATFORM.PS3838]: {
    login: createWorkerLoginPs3838,
    crawl: createWorkerCrawlPs3838,
    crawl_AccountOrder2: createWorkerCrawlPs3838_AccountOrder2,
    getTicket: getTicket_Ps3838,
    placeBet: placeBet_Ps3838
  },
  [PLATFORM.SINGBET]: {
    login: createWorkerLoginSingBet,
    crawl: createWorkerCrawlSingBet,
    crawl_AccountOrder2: createWorkerCrawlSingBet_AccountOrder2,
    getTicket: getTicket_SingBet,
    placeBet: placeBet_SingBet
  },
  [PLATFORM['1XBET']]: {
    tableName: 'IXBET',
    login: createWorkerLogin1XBet,
    crawl: createWorkerCrawl1XBet,
    crawl_AccountOrder2: createWorkerCrawl1XBet_AccountOrder2,
    getTicket: getTicket_1XBet,
    placeBet: placeBet_1XBet
  },
  [PLATFORM.DAFABET]: {
    login: createWorkerLoginDafaBet,
    crawl: createWorkerCrawlDafaBet,
    crawl_AccountOrder2: createWorkerCrawlDafaBet_AccountOrder2,
    getTicket: getTicket_DafaBet,
    placeBet: placeBet_DafaBet
  },
  [PLATFORM.FISHBET88]: {
    login: createWorkerLoginFishBet88,
    crawl: createWorkerCrawlFishBet88,
    crawl_AccountOrder2: createWorkerCrawlFishBet88_AccountOrder2,
    getTicket: getTicket_FishBet88,
    placeBet: placeBet_FishBet88
  }
}

export const TABLE_NAME_BY_PLATFORM: Record<string, string> = Object.fromEntries(
  Object.entries(PLATFORM_DEFINITIONS).map(([platform, { tableName }]) => [
    platform,
    tableName ?? platform
  ])
)

export const PLATFORM_CONFIG = Object.fromEntries(
  Object.entries(PLATFORM_DEFINITIONS).map(([platform, { login, crawl, crawl_AccountOrder2 }]) => [
    platform,
    { login, crawl, crawl_AccountOrder2 }
  ])
) as Record<
  string,
  {
    login: typeof createWorkerLoginPs3838
    crawl: typeof createWorkerCrawlPs3838
    crawl_AccountOrder2: typeof createWorkerCrawlPs3838_AccountOrder2
  }
>

export const PLATFORM_SERVICES = Object.fromEntries(
  Object.entries(PLATFORM_DEFINITIONS).map(([platform, { getTicket, placeBet }]) => [
    platform,
    { getTicket, placeBet }
  ])
) as Record<string, { getTicket: typeof getTicket_Ps3838; placeBet: typeof placeBet_Ps3838 }>
