import { useState } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { useTranslation } from 'react-i18next'

import AddSportsBookModal from '@renderer/components/Modal/AddSportsBook'
import Plus from '@renderer/icons/plus'

export default function AddSportsBook() {
  const { t } = useTranslation('main')
  const [openAddSportsBook, setOpenAddSportsBook] = useState(false)

  return (
    <Fragment>
      <button
        className="bg-brand-color hover:opacity-90 text-sm w-[161px] h-[36px] rounded-[8px] text-white gap-[4px] flex items-center justify-center"
        onClick={() => setOpenAddSportsBook(true)}
      >
        <Plus />
        <span className="ml-[4px]">{t('add_sports_book')}</span>
      </button>
      <AddSportsBookModal
        openAddSportsBook={openAddSportsBook}
        setOpenAddSportsBook={setOpenAddSportsBook}
      />
    </Fragment>
  )
}
