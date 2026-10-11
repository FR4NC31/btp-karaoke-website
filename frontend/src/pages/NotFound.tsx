import { useNavigate } from 'react-router'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background">
      <h1 className="font-heading text-5xl">404 - PAGE NOT FOUND</h1>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="rounded-lg bg-primary px-6 py-3 font-medium text-text-primary transition hover:bg-primary-hover"
      >
        Go Back
      </button>
    </div>
  )
}
