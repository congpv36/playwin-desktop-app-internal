import { createContext, SetStateAction, useEffect, useState } from 'react'

import { SettingScoreListType, SettingTotalGoalType, SettingType } from '@shared/common/types'

interface SchedulerState {
  value: number
  setValue: (value: number) => void
  input: string
  setInput: (value: string) => void
}

interface FirstHalfState {
  enableFirstStHalf: number
  betFirstHalf: number
  betFullTime: number
  firstStHalfBettingForm: string
  firstStHalfBettingUntil: string
}

interface SecondHalfState {
  enableSecondStHalf: number
  betHalfTime: number
  secondStHalfBettingForm: string
  secondStHalfBettingUntil: string
}

export interface BettingModeState {
  bettingMode: string
  amountRoundingEnabled: number
  roundType: string
  roundingNumber: string
  testRounding: string
}

interface SchedulerContextType {
  oddsTypeSetting: {
    profitMin: string
    setProfitMin: (value: string) => void
    profitMax: string
    setProfitMax: (value: string) => void
  }
  gameType: { gameType: string; setGameType: (value: string) => void }
  betMode: { betMode: string; setBetMode: (value: string) => void }
  gameTypeScheduler: {
    running: SchedulerState
    today: SchedulerState
    early: SchedulerState
  }
  firstHalf: {
    firstHalfState: FirstHalfState
    setFirstHalfState: (value: Partial<FirstHalfState>) => void
  }
  secondHalf: {
    secondHalfState: SecondHalfState
    setSecondHalfState: (value: Partial<SecondHalfState>) => void
  }
  bettingMode: {
    bettingModeState: BettingModeState
    setBettingModeState: (value: Partial<BettingModeState>) => void
  }
  oddsSetting: {
    checkboxStates: {
      oddsLessThan: number
      oddsMoreThan: number
      gameCommissionMoreThan: number
      gameCommissionLessThan: number
    }
    setCheckboxStates: (key: string) => void
    inputValuesOddsSetting: {
      oddsLessThanValue: string
      oddsMoreThanValue: string
      gameCommissionMoreThanValue: string
      gameCommissionLessThanValue: string
    }
    setInputValuesOddsSetting: (value) => void
  }
  betAmountRandom: {
    enableRandomizer: number
    setRandomizerEnabled: (value: SetStateAction<number>) => void
    fromRandomizer: string
    setFromValue: (value: string) => void
    toRandomizer: string
    setToValue: (value: string) => void
  }
  totalGoal: {
    settingTotalGoal: SettingTotalGoalType
    setSettingTotalGoal: (value: SetStateAction<SettingTotalGoalType>) => void
  }
  scoreList: {
    settingScoreList: SettingScoreListType
    setSettingScoreList: (value: SetStateAction<SettingScoreListType>) => void
  }
}

const createSchedulerState = (initialValue = 0, initialInput = '') => {
  const [value, setValue] = useState(initialValue)
  const [input, setInput] = useState(initialInput)
  return { value, setValue, input, setInput }
}

export const SettingContext = createContext<SchedulerContextType | undefined>(undefined)

