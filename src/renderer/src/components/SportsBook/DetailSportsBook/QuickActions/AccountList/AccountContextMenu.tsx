import { useTranslation } from 'react-i18next'

interface AccountContextMenuProps {
  x: number
  y: number
  visible: boolean
  onCut: (e: KeyboardEvent) => void
  onCopy: (e: ClipboardEvent) => void
  onPaste: (e: ClipboardEvent) => void
}

const AccountContextMenu = ({ x, y, visible, onCut, onCopy, onPaste }: AccountContextMenuProps) => {
  const { t } = useTranslation(['layout'])

  if (!visible) return null

  return (
    <div
      className="absolute z-[1000] w-32 bg-white text-sm"
      style={{
        top: y,
        left: x,
        transform: 'translate(-40px, -90px)'
      }}
    >
      <div
        className="pl-8 cursor-pointer border border-b-0 border-border-default hover:bg-gray-300"
        onClick={() => onCut(new KeyboardEvent('keydown', { key: 'x', ctrlKey: true }))}
      >
        {t('cut')}
      </div>
      <div
        className="pl-8 cursor-pointer border border-border-default border-b-0 hover:bg-gray-300 "
        onClick={(e) => {
          e.preventDefault()
          const clipboardEvent = new ClipboardEvent('copy', {
            clipboardData: new DataTransfer()
          })
          onCopy(clipboardEvent)
        }}
      >
        {t('copy')}
      </div>
      <div
        className="pl-8 cursor-pointer border border-border-default hover:bg-gray-300 "
        onClick={async (e) => {
          e.preventDefault()
          const clipboardText = await navigator.clipboard.readText()

          const clipboardEvent = new ClipboardEvent('paste', {
            clipboardData: new DataTransfer()
          })
          clipboardEvent.clipboardData?.setData('text/plain', clipboardText)
          onPaste(clipboardEvent)
        }}
      >
        {t('paste')}
      </div>
    </div>
  )
}

export default AccountContextMenu
