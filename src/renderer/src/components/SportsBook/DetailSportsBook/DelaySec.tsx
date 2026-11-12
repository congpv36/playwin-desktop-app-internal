import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

export default function DeylaySec({ sportsBook }) {
  const { id: activeId } = useParams()
  const { t } = useTranslation(['main', 'layout'])

  const [inputs, setInputs] = useState({
    delayNormal: sportsBook.delayNormal,
    delaySameGame: sportsBook.delaySameGame
  })

  const handleInputChange = (key: keyof typeof inputs, value: string) => {
    let cleanValue = value.replace(/\D/g, '')

    if (/^0+$/.test(cleanValue)) {
      cleanValue = '0'
    } else {
      cleanValue = cleanValue.replace(/^0+/, '')
    }

    setInputs((prev) => ({
      ...prev,
      [key]: cleanValue
    }))

    window.electron.ipcRenderer.send('UpdateDelaySec_Platform', {
      activeId,
      platform: sportsBook.platform,
      dataUpdate: { [key]: cleanValue }
    })
  }
  return (
    <div className=" flex justify-between">
      <div className="flex text-xs gap-[10px] items-center font-normal ">
        <div className="font-medium "> {t('delay')}: </div>
        <div className="flex items-center ">
          <p>{t('normal')}:</p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            value={inputs.delayNormal}
            onChange={(e) => handleInputChange('delayNormal', e.target.value)}
            className="pl-1  ml-[8px] border border-border-default w-[30px] h-[30px] rounded-[8px] outline-none bg-white focus:border-brand-color"
          />
        </div>
        <div className="flex items-center">
          <p className="">{t('same_game')}:</p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            value={inputs.delaySameGame}
            onChange={(e) => handleInputChange('delaySameGame', e.target.value)}
            className="pl-1  ml-[8px] border border-border-default w-[30px] h-[30px] rounded-[8px] outline-none bg-white focus:border-brand-color"
          />
        </div>
      </div>
    </div>
  )
}
