/**
 * Uploads a PDF (or image) to Google Drive via the /api/upload/cv route.
 * Returns the public webViewLink so HR can open it without a Google login.
 */
export async function uploadCvToGoogleDrive(file: File): Promise<string> {
  const data = new FormData();
  data.append('file', file);

  const response = await fetch('/api/upload/cv', { method: 'POST', body: data });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Upload to Google Drive failed');
  }

  return result.url as string;
}
