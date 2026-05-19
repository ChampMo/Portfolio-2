import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 🌟 1. ดึงค่า Environment Variables ของ OAuth 2.0
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!clientId || !clientSecret || !refreshToken || !folderId) {
      console.error('[ CV UPLOAD ] Missing Google Drive OAuth env vars');
      return NextResponse.json({ error: 'Google Drive credentials not configured' }, { status: 500 });
    }

    // 🌟 2. สร้าง OAuth2 Client แทน Service Account ตัวเดิม
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret
    );

    // 🌟 3. ป้อน Refresh Token เพื่อรับสิทธิ์อัปโหลดเข้า Drive
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // 🌟 4. ผูก OAuth2 Client เข้ากับ Google Drive API
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Convert browser File → Node.js Readable stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    const mimeType = file.type || 'application/pdf';
    const fileName = file.name || `cv_${Date.now()}.pdf`;

    // Upload to the designated Drive folder
    const uploadRes = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id,webViewLink',
    });

    const fileId = uploadRes.data.id;
    if (!fileId) {
      throw new Error('Google Drive did not return a file ID');
    }

    // Make the file publicly readable so HR can open it without a Google login
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // webViewLink format: https://drive.google.com/file/d/{id}/view
    const webViewLink =
      uploadRes.data.webViewLink ??
      `https://drive.google.com/file/d/${fileId}/view`;

    return NextResponse.json({ url: webViewLink, fileId });
  } catch (error) {
    console.error('[ CV UPLOAD ERROR ]:', error);
    return NextResponse.json({ error: 'Upload to Google Drive failed' }, { status: 500 });
  }
}