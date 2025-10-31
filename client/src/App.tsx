import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import Collection from "@/pages/Collection";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import PostAdEnhanced from "./pages/PostAdEnhanced";
import ListingDetail from "./pages/ListingDetail";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import UserProfile from "./pages/UserProfile";
import TransactionHistory from "./pages/TransactionHistory";
import CreateReview from "./pages/CreateReview";
import Unsubscribe from "./pages/Unsubscribe";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import LocationSetup from "./pages/LocationSetup";
import Settings from "./pages/Settings";
import Messages from "./pages/MessagesNew";
import MobileUpload from "./pages/MobileUpload";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import Admin from "./pages/Admin";
import Credits from "./pages/Credits";
import PaymentPage from "./pages/PaymentPage";
import Payment from "./pages/Payment";
import SellerMeetupPage from "./pages/SellerMeetupPage";
import UserReviews from "./pages/UserReviews";
import SavedSearches from "./pages/SavedSearches";
import VerificationSettings from "./pages/VerificationSettings";
import SmsSettings from "./pages/SmsSettings";
import SellerAnalytics from "./pages/SellerAnalytics";
import BulkEdit from "./pages/BulkEdit";
import SearchPage from "./pages/SearchPage";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import Navbar from "@/components/Navbar";
import { NotificationManager } from "@/components/NotificationManager";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { setAnalyticsUser, clearAnalyticsUser } from "@/lib/analytics";
import { PostLoginReferralModal } from "@/components/PostLoginReferralModal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={SearchPage} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/location-setup" component={LocationSetup} />
      <Route path="/post-ad" component={PostAdEnhanced} />
      <Route path="/listings/:id" component={ListingDetail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/users/:userId" component={UserProfile} />
      <Route path="/users/:userId/history" component={TransactionHistory} />
      <Route path="/users/:userId/reviews" component={UserReviews} />
      <Route path="/verification" component={VerificationSettings} />
      <Route path="/create-review/:token" component={CreateReview} />
      <Route path="/unsubscribe" component={Unsubscribe} />
      <Route path="/mobile-upload/:sessionId" component={MobileUpload} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/cancel" component={PaymentCancel} />
      <Route path="/admin" component={Admin} />
      <Route path="/credits" component={Credits} />
      <Route path="/settings" component={Settings} />
      <Route path="/messages" component={Messages} /> {/* Using MessagesNew with WebSocket and conversation grouping */}
      <Route path="/pay/:sessionId" component={PaymentPage} />
      <Route path="/payment/:transactionId" component={Payment} />
      <Route path="/meetup/:id" component={SellerMeetupPage} />
      <Route path="/saved-searches" component={SavedSearches} />
      <Route path="/sms-settings" component={SmsSettings} />
      <Route path="/seller-analytics" component={SellerAnalytics} />
      <Route path="/bulk-edit" component={BulkEdit} />
      <Route path="/collections/:batchId" component={Collection} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  
  // Get current user for notifications
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
  });

  // Update analytics when user changes
  useEffect(() => {
    if (user?.id) {
      setAnalyticsUser(user.id, user.email || undefined);
    } else {
      clearAnalyticsUser();
    }
  }, [user]);
  
  // Show referral modal after login (once per session)
  useEffect(() => {
    if (user?.id && !hasShownModal) {
      // Check if user has seen the modal in this session
      const hasSeenModal = sessionStorage.getItem('referral_modal_shown');
      
      if (!hasSeenModal) {
        // Delay showing modal by 1 second after login
        const timer = setTimeout(() => {
          setShowReferralModal(true);
          setHasShownModal(true);
          sessionStorage.setItem('referral_modal_shown', 'true');
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user, hasShownModal]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Router />
      {user && <NotificationManager userId={user.id} />}
      <PostLoginReferralModal 
        isOpen={showReferralModal} 
        onClose={() => setShowReferralModal(false)} 
      />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
