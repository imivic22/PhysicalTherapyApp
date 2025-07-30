import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { Navbar } from './components/Navbar'

export const metadata: Metadata = {
  title: 'Medical App - Healthcare Dashboard',
  description: 'A comprehensive healthcare management system for providers and patients',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 