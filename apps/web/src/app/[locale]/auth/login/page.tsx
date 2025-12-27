'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeSwitcher } from '@/components/theme-switcher'
import { LanguageSwitcher } from '@/components/language-switcher'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const t = useTranslations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(t('auth.invalidCredentials'))
      } else {
        // Get session to check user role
        const session = await getSession()
        const userRole = (session?.user as any)?.role
        
        // Redirect based on role
        if (userRole === 'employee') {
          router.push('/tr/employee/dashboard')
        } else if (userRole === 'client') {
          router.push('/tr/client/dashboard')
        } else {
          router.push('/tr/dashboard')
        }
      }
    } catch (error) {
      setError('Bir hata olustu. Lutfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/tr/dashboard' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-xl">S</span>
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-brand-primary">spektif</div>
              <div className="text-sm text-muted-foreground">Digital Strategies</div>
            </div>
          </Link>
        </div>

        {/* Language and Theme Switchers */}
        <div className="flex justify-center space-x-2 mb-6">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>

        <Card className="border-brand-primary/20 card-shadow">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {t('auth.welcome')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('auth.loginDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@spektif.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-destructive text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-brand-primary text-black hover:bg-brand-accent"
                disabled={isLoading}
              >
                {isLoading ? t('common.loading') : t('auth.login')}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  veya
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t('auth.loginWithGoogle')}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {t('auth.dontHaveAccount')}{' '}
              </span>
              <Link
                href="/auth/register"
                className="text-brand-primary hover:underline font-medium"
              >
                {t('auth.register')}
              </Link>
            </div>

            <div className="text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-muted-foreground hover:text-brand-primary transition-colors"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo credentials */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Test Hesaplari:</strong><br /><br />
            <span className="text-blue-500">Admin:</span> admin@spektif.com / admin123<br />
            <span className="text-green-500">Calisan:</span> john.doe@spektif.com / employee123<br />
            <span className="text-purple-500">Musteri:</span> contact@acme.com / client123
          </p>
        </div>
      </div>
    </div>
  )
}
