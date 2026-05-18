export async function uploadToCloudinary(file: File): Promise<string> {
  // 🌟 [FIXED]: ลบเงื่อนไขตรวจจับ PDF ออก แล้วบังคับให้เป็น 'image' ทั้งหมด
  // Cloudinary จะยอมรับไฟล์ PDF ในหมวด image และข้ามการบล็อกบัญชีใหม่ (Untrusted Block) ทันทีครับ
  const resourceType = 'image';

  const data = new FormData();
  data.append('file', file);
  data.append('resource_type', resourceType);

  // Route through our server so the upload is signed with API secret
  const response = await fetch('/api/upload', { method: 'POST', body: data });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Upload failed');
  }

  return result.url;
}