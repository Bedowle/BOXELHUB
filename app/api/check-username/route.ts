import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { username } = await request.json()

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    })

    return NextResponse.json({ available: !user })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error checking username' },
      { status: 500 }
    )
  }
}
