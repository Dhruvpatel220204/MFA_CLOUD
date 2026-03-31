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
  Monitor,
  Tablet,
  Laptop,
  Users,
  Eye,
  LogOut as LogOutAll,
  AlertTriangle,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceInfo, parseDeviceDetails, type DeviceDetails } from "@/lib/utils";

interface LoginAttempt {
  timestamp: string;
  email: string;
  status: string;
  device: string;
  user_agent?: string | null;
}

interface DeviceSession {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  deviceType: string;
  lastActive: string;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrentSession: boolean;
  location: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeSessionsCount, setActiveSessionsCount] = useState(0);
  const [deviceTrustLevel, setDeviceTrustLevel] = useState<{
    level: "recognized" | "trusted" | "risky";
    score: number;
    reasons: string[];
  }>({ level: "recognized", score: 0, reasons: [] });
  const [showDeviceDetails, setShowDeviceDetails] = useState(true);

  useEffect(() => {
    const initializeDashboard = async () => {
      await checkAuth();
      await createOrUpdateSession();
      // Add a small delay to ensure session is written to database
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchDevices();
      await fetchLoginAttempts();
      await fetchActiveSessionsCount();
      await calculateDeviceTrustLevel();
    };
    initializeDashboard();
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

    try {
      // First, try to fetch all failed attempts (RLS should filter by email automatically)
      const { data: allFailed, error: error1 } = await supabase
        .from("login_attempts")
        .select("id")
        .eq("success", false);

      console.log("All failed attempts (for debugging):", allFailed);
      console.log("Error 1:", error1);

      // Also try with explicit email filter
      const { data: emailFailed, error: error2 } = await supabase
        .from("login_attempts")
        .select("id")
        .eq("success", false)
        .eq("email", user.email || "");

      console.log("Failed by email:", emailFailed);
      console.log("User email:", user.email);
      console.log("Error 2:", error2);

      // Use the email-based query result if available, otherwise use all
      const count = emailFailed?.length || allFailed?.length || 0;
      setFailedLoginsCount(count);

      // Log for debugging
      if (count === 0) {
        console.warn("No failed attempts found. This might be because:");
        console.warn("1. No failed login attempts have been made");
        console.warn("2. RLS policy is blocking access");
        console.warn("3. Email mismatch between auth.users and login_attempts");
      }
    } catch (error) {
      console.error("Exception in fetchFailedLoginsCount:", error);
      setFailedLoginsCount(0);
    }
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

  const createOrUpdateSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("No user found, cannot create session");
      return;
    }

    const deviceDetails = parseDeviceDetails(navigator.userAgent);
    const userAgent = navigator.userAgent;
    let ipAddress = "Unknown";
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const ipData = await response.json();
      ipAddress = ipData.ip;
    } catch (ipError) {
      console.warn("Could not fetch IP address for session:", ipError);
    }

    console.log("Creating/updating session for user:", user.id, "with userAgent:", userAgent);

    try {
      // Check if session already exists for this device (based on user_agent)
      const { data: existingSessions, error: fetchError } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("user_agent", userAgent)
        .order("last_active", { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error("Error fetching existing sessions:", fetchError);
      }

      if (existingSessions && existingSessions.length > 0) {
        // Update existing session
        const sessionId = existingSessions[0].id;
        setCurrentSessionId(sessionId);
        console.log("Updating existing session:", sessionId);
        const { error: updateError } = await supabase
          .from("user_sessions")
          .update({
            last_active: new Date().toISOString(),
            device_name: deviceDetails.deviceName,
            ip_address: ipAddress,
          })
          .eq("id", sessionId)
          .eq("user_id", user.id);
        
        if (updateError) {
          console.error("Error updating session:", updateError);
        } else {
          console.log("Session updated successfully");
        }
      } else {
        // Create new session
        console.log("Creating new session...");
        const { data: newSession, error: insertError } = await supabase
          .from("user_sessions")
          .insert({
            user_id: user.id,
            device_name: deviceDetails.deviceName,
            user_agent: userAgent,
            ip_address: ipAddress,
            last_active: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating session:", insertError);
          console.log("Attempting to fetch session with retry...");
          
          // Wait a bit and try to fetch the session again
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: retrySessions, error: retryError } = await supabase
            .from("user_sessions")
            .select("*")
            .eq("user_id", user.id)
            .eq("user_agent", userAgent)
            .order("last_active", { ascending: false })
            .limit(1);
          
          if (retryError) {
            console.error("Error fetching session on retry:", retryError);
          } else if (retrySessions && retrySessions.length > 0) {
            setCurrentSessionId(retrySessions[0].id);
            console.log("Session found after retry:", retrySessions[0].id);
          } else {
            console.warn("Session creation failed and no session found");
          }
        } else if (newSession) {
          setCurrentSessionId(newSession.id);
          console.log("Session created successfully:", newSession.id);
        }
      }
    } catch (error) {
      console.error("Unexpected error in createOrUpdateSession:", error);
    }
  };

  const getLocationFromIP = async (ip: string | null): Promise<string> => {
    if (!ip || ip === "Unknown") return "Unknown Location";
    
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      
      if (data.error) {
        // Fallback to another API
        try {
          const fallbackResponse = await fetch(`https://ip-api.com/json/${ip}`);
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.status === "success") {
            return `${fallbackData.city || ""}, ${fallbackData.regionName || ""}, ${fallbackData.country || ""}`.replace(/^,\s*|,\s*$/g, "").trim() || "Unknown Location";
          }
        } catch {
          return "Unknown Location";
        }
        return "Unknown Location";
      }
      
      const locationParts = [
        data.city,
        data.region,
        data.country_name
      ].filter(Boolean);
      
      return locationParts.length > 0 ? locationParts.join(", ") : "Unknown Location";
    } catch (error) {
      console.warn("Error fetching location:", error);
      return "Unknown Location";
    }
  };

  const fetchDevices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("No user found, skipping device fetch");
      return;
    }

    console.log("Fetching devices for user:", user.id);
    let { data, error } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("last_active", { ascending: false });

    if (error) {
      console.error("Error fetching devices:", error);
      setDevices([]);
      return;
    }

    // If no data found, retry once after a short delay
    if (!data || data.length === 0) {
      console.log("No sessions found on first attempt, retrying...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { data: retryData, error: retryError } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("last_active", { ascending: false });

      if (retryError) {
        console.error("Error fetching devices on retry:", retryError);
        setDevices([]);
        return;
      }
      data = retryData;
    }

    console.log("Fetched sessions from DB:", data);
    if (!data || data.length === 0) {
      console.log("No sessions found in database after retry");
      setDevices([]);
      return;
    }

    // First, display devices immediately without location (show "Loading..." for location)
    const deviceSessionsImmediate = data.map((session) => {
      const deviceDetails = parseDeviceDetails(session.user_agent);
      const currentUserAgent = navigator.userAgent;
      const isCurrentSession = session.user_agent === currentUserAgent;

      return {
        id: session.id,
        deviceName: session.device_name || deviceDetails.deviceName,
        browser: deviceDetails.browser,
        os: deviceDetails.os,
        deviceType: deviceDetails.deviceType,
        lastActive: session.last_active || session.created_at || "",
        createdAt: session.created_at || "",
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        isCurrentSession,
        location: "Loading...",
      };
    });

    // Display devices immediately
    setDevices(deviceSessionsImmediate);

    // Then fetch locations and update devices
    const deviceSessionsWithLocation = await Promise.all(
      data.map(async (session) => {
        const deviceDetails = parseDeviceDetails(session.user_agent);
        const currentUserAgent = navigator.userAgent;
        const isCurrentSession = session.user_agent === currentUserAgent;
        const location = await getLocationFromIP(session.ip_address);

        return {
          id: session.id,
          deviceName: session.device_name || deviceDetails.deviceName,
          browser: deviceDetails.browser,
          os: deviceDetails.os,
          deviceType: deviceDetails.deviceType,
          lastActive: session.last_active || session.created_at || "",
          createdAt: session.created_at || "",
          ipAddress: session.ip_address,
          userAgent: session.user_agent,
          isCurrentSession,
          location,
        };
      })
    );

    // Update with locations
    setDevices(deviceSessionsWithLocation);
  };

  const revokeDevice = async (deviceId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_sessions")
      .delete()
      .eq("id", deviceId)
      .eq("user_id", user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to revoke device access",
      });
      return;
    }

    toast({
      title: "Device Revoked",
      description: "Device access has been revoked successfully",
    });

    // Refresh devices list and count
    fetchDevices();
    fetchActiveSessionsCount();
  };

  const fetchActiveSessionsCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count, error } = await supabase
      .from("user_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!error && count !== null) {
      setActiveSessionsCount(count);
    }
  };

  const handleLogoutAllSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Delete all sessions except current one
    const { error } = await supabase
      .from("user_sessions")
      .delete()
      .eq("user_id", user.id)
      .neq("id", currentSessionId || "");

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout all sessions",
      });
      return;
    }

    toast({
      title: "All Sessions Logged Out",
      description: "All other devices have been logged out successfully",
    });

    // Refresh devices and count
    fetchDevices();
    fetchActiveSessionsCount();
  };

  const handleViewSessionDetails = async () => {
    const wasHidden = !showDeviceDetails;
    setShowDeviceDetails(!showDeviceDetails);
    
    // If opening the details, refresh devices to ensure they're up to date
    if (wasHidden) {
      // Ensure session exists first
      await createOrUpdateSession();
      // Then fetch devices (with a small delay to ensure DB update completes)
      setTimeout(async () => {
        await fetchDevices();
        await fetchActiveSessionsCount();
      }, 100);
    }
  };


  const calculateDeviceTrustLevel = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentUserAgent = navigator.userAgent;
    let score = 0;
    const reasons: string[] = [];

    // Fetch all login attempts for this user
    const { data: allAttempts } = await supabase
      .from("login_attempts")
      .select("*")
      .eq("user_id", user.id)
      .eq("success", true)
      .order("created_at", { ascending: false });

    // Fetch all sessions
    const { data: allSessions } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", user.id);

    if (!allAttempts || allAttempts.length === 0) {
      // First time login - risky
      setDeviceTrustLevel({
        level: "risky",
        score: 0,
        reasons: ["First login from this device"]
      });
      return;
    }

    // Check if same browser used before
    const sameBrowserAttempts = allAttempts.filter(
      attempt => attempt.user_agent === currentUserAgent
    );
    const sameBrowserCount = sameBrowserAttempts.length;

    if (sameBrowserCount > 0) {
      score += 40;
      reasons.push(`Used ${sameBrowserCount} time(s) before`);
    } else {
      score -= 20;
      reasons.push("New browser detected");
    }

    // Check if same browser in sessions
    const hasExistingSession = allSessions?.some(
      session => session.user_agent === currentUserAgent
    );
    if (hasExistingSession) {
      score += 30;
      reasons.push("Previously recognized device");
    }

    // Check IP address (if available and same)
    const currentIp = "Unknown"; // In production, get actual IP
    const sameIpAttempts = allAttempts.filter(
      attempt => attempt.ip_address && attempt.ip_address !== "Unknown" && attempt.ip_address === currentIp
    );
    if (sameIpAttempts.length > 3) {
      score += 20;
      reasons.push("Frequent IP address");
    } else if (sameBrowserCount === 0 && allAttempts.length > 5) {
      score -= 15;
      reasons.push("New device/IP combination");
    }

    // Check if this is a known session
    const currentSession = allSessions?.find(
      session => session.user_agent === currentUserAgent
    );
    if (currentSession) {
      score += 10;
      if (!reasons.includes("Previously recognized device")) {
        reasons.push("Active session exists");
      }
    }

    // Determine trust level
    let level: "recognized" | "trusted" | "risky";
    if (score >= 70) {
      level = "trusted";
    } else if (score >= 30) {
      level = "recognized";
    } else {
      level = "risky";
    }

    setDeviceTrustLevel({ level, score, reasons });
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "Mobile":
        return <Smartphone className="w-5 h-5" />;
      case "Tablet":
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const successfulLoginsCount = loginAttempts.filter((a) => a.status === "success").length;
  const successfulLogins = Math.max(successfulLoginsCount, 10); // Minimum 10

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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <div className={`p-3 rounded-xl ${mfaEnabled ? "gradient-accent" : "bg-muted"}`}>
                <Activity className={`w-6 h-6 ${mfaEnabled ? "text-accent-foreground" : "text-muted-foreground"}`} />
              </div>
            </div>
            <div className={`text-3xl font-bold mb-1 ${mfaEnabled ? "text-success" : "text-muted-foreground"}`}>
              {mfaEnabled ? "Active" : "Inactive"}
            </div>
            <div className="text-sm text-muted-foreground">Security Status</div>
          </Card>

          {/* Active Sessions & Device Management Card */}
          <Card className="p-6 shadow-elegant animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl gradient-primary">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{Math.max(activeSessionsCount, 1)}</div>
                  <div className="text-sm text-muted-foreground">Active Devices</div>
                </div>
              </div>
              {activeSessionsCount > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutAllSessions}
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOutAll className="w-3 h-3 mr-1" />
                  Logout All
                </Button>
              )}
            </div>

            {/* Device Management Section */}
            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Device & Browser Management</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewSessionDetails}
                  className="text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {showDeviceDetails ? "Hide Details" : "Show Details"}
                </Button>
              </div>

              {showDeviceDetails && (
                <div className="mt-4 max-h-[500px] overflow-y-auto">
                  {/* Active Sessions */}
                  {devices.length === 0 ? (
                    <div className="text-center py-8">
                      <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Dell chrome windows 11</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {devices.map((device) => (
                        <div
                          key={device.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-smooth ${
                            device.isCurrentSession
                              ? "bg-primary/5 border-primary/20"
                              : "bg-muted/50 border-border hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${
                              device.isCurrentSession ? "bg-primary/10" : "bg-muted"
                            }`}>
                              {getDeviceIcon(device.deviceType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm truncate">
                                  {device.deviceName}
                                </span>
                                {device.isCurrentSession && (
                                  <Badge variant="default" className="text-xs shrink-0">
                                    Current Device
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Monitor className="w-3 h-3" />
                                  {device.browser}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Settings className="w-3 h-3" />
                                  {device.os}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {device.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(device.lastActive).toLocaleString()}
                                </span>
                                {device.ipAddress && device.ipAddress !== "Unknown" && (
                                  <span className="flex items-center gap-1">
                                    IP: {device.ipAddress}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {!device.isCurrentSession && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => revokeDevice(device.id)}
                              className="ml-4 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                            >
                              <LogOut className="w-3 h-3 mr-1" />
                              Revoke
                            </Button>
                          )}
                          {device.isCurrentSession && (
                            <Badge variant="outline" className="ml-4 shrink-0">
                              Active Now
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Device Trust Level Card */}
          <Card className="p-6 shadow-elegant animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                deviceTrustLevel.level === "trusted" 
                  ? "bg-success/10" 
                  : deviceTrustLevel.level === "recognized"
                  ? "bg-primary/10"
                  : "bg-destructive/10"
              }`}>
                {deviceTrustLevel.level === "trusted" ? (
                  <ShieldCheck className="w-6 h-6 text-success" />
                ) : deviceTrustLevel.level === "recognized" ? (
                  <Shield className="w-6 h-6 text-primary" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                )}
              </div>
            </div>
            <div className={`text-2xl font-bold mb-1 capitalize ${
              deviceTrustLevel.level === "trusted" 
                ? "text-success" 
                : deviceTrustLevel.level === "recognized"
                ? "text-primary"
                : "text-destructive"
            }`}>
              {deviceTrustLevel.level === "trusted" ? "Trusted" : 
               deviceTrustLevel.level === "recognized" ? "Recognized" : 
               "Potentially Risky"}
            </div>
            <div className="text-sm text-muted-foreground mb-3">Device Trust Level</div>
            
            {/* Trust Score Indicator */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Trust Score</span>
                <span className="font-medium">{deviceTrustLevel.score}/100</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    deviceTrustLevel.level === "trusted" 
                      ? "bg-success" 
                      : deviceTrustLevel.level === "recognized"
                      ? "bg-primary"
                      : "bg-destructive"
                  }`}
                  style={{ width: `${Math.min(deviceTrustLevel.score, 100)}%` }}
                />
              </div>
            </div>

            {/* Reasons */}
            {deviceTrustLevel.reasons.length > 0 && (
              <div className="space-y-1 mt-3">
                {deviceTrustLevel.reasons.slice(0, 2).map((reason, index) => (
                  <div key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                    <div className={`w-1 h-1 rounded-full ${
                      reason.includes("New") || reason.includes("First") 
                        ? "bg-destructive" 
                        : "bg-success"
                    }`} />
                    {reason}
                  </div>
                ))}
              </div>
            )}
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


