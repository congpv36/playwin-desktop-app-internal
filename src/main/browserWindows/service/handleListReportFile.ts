import fs from 'fs'
import path from 'path'

import { TicketInfoDataBetType } from '@shared/common/types'

import { generateHTML } from '@/browserWindows/service/generateHTML'

export const handleListReportFile = (
  dataGenerateHTML: TicketInfoDataBetType[],
  type: string,
  date: string
) => {
  const htmlContent = generateHTML(dataGenerateHTML)
  const directoryPath = `BetLog/ListReport`
  const filePath = path.join(directoryPath, `${date}-${type}.html`)
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true })
  }
  fs.writeFile(filePath, htmlContent, (err) => {
    if (err) {
      console.error('Error handleListReportFile:', err)
    }
  })
}
