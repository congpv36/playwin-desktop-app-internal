export type SettingSchemaType = {
  id: string
  profitMin: string
  profitMax: string
  gameType: string

  schedulerRunning: number
  schedulerInputRunning: string
  schedulerToday: number
  schedulerInputToday: string
  schedulerEarly: number
  schedulerInputEarly: string

  enableFirstStHalf: number
  betFirstHalf: number
  betFullTime: number
  firstStHalfBettingForm: string
  firstStHalfBettingUntil: string

  enableSecondStHalf: number
  betHalfTime: number
  secondStHalfBettingForm: string
  secondStHalfBettingUntil: string

  bettingMode: string
  amountRoundingEnabled: number
  roundType: string
  roundingNumber: string

  enablePerMatchLimitSetting: number

  ipAddress: string
  port: string
  username: string
  password: string

  oddsLessThan: number
  oddsMoreThan: number
  gameCommissionMoreThan: number
  gameCommissionLessThan: number

  oddsLessThanValue: string
  oddsMoreThanValue: string
  gameCommissionMoreThanValue: string
  gameCommissionLessThanValue: string

  enableRandomizer: number
  fromRandomizer: string
  toRandomizer: string

  isOther: number
  isBetUnderSelected: number
  isBetOverSelected: number
  isBetPutSelected: number
  isBetEatSelected: number

  isBetByOtherAcc: number

  settingTotalGoal: string
  settingScoreList: string

  betMode: string

  language: string
}

const settingSchema = `
        id TEXT PRIMARY KEY NOT NULL,
        profitMin TEXT,
        profitMax TEXT,
        gameType TEXT,
        
        schedulerRunning INTEGER,
        schedulerInputRunning TEXT,
        schedulerToday INTEGER,
        schedulerInputToday TEXT,
        schedulerEarly INTEGER,
        schedulerInputEarly TEXT,

        enableFirstStHalf INTEGER,
        betFirstHalf INTEGER,
        betFullTime INTEGER,
        firstStHalfBettingForm TEXT,
        firstStHalfBettingUntil TEXT,

        enableSecondStHalf INTEGER,
        betHalfTime INTEGER,
        secondStHalfBettingForm TEXT,
        secondStHalfBettingUntil TEXT,

        bettingMode TEXT,
        amountRoundingEnabled INTEGER,
        roundType TEXT,
        roundingNumber INTEGER,

        enablePerMatchLimitSetting INTEGER,

        ipAddress TEXT,
        port TEXT,
        username TEXT,
        password TEXT,

        oddsLessThan INTEGER,
        oddsMoreThan INTEGER,
        gameCommissionMoreThan INTEGER,
        gameCommissionLessThan INTEGER,

        oddsLessThanValue TEXT,
        oddsMoreThanValue TEXT,
        gameCommissionMoreThanValue TEXT,
        gameCommissionLessThanValue TEXT,

        enableRandomizer INTEGER,
        fromRandomizer TEXT,
        toRandomizer TEXT,

        isOther INTEGER,
        isBetUnderSelected INTEGER,
        isBetOverSelected INTEGER,
        isBetPutSelected INTEGER,
        isBetEatSelected INTEGER,

        isBetByOtherAcc INTEGER,

        settingTotalGoal TEXT,
        settingScoreList TEXT,

        betMode NOT NULL DEFAULT 'Auto',

        language NOT NULL DEFAULT 'en'
      `

export default settingSchema
