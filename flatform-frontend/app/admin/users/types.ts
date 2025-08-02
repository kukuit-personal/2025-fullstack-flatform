export interface User {
  id: string
  email: string
  password?: string
  roleId?: number
  role: { id: number; name: string }
  status: 'active' | 'disable'

  profile?: {
    id: string
    name?: string
    avatar?: string
    phone?: string
    gender?: 'male' | 'female' | 'other'
    dob?: string | null
    status?: 'active' | 'disable'
  }
}
