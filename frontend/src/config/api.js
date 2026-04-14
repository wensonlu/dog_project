/**
 * API 配置
 * 开发模式：使用 http://localhost:5001/api
 * 生产模式：
 *   - 如果域名包含 'dog-project'，使用后端完整域名
 *   - 否则使用相对路径 /api（支持前后端部署到同一域名）
 */
function getApiBaseUrl() {
    // 开发环境
    if (import.meta.env.DEV) {
        return 'http://localhost:5001/api';
    }
    
    // 生产环境：检查当前域名
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        
        // 如果域名包含 'dog-project'，使用后端完整域名
        if (hostname.includes('dog-project')) {
            return 'https://dog-project-backend-4khg.vercel.app/api';
        }
    }
    
    // 默认使用相对路径
    return '/api';
}

export const API_BASE_URL = getApiBaseUrl();
