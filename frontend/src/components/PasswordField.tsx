import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { EyeIcon, EyeOffIcon } from '@hugeicons/core-free-icons'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  id: string
}

export default function PasswordField({ label, id, className = '', ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`w-full rounded-lg border border-border bg-surface-elevated px-4 py-2.5 pr-11 text-text-primary placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text-secondary"
        >
          <HugeiconsIcon icon={visible ? EyeOffIcon : EyeIcon} size={18} />
        </button>
      </div>
    </div>
  )
}
