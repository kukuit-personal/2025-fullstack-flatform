import axios from 'axios'

function getLocaleFromCookie(): string {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/);
    return match?.[1] || 'vi';
  }
  return 'vi'; // fallback
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  withCredentials: true, // gửi cookie httpOnly
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': getLocaleFromCookie(),
  },
})

// Gắn biến cờ để tránh vòng lặp vô hạn nếu token bị lỗi liên tục
let isRefreshing = false

// Axios Response Interceptor để xử lý 401 và tự gọi refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Nếu lỗi là 401 và chưa từng refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (!isRefreshing) {
        isRefreshing = true
        try {
          console.log('🔄 Gọi API refresh')
          await api.post('/auth/refresh') // Gọi API refresh
          isRefreshing = false
          return api(originalRequest) // Gửi lại request gốc
        } catch (refreshError) {
          isRefreshing = false
          console.error('Token refresh failed', refreshError)
          window.location.href = '/login' // Redirect nếu refresh thất bại
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api
