import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import ProjectMeta from '@/models/ProjectMeta';

export async function GET() {
  try {
    await connectToDatabase();
    const metaData = await ProjectMeta.findOne({});
    return NextResponse.json(metaData || {}, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch constellation metadata' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    // บันทึกแบบ Upsert (มีอันเดียวในระบบ เขียนทับของเดิมเสมอ)
    const updatedMeta = await ProjectMeta.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
    });

    return NextResponse.json(updatedMeta, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update constellation metadata' }, { status: 500 });
  }
}