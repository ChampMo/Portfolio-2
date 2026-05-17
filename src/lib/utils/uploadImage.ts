// src/lib/utils/uploadImage.ts

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  // ดึงค่า Preset จาก .env.local
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

  try {
    // ยิงตรงเข้า API ของ Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to upload image');
    }

    // ส่งคืน URL ของรูปภาพที่อัปโหลดเสร็จแล้ว
    return data.secure_url; 
  } catch (error) {
    console.error('[ SYSTEM ERROR ]: Cloudinary upload failed', error);
    throw error;
  }
}