import SignUpForm from './SignUpForm'

export default function SignUp() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-4xl font-semibold text-text-primary">Create account</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Join BTP Karaoke to start singing
        </p>

        <SignUpForm />
      </div>
    </div>
  )
}
