import type { PermissionName } from "@camshare/types"

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
