import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Skill from '@/models/Skill';

export async function GET() {
  try {
    await connectToDatabase();
    const skillMatrix = await Skill.findOne({});
    return NextResponse.json(skillMatrix || { skills: { languages:[], database:[], frameworks:[], tools:[] } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch skill matrix' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const updatedSkills = await Skill.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
    });

    return NextResponse.json(updatedSkills, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save skills arsenal' }, { status: 500 });
  }
}