import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { TFunction } from 'i18next'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'

import { AccountType, PlatformType } from '@shared/common/types'

export function createColumnsAccountList({
  onMoveUp,
  onMoveDown,
  onFinal,
  platform,
  t
}: {
  onMoveUp: (rowIndex: number) => void
  onMoveDown: (rowIndex: number) => void
  onFinal: (rowIndex: number) => void
  platform?: PlatformType
  t: TFunction
}): ColumnDef<AccountType>[] {
  return [
    {
      id: 'no',
      header: () => <span className="text-xs">{t('no_col')}</span>,
      cell: ({ row }) => {
        return (
          <span className="outline-none rounded-none flex items-center justify-center leading-none text-xs">
            {row.index + 1}
          </span>
        )
      },
      size: 30
    },
    {
      id: 'loginID',
      accessorKey: 'loginID',
      header: () => <span className="text-xs">{t('login_id')}</span>,
      footer: (props) => props.column.id,
      size: 150
    },
    {
      id: 'password',
      accessorKey: 'password',
      header: () => <span className="text-xs">{t('password')}</span>,
      footer: (props) => props.column.id,
      size: 140
    },
    ...(platform?.name === 'Ps3838'
      ? [
          {
            id: 'secret',
            accessorKey: 'secret',
            header: () => <span className="text-xs">{t('secret_col')}</span>,
            footer: (props) => props.column.id,
            size: 150
          } as ColumnDef<AccountType>
        ]
      : []),
    {
      id: 'customIP',
      accessorKey: 'customIP',
      header: () => <span className="text-xs">{t('custom_ip')}</span>,
      footer: (props) => props.column.id,
      size: 135
    },
    {
      id: 'proxyIP',
      accessorKey: 'proxyIP',
      header: () => <span className="text-xs">{t('proxy_ip')}</span>,
      footer: (props) => props.column.id,
      size: 135
    },
    {
      id: 'proxyPort',
      accessorKey: 'proxyPort',
      header: () => <span className="text-xs">{t('proxy_port_col')}</span>,
      footer: (props) => props.column.id,
      size: 80
    },
    {
      id: 'proxyUsername',
      accessorKey: 'proxyUsername',
      header: () => <span className="text-xs">{t('proxy_username_col')}</span>,
      footer: (props) => props.column.id,
      size: 135
    },
    {
      id: 'proxyPassword',
      accessorKey: 'proxyPassword',
      header: () => <span className="text-xs">{t('proxy_password_col')}</span>,
      footer: (props) => props.column.id,
      size: 135
    },
    {
      id: 'proxyScope',
      accessorKey: 'proxyScope',
      header: () => <span className="text-xs">{t('proxy_scope_col')}</span>,
      footer: (props) => props.column.id,
      size: 105,
      cell: ({ getValue, row, column, table }) => {
        const [isSelectOpen, setIsSelectOpen] = useState(false)
        const handleChange = (value: string) => {
          table.options.meta?.updateData(row.index, column.id, value)
        }

        return (
          <div
            className={`flex py-0 w-full border border-none ${isSelectOpen ? ' border-border-default bg-blue-200 text-black' : 'border-layout-color'}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Select
              onValueChange={handleChange}
              onOpenChange={(open) => setIsSelectOpen(open)}
              defaultValue={'None'}
              value={getValue() as string}
            >
              <SelectTrigger className="w-[100px] border-none py-0 p-0 h-[20px] focus:border-none  focus:ring-transparent text-xs">
                <SelectValue placeholder={t('none_type')} className="p-0" />
              </SelectTrigger>
              <SelectContent className="w-[85px] ml-[-8px]  border rounded-none border-border-default bg-blue-200">
                <SelectItem
                  value="None"
                  className="focus:bg-blue-500 focus:text-white p-[1px] m-0 w-full h-[18px] text-xs"
                >
                  {t('none_type')}
                </SelectItem>
                <SelectItem
                  value="OnlyLogin"
                  className="focus:bg-blue-500 focus:text-white  p-[1px] m-0 w-full h-[18px] text-xs"
                >
                  {t('only_login')}
                </SelectItem>
                <SelectItem
                  value="Full"
                  className="focus:bg-blue-500 focus:text-white  p-[1px] m-0 w-full h-[18px] text-xs"
                >
                  {t('full_scope')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      }
    },
    {
      id: 'actions',
      header: () => <span className="text-xs">{t('actions')}</span>,
      size: 190,
      cell: ({ row }) => (
        <div className="flex gap-1">
          <button
            onClick={() => onMoveUp(row.index)}
            className="border border-gray-500 mr-1 px-1 rounded-[3px] h-[18px] hover:bg-blue-200 hover:text-black text-xs"
          >
            {t('up_action')}
          </button>
          <button
            onClick={() => onMoveDown(row.index)}
            className="border border-gray-500 px-1 rounded-[3px] h-[18px] hover:bg-blue-200 hover:text-black text-xs"
          >
            {t('down_action')}
          </button>

          <button
            onClick={() => onFinal(row.index)}
            className="border border-gray-500 px-1 rounded-[3px] h-[18px] hover:bg-blue-200 hover:text-black text-xs"
          >
            {t('final_action')}
          </button>
        </div>
      )
    }
  ]
}
