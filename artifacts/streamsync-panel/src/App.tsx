import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import { useGetMe, ApiError } from "@workspace/api-client-react";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import Servers from "@/pages/Servers";
import Packages from "@/pages/Packages";
import Resellers from "@/pages/Resellers";
import ServicePage from "@/pages/ServicePage";
import { setBaseUrl } from "@workspace/api-client-react";
import "@/lib/firebase";
import { useEffect } from "react";

if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

function handleUnauthorized(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    localStorage.removeItem("streamsync_token");
    queryClient.clear();
    window.location.href = "/";
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthorized }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) return false;
        return failureCount < 1;
      },
      staleTime: 30_000,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { token, login, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: me, isError } = useGetMe({
    query: { enabled: !!token, queryKey: ["auth/me"], refetchInterval: 30_000 },
  });

  useEffect(() => {
    if (me) {
      login(token!, me as any);
    }
  }, [me]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!token || isError) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <Layout>{children}</Layout>
    </AuthGate>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard">
        <ProtectedLayout><Dashboard /></ProtectedLayout>
      </Route>
      <Route path="/users">
        <ProtectedLayout><Users /></ProtectedLayout>
      </Route>
      <Route path="/servers">
        <ProtectedLayout><Servers /></ProtectedLayout>
      </Route>
      <Route path="/packages">
        <ProtectedLayout><Packages /></ProtectedLayout>
      </Route>
      <Route path="/resellers">
        <ProtectedLayout><Resellers /></ProtectedLayout>
      </Route>
      <Route path="/plex">
        <ProtectedLayout><ServicePage service="plex" /></ProtectedLayout>
      </Route>
      <Route path="/jellyfin">
        <ProtectedLayout><ServicePage service="jellyfin" /></ProtectedLayout>
      </Route>
      <Route path="/emby">
        <ProtectedLayout><ServicePage service="emby" /></ProtectedLayout>
      </Route>
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