export const SettingProvider = ({ children }) => {
  const [profitMin, setProfitMin] = useState<string>('-1')
  const [profitMax, setProfitMax] = useState<string>('1')
  const [gameType, setGameType] = useState<string>('None')
  const [betMode, setBetMode] = useState<string>('Auto')

  const [firstHalfState, setFirstHalfState] = useState<FirstHalfState>({
    enableFirstStHalf: 1,
    betFirstHalf: 1,
    betFullTime: 1,
    firstStHalfBettingForm: '0',
    firstStHalfBettingUntil: '45'
  })

  const [secondHalfState, setSecondHalfState] = useState<SecondHalfState>({
    enableSecondStHalf: 1,
    betHalfTime: 1,
    secondStHalfBettingForm: '46',
    secondStHalfBettingUntil: '90'
  })

  const [bettingModeState, setBettingModeState] = useState<BettingModeState>({
    bettingMode: 'Normal',
    amountRoundingEnabled: 0,
    roundType: 'Auto',
    roundingNumber: '2',
    testRounding: '4879'
  })

  const [checkboxStates, setCheckboxStates] = useState({
    oddsLessThan: 0,
    oddsMoreThan: 0,
    gameCommissionMoreThan: 0,
    gameCommissionLessThan: 0
  })

  const [inputValuesOddsSetting, setInputValuesOddsSetting] = useState({
    oddsLessThanValue: '0.10',
    oddsMoreThanValue: '0.80',
    gameCommissionMoreThanValue: '0.24',
    gameCommissionLessThanValue: '0.08'
  })

  const [enableRandomizer, setRandomizerEnabled] = useState<number>(0)
  const [fromRandomizer, setFromValue] = useState<string>('100')
  const [toRandomizer, setToValue] = useState<string>('100')

  const [settingTotalGoal, setSettingTotalGoal] = useState<SettingTotalGoalType>({
    enable: 0,
    from: 0,
    to: 0
  })
  const [settingScoreList, setSettingScoreList] = useState<SettingScoreListType>({
    enable: 0,
    list: [{ home: '', away: '' }]
  })

  const running = createSchedulerState()
  const today = createSchedulerState()
  const early = createSchedulerState()

  useEffect(() => {
    const fetchData = async () => {
      const setting = (await window.electron.ipcRenderer.invoke('GetDataSetting')) as SettingType

      setProfitMin(setting.profitMin)
      setProfitMax(setting.profitMax)
      setGameType(setting.gameType)
      setBetMode(setting.betMode)
      running.setValue(setting.schedulerRunning)
      running.setInput(setting.schedulerInputRunning)
      today.setValue(setting.schedulerToday)
      today.setInput(setting.schedulerInputToday)
      early.setValue(setting.schedulerEarly)
      early.setInput(setting.schedulerInputEarly)
      setFirstHalfState((prev) => ({
        ...prev,
        enableFirstStHalf: setting.enableFirstStHalf,
        betFirstHalf: setting.betFirstHalf,
        betFullTime: setting.betFullTime,
        firstStHalfBettingForm: setting.firstStHalfBettingForm,
        firstStHalfBettingUntil: setting.firstStHalfBettingUntil
      }))
      setSecondHalfState((prev) => ({
        ...prev,
        enableSecondStHalf: setting.enableSecondStHalf,
        betHalfTime: setting.betHalfTime,
        secondStHalfBettingForm: setting.secondStHalfBettingForm,
        secondStHalfBettingUntil: setting.secondStHalfBettingUntil
      }))
      setBettingModeState((prev) => ({
        ...prev,
        bettingMode: setting.bettingMode,
        amountRoundingEnabled: setting.amountRoundingEnabled,
        roundType: setting.roundType,
        roundingNumber: setting.roundingNumber
      }))
      setCheckboxStates({
        oddsLessThan: setting.oddsLessThan,
        oddsMoreThan: setting.oddsMoreThan,
        gameCommissionMoreThan: setting.gameCommissionMoreThan,
        gameCommissionLessThan: setting.gameCommissionLessThan
      })
      setInputValuesOddsSetting({
        oddsLessThanValue: setting.oddsLessThanValue,
        oddsMoreThanValue: setting.oddsMoreThanValue,
        gameCommissionMoreThanValue: setting.gameCommissionMoreThanValue,
        gameCommissionLessThanValue: setting.gameCommissionLessThanValue
      })
      setRandomizerEnabled(setting.enableRandomizer)
      setFromValue(setting.fromRandomizer)
      setToValue(setting.toRandomizer)

      setSettingTotalGoal(setting.settingTotalGoal)
      setSettingScoreList(setting.settingScoreList)
    }

    fetchData()

    return () => {
      window.electron.ipcRenderer.removeAllListeners('GetDataSetting')
    }
  }, [])

  const contextValue: SchedulerContextType = {
    oddsTypeSetting: { profitMin, setProfitMin, profitMax, setProfitMax },
    gameType: { gameType, setGameType },
    betMode: { betMode, setBetMode },
    gameTypeScheduler: {
      running,
      today,
      early
    },
    firstHalf: {
      firstHalfState,
      setFirstHalfState: (value) => setFirstHalfState((prev) => ({ ...prev, ...value }))
    },
    secondHalf: {
      secondHalfState,
      setSecondHalfState: (value) => setSecondHalfState((prev) => ({ ...prev, ...value }))
    },
    bettingMode: {
      bettingModeState,
      setBettingModeState: (value) => setBettingModeState((prev) => ({ ...prev, ...value }))
    },
    oddsSetting: {
      checkboxStates,
      setCheckboxStates: (key) =>
        setCheckboxStates((prev) => ({ ...prev, [key]: Number(!prev[key]) })),
      inputValuesOddsSetting,
      setInputValuesOddsSetting: (value) =>
        setInputValuesOddsSetting((prev) => ({ ...prev, ...value }))
    },
    betAmountRandom: {
      enableRandomizer,
      setRandomizerEnabled,
      fromRandomizer,
      setFromValue,
      toRandomizer,
      setToValue
    },
    totalGoal: { settingTotalGoal, setSettingTotalGoal },
    scoreList: { settingScoreList, setSettingScoreList }
  }

  return <SettingContext.Provider value={contextValue}>{children}</SettingContext.Provider>
}
