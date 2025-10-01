export interface AuthAdapter {
  getCurrentUserId(req: Request): Promise<string | null>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  createUser(email: string, password: string): Promise<string>
}
