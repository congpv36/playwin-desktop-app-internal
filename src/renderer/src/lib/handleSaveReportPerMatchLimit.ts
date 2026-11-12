export const handleSaveReportPerMatchLimit = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    alert('No data to generate table!')
    return
  }

  const headers = Object.keys(data[0]).filter((key) => key !== 'id')

  const tableHTML = `
    <table>
      <thead>
        <tr>
          ${headers.map((header) => `<th>${header}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data
          .map(
            (row) => `
          <tr>
            ${headers.map((key) => `<td>${row[key]}</td>`).join('')}
          </tr>
        `
          )
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
          white-space: pre-wrap;
          word-wrap: break-word;
          max-width: 500px;
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
  link.download = `BetListReport${Date.now()}.html`
  link.click()

  URL.revokeObjectURL(link.href)
}
