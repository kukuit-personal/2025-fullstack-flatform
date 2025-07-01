import api from './api'
import { User } from '@/types/user'

/**
 * Gọi /auth/profile để lấy thông tin người dùng đã xác thực
 */
export async function getUserProfile(): Promise<User | null> {  
  try {
    const res = await api.get('/auth/profile')
    return res.data.user as User
  } catch (err) {
    console.error('Lỗi khi gọi /auth/profile:', err)
    return null
  }
}
