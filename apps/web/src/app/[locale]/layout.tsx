import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import '../globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { NextAuthProvider } from '@/components/providers/session-provider'
import { locales } from '@/i18n'
import { Toaster } from 'sonner'
// Debug info component removed for cleaner UI
// import { DebugInfo } from '@/components/debug-info'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Spektif Agency - Digital Strategies',
  description: 'Trello-style workspace with calendar and chat for social agencies',
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextAuthProvider>
            <NextIntlClientProvider messages={messages}>
              <div className="min-h-screen bg-background text-foreground">
                {children}
                <Toaster richColors />
              </div>
            </NextIntlClientProvider>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
