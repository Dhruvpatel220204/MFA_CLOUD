import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, Activity, AlertTriangle, ArrowLeft } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAttempts: 0,
    failedAttempts: 0,
    activeSessions: 0,
  });
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !data) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      fetchStats();
      fetchRecentAttempts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  };

  const fetchStats = async () => {
    try {
      const { count: totalAttempts } = await supabase
        .from("login_attempts")
        .select("*", { count: "exact", head: true });

      const { count: failedAttempts } = await supabase
        .from("login_attempts")
        .select("*", { count: "exact", head: true })
        .eq("success", false);

      const { count: activeSessions } = await supabase
        .from("user_sessions")
        .select("*", { count: "exact", head: true });

      setStats({
        totalUsers: 0,
        totalAttempts: totalAttempts || 0,
        failedAttempts: failedAttempts || 0,
        activeSessions: activeSessions || 0,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from("login_attempts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentAttempts(data || []);
    } catch (error: any) {
      console.error("Error fetching attempts:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-7xl mx-auto pt-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Monitor system security and activity</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            User Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Login Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">{stats.totalAttempts}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-2xl font-bold">{stats.failedAttempts}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">{stats.activeSessions}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalAttempts > 0
                  ? Math.round(((stats.totalAttempts - stats.failedAttempts) / stats.totalAttempts) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>Recent Login Attempts</CardTitle>
            <CardDescription>Monitor recent authentication activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{attempt.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(attempt.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={attempt.success ? "default" : "destructive"}>
                    {attempt.success ? "Success" : "Failed"}
                  </Badge>
                </div>
              ))}
              {recentAttempts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No login attempts recorded yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
