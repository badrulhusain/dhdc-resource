import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Search, Lock, ArrowRight, Zap, GraduationCap, Globe, BookMarked } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-secondary/20 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="space-y-8"
            >
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 mr-2" />
                  Smart Learning Platform
                </div>

                <h1 className="text-5xl sm:text-7xl font-outfit font-extrabold tracking-tight text-foreground leading-[1.1]">
                  Unlock the <br />
                  <span className="bg-gradient-to-r from-primary via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                    Universe of Knowledge
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
                  Access thousands of premium e-books, audiobooks, and specialized resources. 
                  Designed for the curious, curated for the ambitious.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Link to={user.role === "admin" ? "/admin/dashboard" : "/student/dashboard"}>
                    <Button size="lg" className="w-full sm:w-auto px-8 h-12 text-base font-semibold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90">
                      GOTO DASHBOARD
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">
                      <Button size="lg" className="w-full sm:w-auto px-8 h-12 text-base font-semibold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90">
                        START LEARNING
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 h-12 text-base font-semibold border-2">
                        CREATE ACCOUNT
                      </Button>
                    </Link>
                  </>
                )}
              </motion.div>

              {/* Trust Indicators */}
              <motion.div variants={itemVariants} className="flex items-center gap-8 pt-6">
                <div>
                  <div className="text-3xl font-outfit font-bold text-foreground">1,200+</div>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold text-[10px]">Resources</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <div className="text-3xl font-outfit font-bold text-foreground">50k+</div>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold text-[10px]">Students</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <div className="text-3xl font-outfit font-bold text-foreground">24/7</div>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold text-[10px]">Access</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="hidden lg:block perspective-1000"
            >
              <div className="relative">
                {/* Main Visual Component */}
                <div className="glass-card rounded-[2rem] p-6 sm:p-10 border-primary/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4 p-4 glass-card bg-white/40 dark:bg-black/20 rounded-2xl border-white/40 shadow-sm border-2 translate-x-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 shadow-inner">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Quantum Physics 101</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">E-Book • PDF</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 glass-card bg-white/40 dark:bg-black/20 rounded-2xl border-white/40 shadow-md border-2 -translate-x-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500 shadow-inner">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">World History Archive</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">External Resource</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 glass-card bg-white/40 dark:bg-black/20 rounded-2xl border-white/40 shadow-lg border-2 translate-x-2">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500 shadow-inner">
                        <BookMarked className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Advanced Algorithm</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Video Course</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-outfit font-extrabold tracking-tight">
              Designed for Modern Learning
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              A powerful ecosystem tools built to help you excel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {/* Feature Core 1 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-[2rem] glass-card border-none hover:ring-2 hover:ring-primary/20 transition-all text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-outfit font-bold mb-4">Precision Search</h3>
              <p className="text-muted-foreground leading-relaxed">
                Find exactly what you need with advanced filters by class, category, and content type.
              </p>
            </motion.div>

            {/* Feature Core 2 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-[2rem] glass-card border-none hover:ring-2 hover:ring-secondary/20 transition-all text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Lock className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-outfit font-bold mb-4">Secure Library</h3>
              <p className="text-muted-foreground leading-relaxed">
                Safe and organized storage with JWT-based authentication and role-based access.
              </p>
            </motion.div>

            {/* Feature Core 3 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-[2rem] glass-card border-none hover:ring-2 hover:ring-blue-500/20 transition-all text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <GraduationCap className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-outfit font-bold mb-4">Expert Curated</h3>
              <p className="text-muted-foreground leading-relaxed">
                Resources selected and verified by educational experts to ensure quality and relevance.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="space-y-4 max-w-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  D
                </div>
                <span className="font-outfit font-bold text-xl">DHDC</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Empowering students with open access to global knowledge.
                A platform built for excellence in education.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Platform</h4>
                <ul className="space-y-2 text-sm text-muted-foreground font-medium">
                  <li className="hover:text-primary transition-colors cursor-pointer">Resources</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Community</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">API</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Support</h4>
                <ul className="space-y-2 text-sm text-muted-foreground font-medium">
                  <li className="hover:text-primary transition-colors cursor-pointer">Help Center</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Guides</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Privacy</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
              © 2024 DHDC DIGITAL LIBRARY. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center gap-6">
               {/* Social Icons placeholder */}
               <div className="w-5 h-5 bg-muted rounded-full" />
               <div className="w-5 h-5 bg-muted rounded-full" />
               <div className="w-5 h-5 bg-muted rounded-full" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

