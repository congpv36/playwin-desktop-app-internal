export const formatTime = () => {
  const date = new Date()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }

  const time = new Intl.DateTimeFormat('en-US', options).format(date)

  return `${year}/${month}/${day} ${time}`
}
