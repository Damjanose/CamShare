import axios from "axios"

type ApiIssue = {
  path?: string[]
  message?: string
}

type ApiErrorBody = {
  message?: string
  issues?: ApiIssue[]
}

const humanizeFieldName = (field: string) => {
  if (field === "fullName") return "Full name"
  if (field === "email") return "Email"
  if (field === "password") return "Password"
  return field
}

const toFriendlyIssueMessage = (field: string, rawMessage: string) => {
  const label = humanizeFieldName(field)
  if (rawMessage.includes("expected string to have >=1 characters")) {
    return `${label} is required`
  }
  if (rawMessage.includes("expected string to have >=8 characters")) {
    return `${label} must be at least 8 characters`
  }
  if (rawMessage.toLowerCase().includes("invalid email")) {
    return "Please enter a valid email address"
  }
  return rawMessage
}

export const extractFieldErrors = (error: unknown) => {
  const fieldErrors: Record<string, string> = {}
  let formError: string | null = null

  if (!axios.isAxiosError(error)) {
    return { fieldErrors, formError }
  }

  const data = error.response?.data as ApiErrorBody | undefined

  if (Array.isArray(data?.issues)) {
    for (const issue of data.issues) {
      const field = issue.path?.[0]
      if (!field || !issue.message || fieldErrors[field]) {
        continue
      }
      fieldErrors[field] = toFriendlyIssueMessage(field, issue.message)
    }
  }

  formError = data?.message ?? error.message ?? "Request failed"
  return { fieldErrors, formError }
}
