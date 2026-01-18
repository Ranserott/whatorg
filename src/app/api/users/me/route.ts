import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users/me - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        instanceName: true,
        instanceStatus: true,
        instanceQr: true,
        pairingCode: true,
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('[API Me GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/me - Update current user profile (name only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data: any = {}

    // Users can only update their name
    if (body.name !== undefined) data.name = body.name

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        instanceName: true,
        instanceStatus: true,
        instanceQr: true,
        pairingCode: true,
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    return NextResponse.json({ user })

  } catch (error) {
    console.error('[API Me PATCH] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    )
  }
}
