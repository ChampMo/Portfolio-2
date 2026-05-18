// src/app/api/aboutme/route.ts

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Identity from '@/models/Identity';

export async function GET() {
  try {
    await connectToDatabase();
    const identity = await Identity.findOne({});
    return NextResponse.json(identity || {}, { status: 200 });
  } catch (error) {
    // 🌟 [ADDED] สั่งให้ระบบพ่นบั๊กที่แท้จริงออกมาดูใน Terminal
    console.error('[ API ABOUTME GET ERROR ]:', error); 
    return NextResponse.json({ error: 'Failed to fetch identity data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const updatedIdentity = await Identity.findOneAndUpdate({}, { $set: body }, {
      new: true,
      upsert: true,
      strict: false,
    });

    return NextResponse.json(updatedIdentity, { status: 200 });
  } catch (error) {
    // 🌟 [ADDED] สั่งให้ระบบพ่นบั๊กที่แท้จริงออกมาดูใน Terminal
    console.error('[ API ABOUTME POST ERROR ]:', error); 
    return NextResponse.json({ error: 'Failed to update identity matrix' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; // 🌟 บอก Next.js ว่าหน้าคลังข้อมูลนี้ไม่ต้องพยายามคอมไพล์ตอน Build ให้รอดึงแบบเรียลไทม์เท่านั้น