import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider, useUser } from "@/contexts/UserContext";
import Login from "./pages/Login";
import Challenge from "./pages/Challenge";
import Feed from "./pages/Feed";
import Ranking from "./pages/Ranking";
import Diary from "./pages/Diary";
import Running from "./pages/Running";
import Weight from "./pages/Weight";
import CalendarPage from "./pages/CalendarPage";
import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { currentUser } = useUser();

  if (!currentUser) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <>
      <TopBar />
      <Routes>
        <Route path="/" element={<Navigate to="/challenge" replace />} />
        <Route path="/challenge" element={<Challenge />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/running" element={<Running />} />
        <Route path="/weight" element={<Weight />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="bottom-center" />
      <UserProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
