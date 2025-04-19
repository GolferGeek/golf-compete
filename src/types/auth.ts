export interface User {
  id: string
  email?: string
  phone?: string
  app_metadata: {
    provider?: string
    [key: string]: any
  }
  user_metadata: {
    [key: string]: any
  }
  aud: string
  created_at: string
}

export interface Session {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  user: User
} 