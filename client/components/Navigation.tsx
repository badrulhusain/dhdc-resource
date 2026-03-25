import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, BookOpen, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = user ? [
    { 
      name: user.role === "admin" ? "Admin Panel" : "Library", 
      path: user.role === "admin" ? "/admin/dashboard" : "/student/dashboard",
      icon: user.role === "admin" ? <Shield className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />
    }
  ] : [];

  const hideNavigationPaths = ["/student/dashboard", "/admin/dashboard", "/resource"];
  if (hideNavigationPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-[100] transition-all duration-300",
      scrolled || isOpen ? "glass-nav py-3" : "bg-transparent py-5"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-10">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div 
               whileHover={{ rotate: 0, scale: 1.05 }}
               className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg transform rotate-3 transition-all"
            >
              D
            </motion.div>
            <div className="flex flex-col">
              <span className="font-outfit font-black text-xl tracking-tighter leading-none group-hover:text-primary transition-colors">DHDC</span>
              <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground leading-none">DIGITAL</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-bold tracking-tight px-4 py-2 rounded-xl transition-all flex items-center gap-2",
                  location.pathname === link.path 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}

            <div className="h-4 w-px bg-border/50 mx-2" />

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold leading-none">{user.name}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">{user.role}</span>
                </div>
                <Button 
                   onClick={handleLogout} 
                   variant="ghost" 
                   size="icon" 
                   className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link to="/login">
                  <Button variant="ghost" className="font-bold text-sm tracking-tight rounded-xl">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="font-bold text-sm tracking-tight rounded-xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 px-6">
                    Join Platform
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-accent rounded-xl transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 glass-nav border-t border-border mt-2 p-4 shadow-2xl space-y-2"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-xl font-bold transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            
            {user ? (
              <div className="pt-4 border-t border-border mt-4">
                <div className="px-4 py-2 mb-4">
                   <p className="text-sm font-bold">{user.name}</p>
                   <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{user.role}</p>
                </div>
                <Button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  variant="destructive"
                  className="w-full rounded-xl font-bold h-12"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full rounded-xl font-bold h-12">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  <Button className="w-full rounded-xl font-bold h-12 bg-primary shadow-lg shadow-primary/20">
                    Join Now
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
