import api from './api';
import { resizeToWebp } from './image';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function uploadAvatar(file) {
  if (!file || !file.type?.startsWith('image/')) {
    throw new Error('Please choose an image file');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('That image is too large. Please choose one under 10MB');
  }

  const blob = await resizeToWebp(file);

  const { data: presign } = await api.post('/users/me/avatar/upload-url');
  const uploadRes = await fetch(presign.uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': presign.contentType || 'image/webp' },
  });
  if (!uploadRes.ok) throw new Error('Upload failed, please try again');

  const { data: saved } = await api.put('/users/me/avatar');
  return saved.user;
}
