import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BookOpen, User, Shield, ArrowRight, Lock, Mail, BadgeCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-background font-sans selection:bg-primary/20 overflow-x-hidden">
      {/* Left side - Branding & Visuals */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary relative overflow-hidden flex-col justify-between p-16 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-accent/20" />
        
        <div className="relative z-10 flex items-center gap-3">
          <motion.div 
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl"
          >
            <BookOpen className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-3xl font-outfit font-black tracking-tighter">DHDC</h1>
        </div>

        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl font-outfit font-black leading-[1.1] mb-6 tracking-tight">
              Gateway to <span className="text-secondary">Knowledge.</span>
            </h2>
            <p className="text-xl opacity-80 leading-relaxed font-medium">
              Access a premium selection of digitised resources, curated specifically for the DHDC community.
            </p>
          </motion.div>
          
          <div className="mt-12 flex flex-col gap-4">
             {[
               { icon: <BadgeCheck className="w-5 h-5" />, text: "Verified Academic Content" },
               { icon: <Lock className="w-5 h-5" />, text: "Secure Student Access" },
               { icon: <ArrowRight className="w-5 h-5" />, text: "Seamless Learning Journey" }
             ].map((item, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.4 + (i * 0.1) }}
                 className="flex items-center gap-3 text-white/70 font-medium"
               >
                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                   {item.icon}
                 </div>
                 {item.text}
               </motion.div>
             ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-sm font-bold tracking-widest text-white/40 uppercase">
          <p>© 2024 DHDC DIGITAL</p>
          <div className="flex gap-4">
             <span className="hover:text-white cursor-pointer transition-colors">PRIVACY</span>
             <span className="hover:text-white cursor-pointer transition-colors">TERMS</span>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-20 lg:py-12 relative min-h-screen lg:min-h-0">
        {/* Mobile Branding - Visible only on small screens */}
        <div className="lg:hidden flex items-center justify-center gap-3 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-2xl shadow-2xl shadow-primary/20 transform rotate-3">
            D
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-outfit font-black tracking-tighter leading-none">DHDC</h1>
            <p className="text-[10px] font-black tracking-[0.3em] text-muted-foreground leading-none">DIGITAL LIBRARY</p>
          </div>
        </div>

        {/* Background micro-accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="w-full max-w-[420px] mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center lg:text-left"
          >
            <h1 className="text-4xl font-outfit font-black text-foreground mb-3 tracking-tight">
              Secure Login
            </h1>
            <p className="text-muted-foreground font-medium">
              Enter your credentials to access the library portal.
            </p>
          </motion.div>

          {/* Mode Switcher */}
          <div className="flex p-1.5 bg-muted/50 backdrop-blur-sm border rounded-2xl mb-8">
            <button
              className={cn(
                "flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2",
                mode === "student"
                  ? "bg-background shadow-xl shadow-primary/5 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => { setMode("student"); setError(""); }}
            >
              <User className="w-4 h-4" />
              STUDENT
            </button>
            <button
              className={cn(
                "flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2",
                mode === "admin"
                  ? "bg-background shadow-xl shadow-primary/5 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => { setMode("admin"); setError(""); }}
            >
              <Shield className="w-4 h-4" />
              ADMIN
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  {error}
                </motion.div>
              )}

              {mode === "admin" ? (
                <form onSubmit={handleAdminSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@school.edu"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-input bg-background/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-input bg-background/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium outline-none"
                        required
                      />
                      <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-primary hover:text-primary/80 transition-colors">FORGOT?</button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20">
                    {loading ? "AUTHENTICATING..." : "ADMIN PORTAL ACCESS"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleStudentSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="adNo" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Admission Number
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        id="adNo"
                        type="number"
                        value={adNo}
                        onChange={(e) => setAdNo(e.target.value)}
                        placeholder="1234..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-input bg-background/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Student Full Name
                    </label>
                    <div className="relative">
                      <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-input bg-background/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium outline-none"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20">
                    {loading ? "INITIALIZING..." : "ENTER DIGITAL LIBRARY"}
                  </Button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          <footer className="mt-12 text-center">
             <p className="text-muted-foreground text-sm font-medium">
               Experiencing issues? <span className="text-primary font-bold hover:underline cursor-pointer">Contact Support</span>
             </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

