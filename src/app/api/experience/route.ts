import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Experience from '@/models/Experience';

export async function GET() {
  try {
    await connectToDatabase();
    const experienceData = await Experience.findOne({});
    return NextResponse.json(experienceData || { experiences: [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch timeline logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const updatedExperience = await Experience.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
    });

    return NextResponse.json(updatedExperience, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to commit chronological data' }, { status: 500 });
  }
}