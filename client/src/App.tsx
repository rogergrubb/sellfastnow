import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "./pages/Home";
import PostAdEnhanced from "./pages/PostAdEnhanced";
import ListingDetail from "./pages/ListingDetail";
import Dashboard from "./pages/Dashboard";
import UserProfile from "./pages/UserProfile";
import TransactionHistory from "./pages/TransactionHistory";
import CreateReview from "./pages/CreateReview";
import Unsubscribe from "./pages/Unsubscribe";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import MobileUpload from "./pages/MobileUpload";
import Navbar from "@/components/Navbar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/post-ad" component={PostAdEnhanced} />
      <Route path="/listings/:id" component={ListingDetail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/users/:userId" component={UserProfile} />
      <Route path="/users/:userId/history" component={TransactionHistory} />
      <Route path="/create-review/:token" component={CreateReview} />
      <Route path="/unsubscribe" component={Unsubscribe} />
      <Route path="/mobile-upload/:sessionId" component={MobileUpload} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navbar />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
