import { BetToType } from '@shared/common/types'
import { PlatformType } from '@shared/common/types'

const generateDetailSetting = () => {
  return {
    generalSetting: 'BetAll',
    FT_PK: 0,
    FT_Put: 0,
    FT_Eat: 0,
    FT_Over: 0,
    FT_Under: 0,
    Half_PK: 0,
    Half_Put: 0,
    Half_Eat: 0,
    Half_Over: 0,
    Half_Under: 0
  }
}

const generateBetTo = () => {
  const betLevels = Array.from({ length: 89 }, (_, i) => i * 0.25)

  return {
    betAll: 1,
    selectAll: 0,
    ...Object.fromEntries(
      betLevels.map((level) => [`hdp_${level.toString().replace('.', '_')}`, 0])
    )
  } as BetToType
}

const generateGameRange = () => {
  return {
    betAll: 1,
    today: 1,
    early: 1,
    running: 1,
    allMinutes: 1,
    arrayMinutes: [],
    checkOdd: 0,
    oddFrom: '0.70',
    oddTo: '-0.01'
  }
}

export function generatePlatformData(platform: PlatformType) {
  return {
    id: platform.id,
    name: platform.name,

    checkOdd: 0,
    oddFrom: '0.01',
    oddTo: '-0.01',
    betOpposite: 0,
    bet: 1,
    contra: 1,

    amountRounderSetting: {
      rounder: 0,
      roundType: 'auto',
      roundValue: '2'
    },
    ...generateDetailSetting(),

    FT_PK_Detail: {
      range: generateGameRange()
    },

    FT_Put_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    },

    FT_Eat_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    },

    FT_Over_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    },

    FT_Under_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    },

    Half_PK_Detail: {
      range: generateGameRange()
    },

    Half_Put_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    },

    Half_Eat_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    },

    Half_Over_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    },

    Half_Under_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    }
  }
}

export function generateTargetAccountData() {
  return {
    ...generateDetailSetting(),

    FT_PK_Detail: {
      range: generateGameRange()
    },

    FT_Put_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    },

    FT_Eat_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    },

    FT_Over_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    },

    FT_Under_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    },

    Half_PK_Detail: {
      range: generateGameRange()
    },

    Half_Put_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    },

    Half_Eat_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    },

    Half_Over_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    },

    Half_Under_Detail: {
      betTo: generateBetTo(),
      range: generateGameRange()
    }
  }
}
