/**
 * PUT of a file to a presigned S3 URL. This is the only request that does not go through the
 * generated client: it targets the storage, not our API, and must not carry cookies.
 */
export async function putToPresignedUrl(url: string, file: Blob, mimeType: string): Promise<void> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'content-type': mimeType },
    body: file,
  });
  if (!response.ok) throw new Error(`upload_failed_${response.status}`);
}
