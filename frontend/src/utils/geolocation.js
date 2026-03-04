const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/reverse';
const GEOLOCATION_TIMEOUT_MS = 8000;

/**
 * 获取当前定位城市名称（用于评论/回复展示）
 * 使用浏览器定位 + Nominatim 逆地理，需 HTTPS 或 localhost
 * @returns {Promise<string|null>} 城市名或 null（拒绝/失败/超时）
 */
export async function getCurrentCityName() {
  if (!navigator?.geolocation) {
    return null;
  }

  const position = await new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error('timeout'));
    }, GEOLOCATION_TIMEOUT_MS);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        clearTimeout(id);
        resolve(p);
      },
      (err) => {
        clearTimeout(id);
        reject(err);
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
    );
  });

  const { latitude, longitude } = position.coords;
  const url = `${NOMINATIM_BASE}?lat=${latitude}&lon=${longitude}&format=json`;
  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'User-Agent': 'dog_project/1.0 (forum reply location)'
    }
  });
  if (!res.ok) return null;
  const data = await res.json();
  const addr = data?.address;
  if (!addr) return null;
  const city =
    addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.state ?? null;
  return typeof city === 'string' ? city : null;
}
