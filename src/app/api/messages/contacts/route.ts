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
    const searchParam = searchParams.get('search')

    // Build where clause - always filter by user
    let whereClause: any = {
      userId: session.user.id
    }

    // Date filter - defaults to today if not provided
    const targetDate = dateParam ? parseISO(dateParam) : new Date()
    whereClause.createdAt = {
      gte: startOfDay(targetDate),
      lte: endOfDay(targetDate)
    }

    // Search filter (by name or phone number)
    if (searchParam) {
      whereClause.OR = [
        { senderName: { contains: searchParam, mode: 'insensitive' } },
        { senderNumber: { contains: searchParam, mode: 'insensitive' } }
      ]
    }

    // Group contacts by senderNumber only to avoid duplicates
    const contacts = await prisma.message.groupBy({
      by: ['senderNumber'],
      where: {
        ...whereClause,
        // Exclude WhatsApp groups (format: groupId@g.us)
        senderNumber: {
          not: {
            contains: '@g.us'
          }
        }
      },
      _count: {
        id: true
      },
      _max: {
        createdAt: true,
        senderName: true // Get the latest/lexicographically last name available
      },
      orderBy: {
        _max: {
          createdAt: 'desc'
        }
      }
    })

    // Fetch contact statuses
    const contactStatuses = await prisma.contact.findMany({
      where: {
        userId: session.user.id,
        phone: {
          in: contacts.map(c => c.senderNumber)
        }
      },
      select: {
        phone: true,
        status: true
      }
    })

    const statusMap = new Map(contactStatuses.map(c => [c.phone, c.status]))

    // Transform to response format
    const formattedContacts = contacts.map((contact) => ({
      senderNumber: contact.senderNumber,
      senderName: contact._max.senderName, // Use the aggregated name
      messageCount: contact._count.id,
      lastMessageAt: contact._max.createdAt,
      status: statusMap.get(contact.senderNumber) || 'OPEN'
    }))

    return NextResponse.json({
      contacts: formattedContacts,
      date: targetDate.toISOString(),
      total: formattedContacts.length
    })

  } catch (error) {
    console.error('[API Contacts] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}
