import { apiClient } from '../api/client';
import { photosService } from './photos';
import type { EventPhoto } from '@camshare/types';

export async function uploadPhoto(
  uri: string,
  mimeType: string | undefined,
  eventId: string,
  channelId: string,
  caption?: string,
): Promise<EventPhoto> {
  const type = mimeType ?? 'image/jpeg';
  const ext = type.split('/')[1] ?? 'jpg';

  const formData = new FormData();
  formData.append('file', {
    uri,
    type,
    name: `upload_${Date.now()}.${ext}`,
  } as unknown as Blob);

  const { data } = await apiClient.post<{ url: string }>(`/upload?eventId=${eventId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return photosService.add(eventId, channelId, { url: data.url, caption });
}
