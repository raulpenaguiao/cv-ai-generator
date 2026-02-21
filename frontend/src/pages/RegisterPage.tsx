import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { register } from "@/api/auth"

export function RegisterPage() {
  const [email, setEmail] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await register(email)
      setGeneratedPassword(res.generatedPassword)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  if (generatedPassword) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Account Created</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Your account has been created. Save your generated password — it will not be shown
              again.
            </p>
            <div className="rounded-md border bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-1">Your password:</p>
              <code className="block break-all text-sm font-mono font-semibold">
                {generatedPassword}
              </code>
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/login" className="w-full">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Register</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A secure password will be generated and shown to you once. Keep it safe.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
