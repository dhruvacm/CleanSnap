import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import AppRoutes from "@/routes/AppRoutes";

const queryClient = new QueryClient();
export default function App(){return <QueryClientProvider client={queryClient}><AuthProvider><TooltipProvider><Toaster/><Sonner/><BrowserRouter><AppRoutes/></BrowserRouter></TooltipProvider></AuthProvider></QueryClientProvider>}
