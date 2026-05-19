// src/app/api/projects/route.ts

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Project from '@/models/Project'; // 🌟 เชื่อมเข้าหาไฟล์พิมพ์เขียวตัวหลักของเรา

// 📡 ดึงรายชื่อโปรเจกต์ทั้งหมดไปโชว์ที่หน้าการ์ด
export async function GET() {
  try {
    await connectToDatabase();
    // ดึงโปรเจกต์ทั้งหมดและเรียงลำดับจากใหม่ไปเก่า (ตามเวลาสร้าง)
    const projects = await Project.find({}).sort({ createdAt: -1 });
    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// 💾 บันทึกข้อมูลโปรเจกต์ (รองรับทั้งสร้างใหม่ และ อัปเดตของเดิม)
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { _id, title, time, coverImage, tags, blocks } = body;

    let updatedProject;

    if (_id) {
      // 🔄 ถ้ามี _id ติดมาด้วย แปลว่าเป็นการแก้ชิ้นงานเดิม ให้ทำการค้นหาและอัปเดตทับ
      updatedProject = await Project.findByIdAndUpdate(
        _id,
        { title, time, coverImage, tags, blocks },
        { returnDocument: 'after' }
      );
    } else {
      // ➕ ถ้าไม่มี _id แปลว่าเพิ่งสร้างใหม่สดๆ ให้กดปั๊มขึ้นคลาวด์ตัวใหม่ทันที
      updatedProject = await Project.create({
        title,
        time,
        coverImage,
        tags,
        blocks,
      });
    }

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error('[ API PROJECTS POST ERROR ]:', error);
    return NextResponse.json({ error: 'Failed to save project matrix' }, { status: 500 });
  }
}