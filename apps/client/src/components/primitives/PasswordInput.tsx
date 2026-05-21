import { useState, forwardRef, type InputHTMLAttributes } from "react"
import { FloatInput } from "./FloatInput"
import { Icon } from "./Icon"

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string
  containerClassName?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, containerClassName, ...rest }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <FloatInput
        ref={ref}
        label={label}
        containerClassName={containerClassName}
        type={visible ? "text" : "password"}
        endAdornment={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="flex items-center justify-center p-1 text-on-surface-variant hover:text-on-surface transition-colors"
            tabIndex={-1}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            <Icon name={visible ? "visibility_off" : "visibility"} className="text-base" />
          </button>
        }
        {...rest}
      />
    )
  },
)
PasswordInput.displayName = "PasswordInput"
