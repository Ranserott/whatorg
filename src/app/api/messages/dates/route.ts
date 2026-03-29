import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all messages for this user to group by date
    const messages = await prisma.message.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Group by date (in Chile timezone) and count messages
    const dateMap = new Map<string, number>()

    for (const message of messages) {
      // Convert UTC to Chile timezone for grouping
      const chileDate = toZonedTime(new Date(message.createdAt), 'America/Santiago')
      const dateKey = format(chileDate, 'yyyy-MM-dd')
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1)
    }

    // Convert to array and sort by date descending
    const dates = Array.from(dateMap.entries())
      .map(([date, messageCount]) => ({
        date,
        messageCount
      }))
      .sort((a, b) => b.date.localeCompare(a.date))

    return NextResponse.json({
      dates,
      total: dates.length
    })

  } catch (error) {
    console.error('[API Dates] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dates' },
      { status: 500 }
    )
  }
}
