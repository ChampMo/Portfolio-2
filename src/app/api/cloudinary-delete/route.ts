import { NextResponse } from 'next/server';
import crypto from 'crypto';

function extractPublicId(url: string): { publicId: string; resourceType: string } {
  // URL format: https://res.cloudinary.com/{cloud}/{resource_type}/upload/v{ver}/{public_id}.{ext}
  const resourceTypeMatch = url.match(/\/(image|video|raw)\/upload\//);
  const resourceType = resourceTypeMatch?.[1] ?? 'image';

  const afterUpload = url.split('/upload/').pop() ?? '';
  // Strip leading version segment (v1234567890/)
  const withoutVersion = afterUpload.replace(/^v\d+\//, '');

  // For raw (PDFs), public_id includes the file extension
  // For image/video, strip the extension
  const publicId = resourceType === 'raw'
    ? withoutVersion
    : withoutVersion.replace(/\.[^/.]+$/, '');

  return { publicId, resourceType };
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!apiKey || !apiSecret || !cloudName) {
      return NextResponse.json({ error: 'Cloudinary credentials not configured' }, { status: 500 });
    }

    const { publicId, resourceType } = extractPublicId(url);
    const timestamp = Math.round(Date.now() / 1000);

    const signature = crypto
      .createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const body = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: apiKey,
      signature,
    });

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
      { method: 'POST', body }
    );

    const data = await cloudinaryRes.json();
    if (data.result === 'ok' || data.result === 'not found') {
      return NextResponse.json({ ok: true, result: data.result });
    }
    return NextResponse.json({ error: data.result }, { status: 400 });
  } catch (error) {
    console.error('[ CLOUDINARY DELETE ERROR ]:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
