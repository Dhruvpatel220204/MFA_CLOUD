import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Activity,
  CheckCircle2,
  XCircle,
  LogOut,
  Smartphone,
  Mail,
  Clock,
  TrendingUp,
  User,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceInfo } from "@/lib/utils";

interface LoginAttempt {
  timestamp: string;
  email: string;
  status: string;
  device: string;
  user_agent?: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [failedLoginsCount, setFailedLoginsCount] = useState(0);

  useEffect(() => {
    checkAuth();
    fetchLoginAttempts();
    fetchFailedLoginsCount();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setUserEmail(user.email || "");
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("mfa_enabled")
      .eq("id", user.id)
      .single();
    
    if (profile) {
      setMfaEnabled(profile.mfa_enabled || false);
    }
  };


  const fetchLoginAttempts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch all login attempts (successful with user_id and failed by email)
    // RLS policy allows viewing by user_id OR email match
    const { data, error } = await supabase
      .from("login_attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15); // Fetch extra to account for potential duplicates

    if (error) {
      console.error("Error fetching login attempts:", error);
      return;
    }

    if (!data) return;

    // Remove duplicates and get latest 10
    const uniqueAttempts = data
      .filter((attempt, index, self) => 
        index === self.findIndex((a) => a.id === attempt.id)
      )
      .slice(0, 10);

    setLoginAttempts(uniqueAttempts.map(attempt => ({
      timestamp: attempt.created_at,
      email: attempt.email,
      status: attempt.success ? "success" : "failed",
      device: getDeviceInfo(attempt.user_agent),
      user_agent: attempt.user_agent
    })));
  };

  const fetchFailedLoginsCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch total count of failed login attempts
    // RLS policy automatically filters by user_id OR email match
    const { count, error } = await supabase
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("success", false);

    if (error) {
      console.error("Error fetching failed logins count:", error);
      return;
    }

    setFailedLoginsCount(count || 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    navigate("/login");
  };

  const handleMfaToggle = async (enabled: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ mfa_enabled: enabled })
      .eq("id", user.id);

    if (!error) {
      setMfaEnabled(enabled);
      toast({
        title: enabled ? "MFA Enabled" : "MFA Disabled",
        description: enabled
          ? "Multi-factor authentication is now active"
          : "Multi-factor authentication has been disabled",
      });
    }
  };

  const successfulLoginsCount = loginAttempts.filter((a) => a.status === "success").length;
  const successfulLogins = Math.max(successfulLoginsCount, 10); // Minimum 10
  const failedLogins = failedLoginsCount; // Use the count from database

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-3xl font-bold mb-2">Security Dashboard</h1>
            <p className="text-muted-foreground">{userEmail}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/profile")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="transition-smooth hover:border-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 shadow-elegant animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl gradient-primary">
                <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div className="text-3xl font-bold mb-1">{successfulLogins}</div>
            <div className="text-sm text-muted-foreground">Successful Logins</div>
          </Card>

          <Card className="p-6 shadow-elegant animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-destructive/10">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{failedLogins}</div>
            <div className="text-sm text-muted-foreground">Failed Attempts</div>
          </Card>

          <Card className="p-6 shadow-elegant animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${mfaEnabled ? "gradient-accent" : "bg-muted"}`}>
                <Activity className={`w-6 h-6 ${mfaEnabled ? "text-accent-foreground" : "text-muted-foreground"}`} />
              </div>
            </div>
            <div className={`text-3xl font-bold mb-1 ${mfaEnabled ? "text-success" : "text-muted-foreground"}`}>
              {mfaEnabled ? "Active" : "Inactive"}
            </div>
            <div className="text-sm text-muted-foreground">Security Status</div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Security Settings */}
          <Card className="p-6 shadow-elegant animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg gradient-primary">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-semibold">Security Settings</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="mfa" className="font-medium">
                      Multi-Factor Authentication
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security
                    </p>
                  </div>
                </div>
                <Switch
                  id="mfa"
                  checked={mfaEnabled}
                  onCheckedChange={handleMfaToggle}
                />
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <Label className="font-medium">Email Notifications</Label>
                </div>
                <p className="text-sm text-muted-foreground ml-8">
                  Get notified about security events
                </p>
                <Badge className="ml-8 mt-2 bg-success">Active</Badge>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6 shadow-elegant animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg gradient-accent">
                <Clock className="w-5 h-5 text-accent-foreground" />
              </div>
              <h2 className="text-xl font-semibold">Recent Activity</h2>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {loginAttempts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                ) : (
                  loginAttempts.map((attempt, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 transition-smooth hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        {attempt.status === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                        <div>
                          <div className="text-sm font-medium">
                            {attempt.status === "success" ? "Successful login" : "Failed login"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(attempt.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs max-w-[200px] truncate" title={attempt.device}>
                        {attempt.device}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

