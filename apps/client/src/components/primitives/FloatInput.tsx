import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react"
import { cn } from "@/lib/cn"

type FloatInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  endAdornment?: ReactNode
  containerClassName?: string
  textVariant?: "body" | "headline"
}

export const FloatInput = forwardRef<HTMLInputElement, FloatInputProps>(
  (
    { label, endAdornment, className, containerClassName, textVariant = "body", id, ...rest },
    ref,
  ) => {
    const inputId = id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
    return (
      <div className={cn("group", containerClassName)}>
        <label
          htmlFor={inputId}
          className="block text-label-md font-label-md text-on-surface-variant uppercase tracking-widest mb-1"
        >
          {label}
        </label>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            {...rest}
            className={cn(
              "form-underline",
              textVariant === "headline"
                ? "font-headline-md text-headline-md"
                : "font-body-md text-body-md",
              endAdornment && "pr-8",
              className,
            )}
          />
          {endAdornment && (
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant">
              {endAdornment}
            </span>
          )}
        </div>
      </div>
    )
  },
)
FloatInput.displayName = "FloatInput"
