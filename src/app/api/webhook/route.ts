import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractMessageData } from '@/lib/message-processor'
import type { EvolutionWebhook } from '@/types/evolution-api'

// Evolution API v2 does NOT send API key in webhook headers
// Webhook security relies on URL secrecy and instance name matching

// Global webhook verification using single API key for all instances
export async function POST(request: NextRequest) {
  console.log('[Webhook] ====================================')
  console.log('[Webhook] Received webhook request')

  try {
    // Parse webhook payload first to get instance name
    const payload: EvolutionWebhook = await request.json()
    const instanceName = payload.instance || 'default'
    console.log('[Webhook] Instance:', instanceName)

    // Find user by instance name (one instance per user)
    const user = await prisma.user.findUnique({
      where: { instanceName }
    })

    if (!user) {
      console.warn(`[Webhook] No user found for instance: ${instanceName}`)
      return NextResponse.json(
        { received: true, status: 'no_user', instance: instanceName },
        { status: 200 }
      )
    }

    // Check if this is a message event
    if (!payload.event || !payload.event.includes('message')) {
      console.log(`[Webhook] User ${user.id}: Ignoring non-message event: ${payload.event}`)
      return NextResponse.json({ received: true, status: 'ignored' })
    }

    // Extract message data
    const messageData = extractMessageData(payload)

    if (!messageData) {
      console.log(`[Webhook] User ${user.id}: Could not extract message data`)
      return NextResponse.json({ received: true, status: 'no_data' })
    }

    // Debug: log the timestamp info
    console.log(`[Webhook] User ${user.id}: messageTimestamp from webhook: ${payload.data.messageTimestamp}`)
    console.log(`[Webhook] User ${user.id}: createdAt to be saved: ${messageData.createdAt?.toISOString() || 'undefined (will use now())'}`)

    // Check for duplicate messages
    const existing = await prisma.message.findUnique({
      where: { whatsappId: messageData.whatsappId }
    })

    if (existing) {
      console.log(`[Webhook] User ${user.id}: Duplicate message ignored: ${messageData.whatsappId}`)
      return NextResponse.json({ received: true, status: 'duplicate' })
    }

    // Save message to database
    prisma.message
      .create({
        data: {
          ...messageData,
          userId: user.id
        }
      })
      .then((saved) => {
        console.log(
          `[Webhook] User ${user.id}: Message saved: ${saved.whatsappId} | ` +
          `Instance: ${instanceName} | ` +
          `From: ${messageData.senderNumber} | ` +
          `Type: ${messageData.type} | ` +
          `Direction: ${messageData.direction} | ` +
          `CreatedAt (DB): ${saved.createdAt.toISOString()} | ` +
          `CreatedAt (Chile): ${saved.createdAt.toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`
        )
      })
      .catch((error) => {
        console.error(`[Webhook] User ${user.id}: Error saving message:`, error)
      })

    return NextResponse.json({
      received: true,
      status: 'processing',
      whatsappId: messageData.whatsappId,
      userId: user.id
    })

  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Support GET for health checks
export async function GET() {
  return NextResponse.json({
    status: 'online',
    timestamp: new Date().toISOString()
  })
}
