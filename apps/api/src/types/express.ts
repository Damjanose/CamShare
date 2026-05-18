import type { PermissionName } from "@jewellery/types"

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string
        sessionId: string
        email: string
        permissions: PermissionName[]
      }
    }
  }
}

export {}
