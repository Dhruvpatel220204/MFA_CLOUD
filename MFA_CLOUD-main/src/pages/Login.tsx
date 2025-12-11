import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Track login attempt
      await supabase.from("login_attempts").insert({
        user_id: data.user?.id,
        email: formData.email,
        success: true,
        ip_address: "Unknown",
        user_agent: navigator.userAgent,
      });

      // Check if MFA is enabled for this user
      if (data.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("mfa_enabled")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          // If we can't read the profile, fall back to normal login
          toast({
            title: "Login Successful",
            description: "Redirecting to your dashboard...",
          });
          setTimeout(() => navigate("/dashboard"), 1000);
          return;
        }

        if (profile?.mfa_enabled) {
          // MFA required → route to OTP page
          toast({
            title: "MFA Required",
            description: "Enter the 6‑digit OTP to continue",
          });
          setTimeout(() => navigate("/verify-otp"), 500);
          return;
        }
      }

      // No MFA → go straight to dashboard
      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error: any) {
      // Track failed attempt
      const { data: insertData, error: insertError } = await supabase
        .from("login_attempts")
        .insert({
          email: formData.email,
          success: false,
          ip_address: "Unknown",
          user_agent: navigator.userAgent,
        })
        .select();

      if (insertError) {
        console.error("Error inserting failed login attempt:", insertError);
      } else {
        console.log("Failed login attempt recorded:", insertData);
      }

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-elegant animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your secure account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-smooth"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, rememberMe: checked as boolean })
                }
              />
              <label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Remember me
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:text-primary-glow transition-smooth"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full gradient-primary shadow-elegant hover:shadow-glow transition-smooth">
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:text-primary-glow transition-smooth font-medium">
            Sign up
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
