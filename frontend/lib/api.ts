// Utility gọi API an toàn: Tự động dự phòng giữa cổng trực tiếp (8000) và Next.js proxy (/pyapi)
// Đảm bảo không bao giờ bị lỗi CORS hay lỗi phân giải IPv6 localhost trên Windows

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const directUrl = `http://127.0.0.1:8000/api${cleanPath}`;
  const proxyUrl = `/pyapi${cleanPath}`;

  try {
    const res = await fetch(directUrl, options);
    return res;
  } catch (err) {
    console.warn(`[API Client] Ket noi truc tiep toi ${directUrl} that bai, chuyen sang du phong qua proxy ${proxyUrl}...`, err);
    return await fetch(proxyUrl, options);
  }
}
