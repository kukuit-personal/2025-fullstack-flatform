import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'files', 'index.html')
    const html = await readFile(filePath, 'utf8')
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (e: any) {
    console.error(e)
    return new NextResponse('Not found', { status: 404 })
  }
}
