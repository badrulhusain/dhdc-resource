import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Search, Lock, ArrowRight, Zap } from "lucide-react";

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
                  <Zap className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm font-medium text-primary">
                    Learning made easy
                  </span>
                </div>

                <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground">
                  Share Knowledge,
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {" "}
                    Learn Together
                  </span>
                </h1>

                <p className="text-xl text-muted-foreground max-w-lg">
                  Access a curated collection of e-books, audiobooks, and
                  learning resources. Built for students, by educators.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <>
                    {user.role === "student" && (
                      <Link to="/student/dashboard">
                        <Button size="lg" className="w-full sm:w-auto">
                          Browse Resources
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <Link to="/admin/dashboard">
                        <Button size="lg" className="w-full sm:w-auto">
                          Manage Resources
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link to="/login">
                      <Button size="lg" className="w-full sm:w-auto">
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>

                  </>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 pt-8">
                <div>
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <p className="text-muted-foreground">Resources</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-secondary">10K+</div>
                  <p className="text-muted-foreground">Active Students</p>
                </div>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl rounded-full" />
                <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-8 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border">
                    <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Math Fundamentals</p>
                      <p className="text-xs text-muted-foreground">E-Book</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border">
                    <div className="w-10 h-10 rounded bg-secondary/20 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Science History</p>
                      <p className="text-xs text-muted-foreground">Audiobook</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border">
                    <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        English Literature
                      </p>
                      <p className="text-xs text-muted-foreground">E-Library</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Choose DHDC?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed for seamless learning and
              resource sharing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-xl bg-background border border-border hover:border-primary/50 transition">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Filtering</h3>
              <p className="text-muted-foreground">
                Find exactly what you need with filters by class, category, and
                resource type
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-xl bg-background border border-border hover:border-secondary/50 transition">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-muted-foreground">
                JWT-based authentication with role-based access control for
                students and admins
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-xl bg-background border border-border hover:border-accent/50 transition">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Community Driven</h3>
              <p className="text-muted-foreground">
                Multiple administrators managing and curating resources for the
                entire student body
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-12 text-white text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to start learning?
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of students accessing world-class learning
                resources
              </p>
              <Link to="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-primary hover:bg-gray-50"
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold">
                D
              </div>
              <span className="font-bold">DHDC</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 DHDC Resource Sharing Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
