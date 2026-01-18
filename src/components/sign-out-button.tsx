'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleSignOut}
      className="text-white hover:bg-white/20 h-8 w-8"
      title="Cerrar sesión"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  )
}
