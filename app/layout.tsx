import type { Metadata, Viewport } from 'next'
import { Inter_Tight, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const sans = Inter_Tight({ subsets: ['latin', 'latin-ext'], variable: '--font-sans', display: 'swap', weight: ['200', '300', '400', '500'] })
const serif = Instrument_Serif({ subsets: ['latin', 'latin-ext'], variable: '--font-serif', display: 'swap', weight: '400', style: ['normal', 'italic'] })
const mono = JetBrains_Mono({ subsets: ['latin', 'latin-ext'], variable: '--font-mono', display: 'swap', weight: ['300', '400'] })

const title = 'COMPUTING — Bilgisayarın Evrimi'
const description =
  'Bilgisayarın mekanik hesap makinelerinden mikroişlemcilere, kişisel bilgisayarlardan ağlara ve yapay zekâ altyapılarına uzanan evrimini interaktif bir 3D deneyimle keşfet.'

export const metadata: Metadata = {
  title,
  description,
  applicationName: 'COMPUTING',
  keywords: ['bilgisayar tarihi', 'computer history', 'WebGL', 'Three.js', 'interactive 3D', 'Babbage', 'Intel 4004', 'Macintosh'],
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'tr_TR',
    siteName: 'COMPUTING',
  },
  twitter: { card: 'summary_large_image', title, description },
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
