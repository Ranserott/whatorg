import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  const hash = process.env.ADMIN_PASSWORD_HASH || ''
  const password = 'admin123'
  
  // Test the comparison
  const result = await bcrypt.compare(password, hash)
  
  return NextResponse.json({
    hash: hash.substring(0, 20) + '...',
    password: password.substring(0, 3) + '***',
    match: result,
    hashLength: hash.length
  })
}
