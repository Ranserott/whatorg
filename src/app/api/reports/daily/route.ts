import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, parseISO } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')
    
    // Default to today
    const targetDate = dateParam ? parseISO(dateParam) : new Date()
    const startDate = startOfDay(targetDate)
    const endDate = endOfDay(targetDate)

    const userId = session.user.id

    // 1. Total messages in the day (incoming)
    const incomingMessagesCount = await prisma.message.count({
      where: {
        userId,
        direction: 'INCOMING',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // 2. Messages answered/outgoing in the day
    const outgoingMessagesCount = await prisma.message.count({
      where: {
        userId,
        direction: 'OUTGOING',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // 3. Contacts by status (updated/created today with that status)
    // Note: This is tricky because status is current state, not historical.
    // However, for a daily report of "sales made today", we can look at contacts 
    // whose `updatedAt` is today and have status SOLD.
    // This assumes that if it was updated today to SOLD, it counts as a sale today.
    
    const soldCount = await prisma.contact.count({
      where: {
        userId,
        status: 'SOLD',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const dismissedCount = await prisma.contact.count({
      where: {
        userId,
        status: 'DISMISSED',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    return NextResponse.json({
      date: targetDate.toISOString(),
      stats: {
        incomingMessages: incomingMessagesCount,
        outgoingMessages: outgoingMessagesCount,
        sold: soldCount,
        dismissed: dismissedCount
      }
    })

  } catch (error) {
    console.error('[API Daily Report] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily report' },
      { status: 500 }
    )
  }
}
