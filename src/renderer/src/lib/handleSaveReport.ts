import { TFunction } from 'i18next'

import { defaultColumns } from '@renderer/components/BetListContraListSuccessList/defaultColumns'

export const handleSaveReport = (nameLink: string, dataTable) => {
  if (!dataTable || !Array.isArray(dataTable) || dataTable.length === 0) {
    alert('No data to generate table!')
    return
  }

  const t = ((key: string) => key) as unknown as TFunction
  const headers = defaultColumns(t)
    .map((col) => col.accessorKey)
    .filter(Boolean)

  const tableHTML = `
    <table>
      <thead>
        <tr>
          ${headers.map((header) => `<th>${header}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${dataTable
          .map((row) => {
            return `<tr>
              ${headers
                .map((key) => {
                  const value = row[key]

                  if (typeof value === 'undefined') return '<td></td>'
                  if (key === 'odd' && value === 0) return '<td></td>'
                  if (key === 'profit' && value === 0) return '<td></td>'

                  return `<td>${value}</td>`
                })
                .join('')}
            </tr>`
          })
          .join('')}
      </tbody>
    </table>
  `

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Report</title>
      <style>
        table {
          width: 100%;
          border-collapse: collapse;
        }
        table, th, td {
          border: 1px solid black;
        }
        th, td {
          padding: 8px;
          text-align: left;
          white-space: nowrap;
        }
      </style>
    </head>
    <body>
      ${tableHTML}
    </body>
    </html>
  `

  const blob = new Blob([htmlContent], { type: 'text/html' })

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${nameLink}${Date.now()}.html`
  link.click()

  URL.revokeObjectURL(link.href)
}
