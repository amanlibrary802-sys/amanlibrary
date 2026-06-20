import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

function formatWhatsAppNumber(number: string) {
  if (number.startsWith('whatsapp:')) return number
  return `whatsapp:${number.startsWith('+') ? number : `+${number}`}`
}

export async function sendWhatsAppReminder(
  whatsappNumber: string,
  studentName: string,
  bookTitle: string
) {
  try {
    const from = formatWhatsAppNumber(process.env.TWILIO_WHATSAPP_FROM || '')
    const to = formatWhatsAppNumber(whatsappNumber)

    await client.messages.create({
      from,
      to,
      body: `Assalamu Alaikum ${studentName}, it has been 2 weeks since you issued "${bookTitle}" from Aman Library. You have 1 week remaining to return the book. Please ensure it is returned within 7 days. Jazakallah! 📚`
    })
    return true
  } catch (error) {
    console.error('Twilio Error (Reminder):', error)
    return false
  }
}

export async function sendOrderConfirmation(
  whatsappNumber: string,
  studentName: string,
  bookTitle: string,
  deadline: string
) {
  try {
    const from = formatWhatsAppNumber(process.env.TWILIO_WHATSAPP_FROM || '')
    const to = formatWhatsAppNumber(whatsappNumber)

    const result = await client.messages.create({
      from,
      to,
      body: `Assalamu Alaikum ${studentName}, your order for "${bookTitle}" has been APPROVED. ✅\n\nYou can now collect it from the library.\n\n📅 Return Deadline: ${deadline}\n\nJazakallah for using Aman Library!`
    })
    console.log('WhatsApp Sent:', result.sid)
    return true
  } catch (error) {
    console.error('Twilio Error (Confirmation):', error)
    return false
  }
}
