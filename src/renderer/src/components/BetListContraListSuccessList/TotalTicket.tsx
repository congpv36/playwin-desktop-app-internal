import React from 'react'

const TotalTicket = ({ totalTickets }) => {
  return <div>({totalTickets})</div>
}

export default React.memo(TotalTicket)
