import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')
    const contactParam = searchParams.get('contact')
    const searchParam = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause - always filter by user
    let whereClause: any = {
      userId: session.user.id
    }

    // Date filter
    if (dateParam) {
      const targetDate = new Date(dateParam)
      whereClause.createdAt = {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate)
      }
    }

    // Contact filter
    if (contactParam) {
      whereClause.senderNumber = contactParam
    }

    // Search filter (content)
    if (searchParam) {
      whereClause.content = {
        contains: searchParam,
        mode: 'insensitive'
      }
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'asc'
      },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const total = await prisma.message.count({
      where: whereClause
    })

    return NextResponse.json({
      messages,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('[API Messages] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
