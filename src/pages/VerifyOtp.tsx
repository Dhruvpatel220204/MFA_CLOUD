import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [canResend, setCanResend] = useState(false);
  const [targetEmail, setTargetEmail] = useState<string>("");
  const [displayOtp, setDisplayOtp] = useState<string>("");

  // Helper to generate and store a 6-digit OTP in sessionStorage (demo-only)
  const generateAndStoreOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem("pendingOtpCode", code);
    sessionStorage.setItem("pendingOtpExpiry", (Date.now() + 2 * 60 * 1000).toString());
    return code;
  };

  // Mount-only: generate/send OTP and read user email
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setTargetEmail(user.email);

      const existing = sessionStorage.getItem("pendingOtpCode");
      const expiryStr = sessionStorage.getItem("pendingOtpExpiry");
      const expired = expiryStr ? Date.now() > parseInt(expiryStr) : true;
      const codeToSend = existing && !expired ? existing : generateAndStoreOtp();
      setDisplayOtp(codeToSend);
      setTimeLeft(120);
      setCanResend(false);
      toast({ title: "OTP Sent", description: `Enter the 6-digit code sent to your email${user?.email ? ` (${user.email})` : ""}` });
    };
    init();
  }, []);

  // Timer effect: runs every second until zero
  useEffect(() => {
    if (timeLeft === 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    
    if (otpValue.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter all 6 digits",
      });
      return;
    }

    // Demo verification against sessionStorage
    const stored = sessionStorage.getItem("pendingOtpCode");
    const expiryStr = sessionStorage.getItem("pendingOtpExpiry");
    const expired = expiryStr ? Date.now() > parseInt(expiryStr) : true;

    if (!stored || expired || stored !== otpValue) {
      toast({
        variant: "destructive",
        title: "Invalid or expired OTP",
        description: "Please request a new code and try again",
      });
      return;
    }

    toast({
      title: "Verification Successful",
      description: "Your account has been verified",
    });

    // Clear OTP after success
    sessionStorage.removeItem("pendingOtpCode");
    sessionStorage.removeItem("pendingOtpExpiry");

    localStorage.setItem("isAuthenticated", "true");
    navigate("/dashboard");
  };

  const handleResend = () => {
    const newCode = generateAndStoreOtp();
    setDisplayOtp(newCode); // Update displayed OTP
    setTimeLeft(120);
    setCanResend(false);
    toast({
      title: "OTP Sent",
      description: `A new verification code has been sent to your email${targetEmail ? ` (${targetEmail})` : ""}`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-elegant animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-accent shadow-glow mb-4">
            <Mail className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Verify Your Account</h1>
          <p className="text-muted-foreground">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* Display OTP on UI for demo purposes */}
        {displayOtp && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2 text-center">
              Your OTP Code (Demo):
            </p>
            <div className="text-center">
              <span className="text-3xl font-bold text-primary tracking-widest">
                {displayOtp}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Copy this code to the input fields below
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-semibold"
              />
            ))}
          </div>

          <div className="text-center">
            {canResend ? (
              <Button
                type="button"
                variant="link"
                onClick={handleResend}
                className="text-primary hover:text-primary-glow"
              >
                Resend Code
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Resend code in {formatTime(timeLeft)}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gradient-accent shadow-elegant hover:shadow-glow transition-smooth"
          >
            Verify Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/register")}
            className="text-sm text-muted-foreground"
          >
            Back to Registration
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default VerifyOtp;
