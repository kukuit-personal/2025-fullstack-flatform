export interface User {
  id: number
  email: string
  password?: string
  role: { id: number; name: string }
  status: 'active' | 'disable'

  profile?: {
    id: number
    name?: string
    avatar?: string
    phone?: string
    gender?: 'male' | 'female' | 'other'
    dob?: string | null
    status?: 'active' | 'disable'
  }
}
