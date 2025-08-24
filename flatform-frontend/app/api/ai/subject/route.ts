// app/api/ai/subject/route.ts
import { NextResponse } from 'next/server'
export async function POST(req: Request) {
  const { tone } = await req.json()
  // TODO: gọi model; tạm thời giả lập:
  const suggestions = [
    'An toàn khi sinh, tiếp cận toàn diện cùng hành trình làm mẹ',
    'Thư mời hội thảo: Chăm sóc sức khỏe sinh sản toàn diện',
    'Hội thảo: Chăm sóc sức khỏe sinh sản toàn diện',
  ]
  return NextResponse.json({ suggestions })
}
