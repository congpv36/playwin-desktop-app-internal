import { TicketInfoDataBetType } from '@shared/common/types'

export const generateHTML = (data: TicketInfoDataBetType[]) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Table Data</title>
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
        }
      </style>
</head>
<body>
  <table>
    <thead>
      <tr>
        <th>Company</th>
        <th>Coverage</th>
        <th>Game Type</th>
        <th>Score</th>
        <th>League</th>
        <th>Home</th>
        <th>Away</th>
        <th>Bet</th>
        <th>HDP</th>
        <th>Odds</th>
        <th>Amount</th>
        <th>Time</th>
        <th>Info</th>
        <th>Profit</th>
        <th>Speed</th>
        <th>Receipt ID</th>
        <th>Receipt Status</th>
        <th>Odds Info</th>
      </tr>
    </thead>
    <tbody>
      ${data
        .map(
          (row: TicketInfoDataBetType) => `
        <tr>
          <td>${row.company}</td>
          <td>${row.coverage}</td>
          <td>${row.gameType}</td>
          <td>-</td>
          <td>${row.nameLeague}</td>
          <td>${row.nameHome}</td>
          <td>${row.nameAway}</td>
          <td>${row.bet}</td>
          <td>${row.HDP}</td>
          <td>${row.odd}</td>
          <td>${row.betAmount_Standard}</td>
          <td>${row.time.split(' ')[1] + ' ' + row.time.split(' ')[2]}</td>
          <td>${row.info}</td>
          <td>${row.profit}</td>
          <td></td>
          <td>${row.receiptID}</td>
          <td>${row.receiptStatus}</td>
          <td></td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>
`
