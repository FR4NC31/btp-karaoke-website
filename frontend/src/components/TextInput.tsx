import type { InputHTMLAttributes } from 'react'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function TextInput({ label, id, className = '', ...props }: TextInputProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-text-secondary">
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-lg border border-border bg-surface-elevated px-4 py-2.5 text-text-primary placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
        {...props}
      />
    </div>
  )
}
