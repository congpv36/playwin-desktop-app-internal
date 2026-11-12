import clsx from 'clsx'
import { TFunction } from 'i18next'

import { cn } from '@renderer/lib/utils'

export const defaultColumns = (t: TFunction) => [
  {
    size: 160,
    accessorKey: 'company',
    header: () => <span>{t('company')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    cell: ({ getValue }) => {
      const text = getValue()
      return (
        <span className={`px-2 text-xs`} style={{ whiteSpace: 'nowrap' }}>
          {text}
        </span>
      )
    }
  },
  {
    accessorKey: 'coverage',
    header: () => <span>{t('coverage')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 80,
    cell: ({ getValue }) => {
      const text = getValue()
      return (
        <span className={`px-2 text-xs`} style={{ whiteSpace: 'nowrap' }}>
          {text}
        </span>
      )
    }
  },
  {
    accessorKey: 'gameType',
    header: () => <span>{t('game_type_col')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 80,
    cell: ({ getValue }) => {
      const text = getValue()
      return (
        <span className={`px-2 text-xs `} style={{ whiteSpace: 'nowrap' }}>
          {text}
        </span>
      )
    }
  },
  {
    accessorKey: 'type',
    header: () => <span>{t('type_col')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 50,
    cell: ({ getValue }) => {
      const text = getValue()
      return (
        <span className={`px-2 text-xs `} style={{ whiteSpace: 'nowrap' }}>
          {text}
        </span>
      )
    }
  },
  {
    accessorKey: 'stat',
    header: () => <span>{t('stat_col')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 60,
    cell: ({ getValue }) => {
      const text = getValue()
      return (
        <span className={`px-2 text-xs `} style={{ whiteSpace: 'nowrap' }}>
          {text}
        </span>
      )
    }
  },
  {
    accessorKey: 'redCard',
    header: () => <span>{t('red_card')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 65,
    cell: ({ getValue }) => {
      const text = getValue()
      return (
        <span className={`px-2 text-xs `} style={{ whiteSpace: 'nowrap' }}>
          {text}
        </span>
      )
    }
  },
  {
    accessorKey: 'score',
    header: () => <span>{t('score_col')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 65,
    cell: ({ row }) => {
      const company = row.original.company
      const score = row.original.score
      return (
        <span className="px-2 text-xs">{company === '' ? '' : score == null ? '' : score}</span>
      )
    }
  },
  {
    accessorKey: 'nameLeague',
    header: () => <span>{t('league_col')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 170,
    cell: ({ getValue }) => {
      const text = getValue()
      return (
        <span className={`px-2 text-xs`} style={{ whiteSpace: 'nowrap' }}>
          {text}
        </span>
      )
    }
  },
  {
    accessorKey: 'nameHome',
    header: () => <span>{t('home_team')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 170,
    cell: ({ row }) => {
      const { hdp_point, nameHome } = row.original

      return (
        <span
          className={clsx('px-2 text-xs', {
            'text-red-color': Number(hdp_point) < 0,
            'text-blue-color': Number(hdp_point) >= 0
          })}
          style={{ whiteSpace: 'nowrap' }}
        >
          {nameHome}
        </span>
      )
    }
  },
  {
    accessorKey: 'nameAway',
    header: () => <span>{t('away_team')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 170,
    cell: ({ row }) => {
      const { hdp_point, nameAway } = row.original
      console.log('hdp_point', hdp_point)
      return (
        <span
          className={clsx('px-2 text-xs', {
            'text-blue-color': Number(hdp_point) <= 0,
            'text-red-color': Number(hdp_point) > 0
          })}
          style={{ whiteSpace: 'nowrap' }}
        >
          {nameAway}
        </span>
      )
    }
  },
  {
    accessorKey: 'bet',
    header: () => <span>{t('bet_col')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 170,
    cell: ({ getValue }) => {
      return (
        <span className="text-brand-color px-2 text-xs" style={{ whiteSpace: 'nowrap' }}>
          {getValue()}
        </span>
      )
    }
  },
  {
    accessorKey: 'HDP',
    header: () => <span>{t('hdp')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 60,
    cell: ({ getValue }) => {
      return (
        <span className={`px-2 text-xs`} style={{ whiteSpace: 'nowrap' }}>
          {getValue()}
        </span>
      )
    }
  },
  {
    accessorKey: 'odd',
    header: () => <span>{t('odds_col')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 70,
    cell: ({ row }) => {
      const company = row.original.company
      const odd = Number(row.original.odd).toFixed(3)
      return (
        <span
          className={cn(
            Number(odd) > 0 ? 'text-blue-color px-2 text-xs' : 'text-red-color px-2 text-xs'
          )}
        >
          {company === '' ? '' : odd}
        </span>
      )
    }
  },
  {
    accessorKey: 'betAmount_Standard',
    header: () => <span>{t('amount_col')}</span>,
    footer: ({ column }) => column.id,
    size: 60,
    cell: ({ row: { original } }) => {
      const { company, betAmount_Standard } = original
      return <span className="px-2 text-xs">{company ? betAmount_Standard || '0' : ''}</span>
    }
  },
  {
    accessorKey: 'time',
    header: () => <span>{t('time_col')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 130,
    cell: ({ row }) => {
      const company = row.original.company
      const fullDateTime = row.original.time
      const [datePart, hourPart, meridiem] = fullDateTime.split(' ')
      const [, month, day] = datePart.split('/')
      const shortDateTime = `${day}/${month} ${hourPart} ${meridiem}`

      return (
        <span className="px-2 text-xs" style={{ whiteSpace: 'nowrap' }}>
          {company === '' ? '' : shortDateTime}
        </span>
      )
    }
  },
  {
    accessorKey: 'info',
    header: () => <span>{t('info_col')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    cell: ({ getValue }) => {
      const text = getValue() as string
      const getTextClass = (text: string) => {
        switch (true) {
          case text === 'In-progress':
            return 'text-[#FF9900]'
          case text.includes('Bet Success'):
            return 'text-blue-color'
          case text === 'No Bet By User' || text === 'New Match' || text.includes('Out'):
            return 'text-text-default'
          case text === 'Ticket Received':
            return 'text-text-default'
          default:
            return 'text-red-color'
        }
      }
      const textClass = getTextClass(text)
      return (
        <span className={`px-2 text-xs ${textClass}`} style={{ whiteSpace: 'nowrap' }} title={text}>
          {text}
        </span>
      )
    }
  },
  {
    accessorKey: 'profit',
    header: () => <span>{t('profit_col')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 65,
    cell: ({ row }) => {
      const company = row.original.company
      const profit = row.original.profit
      const color = profit > 0 ? '#00FF7F' : '#FF0000'

      return (
        <span className={`px-2 text-xs`} style={{ color }}>
          {company === '' ? '' : profit}
        </span>
      )
    }
  },
  {
    accessorKey: 'receiptID',
    header: () => <span>{t('receipt_id')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 140,
    cell: ({ row }) => {
      const company = row.original.company
      const receiptID = row.original.receiptID || '-'
      return <span className="px-2 text-xs"> {company === '' ? '' : receiptID}</span>
    }
  },
  {
    accessorKey: 'receiptStatus',
    header: () => <span>{t('receipt_status')}</span>,
    footer: (props: { column: { id: string } }) => props.column.id,
    size: 100,
    cell: ({ row }) => {
      const receiptID = row.getValue('receiptID')
      return receiptID && receiptID !== '' ? (
        <span className="text-blue-color px-2 text-xs"> {t('confirm_col')}</span>
      ) : null
    }
  }
]
