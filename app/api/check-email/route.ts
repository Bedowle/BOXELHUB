import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email } = await request.json()

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    return NextResponse.json({ available: !user })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error checking email' },
      { status: 500 }
    )
  }
}
