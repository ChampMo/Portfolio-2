import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Service from '@/models/Service';

export async function GET() {
  try {
    await connectToDatabase();
    const serviceData = await Service.findOne({});
    return NextResponse.json(serviceData || { services: [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch services layout' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const updatedServices = await Service.findOneAndUpdate({}, body, {
      returnDocument: 'after',
      upsert: true,
    });

    return NextResponse.json(updatedServices, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to synchronize services database' }, { status: 500 });
  }
}