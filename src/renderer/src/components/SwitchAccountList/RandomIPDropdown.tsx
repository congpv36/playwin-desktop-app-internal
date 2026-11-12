import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import { Button } from '@/components/ui/button'

const ipList = [
  'Malaysia',
  'Vietnam',
  'Thailand',
  'Indonesia',
  'Singapore',
  'Cambodia',
  'BlackBerry',
  'Brunei',
  'Philippines',
  'Laos',
  'Myanmar'
]

export default function RandomIPDropdown({ onSelect }: { onSelect: (ip: string) => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="outline"
          className="outline-none border bg-white text-black border-solid hover:bg-inherit border-gray-400 hover:border-blue-500 py-0 px-8 leading-none h-7 font-bold w-40"
        >
          Random Custom IP
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          className="bg-white shadow-md rounded-md p-2 w-40 border border-gray-300"
        >
          {ipList.map((ip) => (
            <DropdownMenu.Item
              key={ip}
              className="px-3 py-1 hover:bg-gray-200 cursor-pointer rounded"
              onSelect={() => onSelect(ip)}
            >
              {ip}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
