import QRCode from 'qrcode'

export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
    return qrDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

export function parseQRData(data: string): { visitorId: string; pin: string } | null {
  try {
    const parsed = JSON.parse(data)
    if (parsed.visitorId && parsed.pin) {
      return { visitorId: parsed.visitorId, pin: parsed.pin }
    }
    return null
  } catch {
    return null
  }
}
