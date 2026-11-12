export function logTime() {
  const now = new Date()

  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()

  const time = now.toLocaleTimeString('en-US', { hour12: true })

  return `${day}/${month}/${year} ${time}: `
}
