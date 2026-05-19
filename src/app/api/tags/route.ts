import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Tag from '@/models/Tag';

export async function GET() {
  try {
    await connectToDatabase();
    const tags = await Tag.find({}).sort({ createdAt: -1 });
    return NextResponse.json(tags, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { name } = await request.json();

    // ตรวจสอบว่ามีชื่อนี้ในระบบหรือยัง
    const existingTag = await Tag.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingTag) {
      return NextResponse.json(existingTag, { status: 200 }); // ถ้ามีแล้วส่งตัวเดิมกลับไป
    }

    const newTag = await Tag.create({ name });
    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'No id provided' }, { status: 400 });
    await Tag.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}