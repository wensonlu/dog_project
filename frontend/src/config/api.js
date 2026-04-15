/**
 * API 配置
 * 开发模式：使用 http://localhost:5001/api
 * 生产模式：默认使用稳定后端域名（可通过 VITE_API_URL 覆盖）
 */
function getApiBaseUrl() {
    const envApiUrl = import.meta.env.VITE_API_URL;
    if (envApiUrl) {
        return envApiUrl.replace(/\/+$/, '');
    }

    // 开发环境
    if (import.meta.env.DEV) {
        return 'http://localhost:5001/api';
    }

    // 生产环境默认使用稳定后端域名，避免预览域名失效导致 404/CORS
    return 'https://dog-project-6aoq.vercel.app/api';
}

export const API_BASE_URL = getApiBaseUrl();
