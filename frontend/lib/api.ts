// Utility gọi API an toàn: Tự động dự phòng giữa cổng trực tiếp (8000) và Next.js proxy (/pyapi)
// Đảm bảo không bao giờ bị lỗi CORS hay lỗi phân giải IPv6 localhost trên Windows

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  // Chuẩn hóa path: tự động bỏ tiền tố /api nếu caller truyền vào để tránh bị trùng thành /api/api/...
  let subPath = path.startsWith("/") ? path : `/${path}`;
  if (subPath.startsWith("/api/")) {
    subPath = subPath.substring(4); // Giữ lại từ dấu / trở đi
  } else if (subPath === "/api") {
    subPath = "";
  }

  const directUrl = `http://127.0.0.1:8000/api${subPath}`;
  const proxyUrl = `/pyapi${subPath}`;

  try {
    const res = await fetch(directUrl, options);
    return res;
  } catch (err) {
    console.warn(`[API Client] Ket noi truc tiep toi ${directUrl} that bai, chuyen sang du phong qua proxy ${proxyUrl}...`, err);
    return await fetch(proxyUrl, options);
  }
}

