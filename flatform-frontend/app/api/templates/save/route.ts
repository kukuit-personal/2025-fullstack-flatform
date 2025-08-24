import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs' // cần Node runtime để dùng fs

export async function POST(req: Request) {
  try {
    const { content } = await req.json()
    if (!content || typeof content !== 'string') {
      return new NextResponse('Missing content', { status: 400 })
    }

    const dir = path.join(process.cwd(), 'public', 'files')
    const filePath = path.join(dir, 'index.html')

    await mkdir(dir, { recursive: true })
    await writeFile(filePath, content, 'utf8')

    return NextResponse.json({ ok: true, filePath: '/files/index.html' })
  } catch (err: any) {
    console.error(err)
    return new NextResponse(err?.message || 'Save error', { status: 500 })
  }
}
