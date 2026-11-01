import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'

type OtpVerificationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  onVerify: (code: string) => Promise<void> | void
  onResend?: () => Promise<void> | void
}

export default function OtpVerificationModal({
  open,
  onOpenChange,
  email,
  onVerify,
  onResend,
}: OtpVerificationModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setDigits(['', '', '', '', '', ''])
      setError('')
    }
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [open])

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)
    setError('')

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
        const newDigits = [...digits]
        newDigits[index - 1] = ''
        setDigits(newDigits)
      } else {
        const newDigits = [...digits]
        newDigits[index] = ''
        setDigits(newDigits)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newDigits = ['', '', '', '', '', '']
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i]
    }
    setDigits(newDigits)
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await onVerify(code)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid verification code')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendCode() {
    if (!onResend) return
    setResending(true)
    setError('')
    try {
      await onResend()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border bg-surface p-6 text-text-primary sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-text-primary">
            Email Verification
          </DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">
            Enter the 6-digit verification code sent to <span className="font-medium text-text-primary">{email}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-12 w-11 rounded-lg border border-border bg-background text-center text-xl font-semibold text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ))}
          </div>

          {error && (
            <p role="alert" className="text-center text-sm text-error">
              {error}
            </p>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={submitting || digits.join('').length !== 6}
              className="w-full bg-primary py-2.5 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting ? 'Verifying...' : 'Verify Code'}
            </Button>

            {onResend && (
              <div className="text-center text-sm">
                <span className="text-text-secondary">Didn't receive code? </span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="font-medium text-primary hover:underline disabled:opacity-50"
                >
                  {resending ? 'Resending...' : 'Resend Code'}
                </button>
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
