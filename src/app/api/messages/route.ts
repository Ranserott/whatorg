import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, parseISO } from 'date-fns'
import { sendTextMessage } from '@/lib/evolution-api'

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
      const targetDate = parseISO(dateParam)
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { number, text } = body

    // Validate required fields
    if (!number || !text) {
      return NextResponse.json(
        { error: 'Number and text are required' },
        { status: 400 }
      )
    }

    // Get user's instance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { instanceName: true, instanceStatus: true }
    })

    if (!user?.instanceName) {
      return NextResponse.json(
        { error: 'No WhatsApp instance found. Please connect your WhatsApp first.' },
        { status: 400 }
      )
    }

    if (user.instanceStatus !== 'open') {
      return NextResponse.json(
        { error: 'WhatsApp instance is not connected. Please scan the QR code first.' },
        { status: 400 }
      )
    }

    // Send message through Evolution API
    const result = await sendTextMessage(user.instanceName, {
      number,
      text
    })

    // Save message to database
    // Parse the message timestamp from Evolution API response
    const timestamp = result.messageTimestamp
      ? new Date(parseInt(result.messageTimestamp) * 1000)
      : new Date()

    const message = await prisma.message.create({
      data: {
        whatsappId: result.key.id,
        content: text,
        senderName: null, // Sent by us
        senderNumber: number,
        instanceName: user.instanceName,
        type: 'TEXT',
        direction: 'OUTGOING',
        createdAt: timestamp,
        userId: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      message
    })

  } catch (error) {
    console.error('[API Messages Send] Error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
