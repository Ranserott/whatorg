import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  createInstance,
  fetchInstanceQr,
  getConnectionState,
  logoutInstance,
  deleteInstance,
  setWebhook
} from '@/lib/evolution-api'

/**
 * POST /api/instance - Create and setup a new instance for current user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { instanceName } = body

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Instance name is required' },
        { status: 400 }
      )
    }

    // Check if instance name is already taken
    const existing = await prisma.user.findUnique({
      where: { instanceName }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Instance name already taken' },
        { status: 400 }
      )
    }

    // Check if user already has an instance
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (currentUser?.instanceName) {
      return NextResponse.json(
        { error: 'You already have an instance. Disconnect it first.' },
        { status: 400 }
      )
    }

    // Create instance in Evolution API
    let instanceData
    try {
      instanceData = await createInstance(instanceName)
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to create instance: ${error.message}` },
        { status: 500 }
      )
    }

    // Set webhook for the instance
    const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhook`

    try {
      await setWebhook(instanceName, webhookUrl)
      console.log('[Instance] Webhook configured successfully')
    } catch (error: any) {
      console.error('[Instance] Failed to set webhook:', error)
      // Webhook failure is not blocking - instance will work without it
      // Messages just won't be received automatically
    }

    // Update user with instance info
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        instanceName,
        instanceStatus: instanceData.instance.status,
        instanceQr: instanceData.qrcode?.base64 || null,
        pairingCode: instanceData.qrcode?.pairingCode || instanceData.qrcode?.code || null
      },
      select: {
        id: true,
        username: true,
        name: true,
        instanceName: true,
        instanceStatus: true,
        instanceQr: true,
        pairingCode: true
      }
    })

    return NextResponse.json({
      user,
      qr: instanceData.qrcode,
      message: 'Instance created successfully'
    })

  } catch (error) {
    console.error('[API Instance POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create instance' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/instance - Get current user's instance status
 */
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
        instanceName: true,
        instanceStatus: true,
        instanceQr: true,
        pairingCode: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('[API Instance GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instance status' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/instance - Disconnect and delete current user's instance
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { instanceName: true }
    })

    if (!user?.instanceName) {
      return NextResponse.json(
        { error: 'No instance found' },
        { status: 404 }
      )
    }

    // Logout and delete instance in Evolution API
    try {
      await logoutInstance(user.instanceName)
    } catch (error) {
      console.error('[Instance] Failed to logout:', error)
    }

    try {
      await deleteInstance(user.instanceName)
    } catch (error) {
      console.error('[Instance] Failed to delete:', error)
    }

    // Clear instance info from user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        instanceName: null,
        instanceStatus: null,
        instanceQr: null,
        pairingCode: null
      }
    })

    return NextResponse.json({
      message: 'Instance disconnected successfully'
    })

  } catch (error) {
    console.error('[API Instance DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect instance' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/instance/status - Refresh instance status and QR
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { instanceName: true }
    })

    if (!user?.instanceName) {
      return NextResponse.json(
        { error: 'No instance found' },
        { status: 404 }
      )
    }

    // Get current connection state
    let state
    try {
      const stateData = await getConnectionState(user.instanceName)
      state = stateData.state
    } catch (error) {
      console.error('[Instance] Failed to get state:', error)
      state = 'unknown'
    }

    // If instance is closed, try to fetch QR again
    if (state === 'close' && user.instanceName) {
      try {
        const qrData = await fetchInstanceQr(user.instanceName)
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            instanceStatus: state,
            instanceQr: qrData.base64,
            pairingCode: qrData.code
          }
        })
      } catch (error) {
        console.error('[Instance] Failed to fetch QR:', error)
      }
    } else {
      // Just update status
      await prisma.user.update({
        where: { id: session.user.id },
        data: { instanceStatus: state }
      })
    }

    // Return updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        instanceName: true,
        instanceStatus: true,
        instanceQr: true,
        pairingCode: true
      }
    })

    return NextResponse.json({ user: updatedUser })

  } catch (error) {
    console.error('[API Instance PUT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh instance status' },
      { status: 500 }
    )
  }
}
