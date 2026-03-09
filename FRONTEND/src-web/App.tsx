import { AuthPage } from "@/pages/auth-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { SessionBootScreen } from "@/components/layout/session-boot-screen";
import { useAuth } from "@/contexts/auth-context";

function App() {
  const { isAuthenticated, isSessionReady } = useAuth();

  if (!isSessionReady) {
    return <SessionBootScreen />;
  }

  return isAuthenticated ? <DashboardPage /> : <AuthPage />;
}

export default App;
