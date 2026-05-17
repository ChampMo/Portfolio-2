// src/app/api/projects/[id]/route.ts

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import Project from '@/models/Project';

// 📡 ดึงข้อมูลโปรเจกต์รายชิ้น
// 🌟 [NEXT.JS 15/16 FIX]: ต้องประกาศ Type ของ params เป็น Promise
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    
    // 🌟 [FIXED]: ต้องแกะกล่องของขวัญ params ด้วย await ก่อนนำข้อมูล id ออกมาใช้
    const { id } = await params;

    // ถ้าเป็น new ให้ปล่อยผ่านไปสร้างฟอร์มว่าง
    if (id === 'new') {
      return NextResponse.json({ message: 'Ready for new project stream' }, { status: 200 });
    }

    // กัน API พัง: เช็คก่อนว่า ID ที่ส่งมาเป็นรหัส MongoDB ของแท้ไหม
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json(project, { status: 200 });
  } catch (error) {
    console.error('[ API GET PROJECT ERROR ]:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// 🗑️ ลบโปรเจกต์ออกจาก Database
// 🌟 [NEXT.JS 15/16 FIX]: ปรับ params ให้เป็น Promise เช่นกัน
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();

    // 🌟 [FIXED]: ต้องสั่ง await เพื่อถอดรหัสเอา id ออกมา
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const deletedProject = await Project.findByIdAndDelete(id);
    
    if (!deletedProject) {
      return NextResponse.json({ error: 'Project not found to delete' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Project successfully deleted' }, { status: 200 });
  } catch (error) {
    console.error('[ API DELETE PROJECT ERROR ]:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}