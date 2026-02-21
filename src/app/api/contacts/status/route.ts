import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { phone, status } = body

    if (!phone || !status) {
      return NextResponse.json(
        { error: 'Phone and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    if (!['OPEN', 'SOLD', 'DISMISSED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Upsert contact
    const contact = await prisma.contact.upsert({
      where: {
        userId_phone: {
          userId: session.user.id,
          phone: phone
        }
      },
      update: {
        status: status
      },
      create: {
        userId: session.user.id,
        phone: phone,
        status: status
      }
    })

    return NextResponse.json({ contact })

  } catch (error) {
    console.error('[API Contact Status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update contact status' },
      { status: 500 }
    )
  }
}
