import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const resourceType = (formData.get('resource_type') as string) || 'image';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

    if (!apiKey || !apiSecret || !cloudName) {
      return NextResponse.json({ error: 'Cloudinary credentials not configured' }, { status: 500 });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'portfolio_assets';

    // Params must be sorted alphabetically (exclude: file, api_key, cloud_name, resource_type)
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', file);
    cloudinaryForm.append('api_key', apiKey);
    cloudinaryForm.append('timestamp', String(timestamp));
    cloudinaryForm.append('signature', signature);
    cloudinaryForm.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: 'POST', body: cloudinaryForm }
    );

    const result = await response.json();
    if (!response.ok) {
      console.error('[ CLOUDINARY UPLOAD ERROR ]:', result);
      return NextResponse.json({ error: result.error?.message || 'Upload failed' }, { status: 400 });
    }

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error('[ UPLOAD ROUTE ERROR ]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
