export interface User {
  id: number
  email: string
  role: 'admin' | 'client' | string
  status: string
  profile?: {
    id: number
    name?: string
    avatar?: string
    phone?: string
    gender?: string
    dob?: string | null
  }
}
