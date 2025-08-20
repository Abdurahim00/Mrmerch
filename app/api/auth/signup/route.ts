import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ message: "This route is deprecated. Use /api/register for signup." }, { status: 400 })
}
