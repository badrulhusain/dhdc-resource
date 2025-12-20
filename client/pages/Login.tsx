import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BookOpen, User, Shield } from "lucide-react";

export default function Login() {
  const [mode, setMode] = useState<"student" | "admin">("student");

  // Admin form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Student form state
  const [adNo, setAdNo] = useState("");
  const [name, setName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, studentLogin } = useAuth();

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // Admin might go to different dashboard, but logic is handled in protected routes usually.
      // For now, redirect to admin dashboard if role is admin? 
      // UseAuth hook doesn't return role immediately in login result directly in my impl?
      // Actually login returns user object. 
      navigate("/admin/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await studentLogin(adNo, name);
      navigate("/student/dashboard");
    } catch {
      setError("Login failed. Check Admission Number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-white/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">DHDC</h1>
        </div>
        <div>
          <h2 className="text-4xl font-bold mb-4">Resource Sharing</h2>
          <p className="text-lg opacity-90">
            Access a vast collection of e-books, audiobooks, and learning
            materials. Curated for students, by educators.
          </p>
        </div>
        <p className="text-sm opacity-75">
          © 2024 DHDC Platform. All rights reserved.
        </p>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 py-12">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Sign in to your account to access resources
            </p>
          </div>

          <div className="flex p-1 bg-muted rounded-lg mb-6">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "student"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => { setMode("student"); setError(""); }}
            >
              Student
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "admin"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => { setMode("admin"); setError(""); }}
            >
              Admin
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {mode === "admin" ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing in..." : "Sign in as Admin"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label htmlFor="adNo" className="block text-sm font-medium mb-1">
                  Admission Number
                </label>
                <input
                  id="adNo"
                  type="number"
                  value={adNo}
                  onChange={(e) => setAdNo(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          )}

          {mode === "admin" && (
            <p className="mt-6 text-center text-muted-foreground">
              Don't have an admin account?{" "}
              <Link
                to="/register"
                className="text-primary hover:underline font-medium"
              >
                Register here
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
