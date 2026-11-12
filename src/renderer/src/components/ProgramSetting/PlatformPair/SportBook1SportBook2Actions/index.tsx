import { memo, useCallback, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

import { Confirmation } from '@renderer/components/NotificationPopup/Confirmation'
import { NotificationError } from '@renderer/components/NotificationPopup/NotificationError'
import Actions from '@renderer/components/ProgramSetting/PlatformPair/SportBook1SportBook2Actions/Actions'
import PlatformNumber from '@renderer/components/ProgramSetting/PlatformPair/SportBook1SportBook2Actions/PlatformNumber'
import { Button } from '@renderer/components/ui/button'
import { PlatformPairContext } from '@renderer/context/PlatformPairContext'
import { generateAddAllPlatformPair } from '@renderer/lib/generateAddAllPlatformPair'
import { generatePlatformData } from '@renderer/lib/generatePlatformData'
import { sanitizeAccountsData } from '@renderer/lib/sanitizeAccountsData'
import ExclamationTriangle from '@renderer/icons/exclamation-triangle'

import { PlatformType } from '@shared/common/types'
import { PlatformPairType } from '@shared/common/types'

import { SettingCombination } from '../BetSetting'
import { Combination } from '../Combination'

const SportBook1SportBook2ActionsComponent = () => {
  const { t } = useTranslation(['main', 'layout'])
  const context = useContext(PlatformPairContext)

  const { listPlatformPair, setListPlatformPair, currentPlatformPair, setCurrentPlatformPair } =
    context.Combination
  const { listPlatform } = context.ListPlatform

  const [sportBook1, setSportBook1] = useState<PlatformType>()
  const [sportBook2, setSportBook2] = useState<PlatformType>()

  const [title, setTitle] = useState(t('error', { ns: 'layout' }))
  const [messageError, setMessageError] = useState('')
  const [showAlertError, setShowAlertError] = useState(false)
  const [showAlertMsg, setShowAlertMsg] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null)
  const [actionYes, setActionYes] = useState<() => void>(() => {})

  const addPlatformPair = async () => {
    if (!sportBook1 || !sportBook2) {
      setMessageError(t('no_item_selected'))
      setShowAlertError(true)
      return
    }

    const [firstSportBook, secondSportBook] = [sportBook1, sportBook2].sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    const id1 = firstSportBook.id
    const id2 = secondSportBook.id

    const isPairExist = listPlatformPair.some(
      ({ sportBook1, sportBook2 }) =>
        (sportBook1.id === id1 && sportBook2.id === id2) ||
        (sportBook1.id === id2 && sportBook2.id === id1)
    )

    if (isPairExist) {
      setMessageError(t('sportsbook_pair_already_exists'))
      setShowAlertError(true)
      return
    }

    const platformPair = {
      id: uuidv4() as string,
      isValid: 0,
      key: '',
      sportBook1: generatePlatformData(firstSportBook),
      sportBook2: generatePlatformData(secondSportBook)
    }

    platformPair.isValid = platformPair.sportBook1.name === platformPair.sportBook2.name ? 0 : 1
    platformPair.key = `${platformPair.sportBook1.name}_${platformPair.sportBook2.name}`

    setListPlatformPair([...listPlatformPair, platformPair])
    setCurrentPlatformPair(platformPair)
  }

  const removePlatformPair = () => {
    if (!listPlatformPair.length) {
      setMessageError(t('no_item_selected'))
      setShowAlertError(true)
      return
    }
    showConfirmation(t('confirmation', { ns: 'layout' }), t('delete_selected_combinations'), () => {
      setShowAlertMsg(false)
      const updatedList = listPlatformPair.filter(
        (platformPair) => platformPair.id !== currentPlatformPair.id
      )
      setListPlatformPair(updatedList)
      if (updatedList.length > 0) {
        setCurrentPlatformPair(updatedList[0])
      } else {
        setCurrentPlatformPair({} as PlatformPairType)
      }
    })
  }

  const addAllPlatformPair = () => {
    if (!listPlatform.length) {
      setMessageError(t('no_item_selected'))
      setShowAlertError(true)
      return
    }
    showConfirmation(t('confirmation', { ns: 'layout' }), t('add_all_combinations_confirm'), () => {
      const listPlatformPair = generateAddAllPlatformPair(listPlatform)
      setListPlatformPair(listPlatformPair)
      setCurrentPlatformPair(listPlatformPair[0])
      setShowAlertMsg(false)
    })
  }

  const removeAllPlatformPair = () => {
    if (!listPlatformPair.length) {
      setMessageError(t('no_item_selected'))
      setShowAlertError(true)
      return
    }
    showConfirmation(
      t('confirmation', { ns: 'layout' }),
      t('delete_all_combinations_confirm'),
      () => {
        setListPlatformPair([])
        setCurrentPlatformPair({} as PlatformPairType)
        setShowAlertMsg(false)
      }
    )
  }

  const showConfirmation = useCallback(
    (title: string, message: string, actionYesCallback: () => void) => {
      setTitle(title)
      setMessageError(message)
      setShowAlertMsg(true)
      setActionYes(() => actionYesCallback)
    },
    []
  )
  const save = () => {
    const dataPlatformPair = sanitizeAccountsData(listPlatformPair)
    window.electron.ipcRenderer.send('PlatformPairWindow', {
      dataPlatformPair
    })
    setShowSaveSuccess(true)
    setMessageSuccess(t('save_successful', { ns: 'layout' }))
    setTimeout(() => {
      setShowSaveSuccess(false)
      window.electron.ipcRenderer.send('CloseAccountPairWindow')
    }, 1500)
  }
  return (
    <div className="mt-3 flex flex-col overflow-hidden max-h-[calc(100vh-206px)]">
      <div className="flex-1 overflow-auto min-h-0">
        <div className=" min-w-[1190px]">
          <div className="mb-4">
            <Actions
              addPlatformPair={addPlatformPair}
              removePlatformPair={removePlatformPair}
              addAllPlatformPair={addAllPlatformPair}
              removeAllPlatformPair={removeAllPlatformPair}
            />
          </div>

          <div className="flex gap-4 mb-4">
            <div className="w-9/12">
              <div className="w-full flex">
                <PlatformNumber
                  title="SportBook 1"
                  listPlatform={listPlatform}
                  setPlatform={setSportBook1}
                  platformCurrent={sportBook1}
                />
                <PlatformNumber
                  title="SportBook 2"
                  listPlatform={listPlatform}
                  setPlatform={setSportBook2}
                  platformCurrent={sportBook2}
                />
              </div>
              {listPlatformPair.length > 0 ? (
                <SettingCombination />
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  {t('no_combinations_available')}
                </div>
              )}
            </div>

            <div className="w-3/12">
              <Combination />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-shrink-0 w-full justify-end border-t border-border-default pt-3 pr-5">
        <Button className="whitespace-nowrap flex-shrink-0 w-32" onClick={save}>
          {t('save', { ns: 'layout' })}
        </Button>
      </div>

      <NotificationError
        showAlertDialog={showAlertError}
        setShowAlertDialog={setShowAlertError}
        title={title}
        messageError={messageError}
        ReactElement={<ExclamationTriangle className="size-11 mr-1" />}
      />
      <Confirmation
        title={title}
        messageError={messageError}
        showAlertDialog={showAlertMsg}
        setShowAlertDialog={setShowAlertMsg}
        actionYes={actionYes}
        ReactElement={<ExclamationTriangle className="size-11 mr-1" />}
      />

      {showSaveSuccess && (
        <div className="fixed top-[5%] right-[2%] bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center z-50 animate-pulse">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span>{messageSuccess}</span>
        </div>
      )}
    </div>
  )
}

export const SportBook1SportBook2Actions = memo(SportBook1SportBook2ActionsComponent)
