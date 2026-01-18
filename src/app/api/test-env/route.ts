import { NextResponse } from 'next/server'

export async function GET() {
  const env = {
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    secretPrefix: process.env.NEXTAUTH_SECRET?.substring(0, 10) + '...',
    hasPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
    hashPrefix: process.env.ADMIN_PASSWORD_HASH?.substring(0, 10) + '...',
  }
  
  return NextResponse.json(env)
}
