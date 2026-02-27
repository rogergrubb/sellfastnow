import { Switch, Route } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
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
import Notifications from "./pages/Notifications";
import MobileUpload from "./pages/MobileUpload";
import PaymentSuccess from "./pages/PaymentSuccess";
import ListingPaymentSuccess from "./pages/ListingPaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import Admin from "./pages/Admin";
import AdminMigration from "./pages/AdminMigration";
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
import PartnerStorefront from "./pages/PartnerStorefrontEnhanced";
import PartnerOnboarding from "./pages/PartnerOnboarding";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerBulkUpload from "./pages/PartnerBulkUpload";
import Categories from "./pages/Categories";
import Resources from "./pages/Resources";
import RealtorsPage from "./pages/business/Realtors";
import EstateSalesPage from "./pages/business/EstateSales";
import LiquidatorsPage from "./pages/business/Liquidators";
import AiListingsPage from "./pages/sell/AiListings";
import PricingPage from "./pages/sell/Pricing";
import HowItWorksPageSell from "./pages/sell/HowItWorks";
import NavbarHover from "@/components/NavbarHover";
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
      <Route path="/auth/login" component={SignInPage} />
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
      <Route path="/listing-payment-success" component={ListingPaymentSuccess} />
      <Route path="/payment/cancel" component={PaymentCancel} />
      <Route path="/admin/migration" component={AdminMigration} />
      <Route path="/admin" component={Admin} />
      <Route path="/credits" component={Credits} />
      <Route path="/settings" component={Settings} />
      <Route path="/messages" component={Messages} /> {/* Using MessagesNew with WebSocket and conversation grouping */}
      <Route path="/notifications" component={Notifications} />
      <Route path="/pay/:sessionId" component={PaymentPage} />
      <Route path="/payment/:transactionId" component={Payment} />
      <Route path="/meetup/:id" component={SellerMeetupPage} />
      <Route path="/saved-searches" component={SavedSearches} />
      <Route path="/sms-settings" component={SmsSettings} />
      <Route path="/seller-analytics" component={SellerAnalytics} />
      <Route path="/bulk-edit" component={BulkEdit} />
      <Route path="/collections/:batchId" component={Collection} />
      <Route path="/partner/onboard" component={PartnerOnboarding} />
      <Route path="/partner/dashboard" component={PartnerDashboard} />
      <Route path="/partner/bulk-upload" component={PartnerBulkUpload} />
      <Route path="/partner/:domain" component={PartnerStorefront} />
      <Route path="/business/realtors" component={RealtorsPage} />
      <Route path="/business/estate-sales" component={EstateSalesPage} />
      <Route path="/business/liquidators" component={LiquidatorsPage} />
      <Route path="/sell/ai-listings" component={AiListingsPage} />
      <Route path="/sell/pricing" component={PricingPage} />
      <Route path="/sell/how-it-works" component={HowItWorksPageSell} />
      <Route path="/categories" component={Categories} />
      <Route path="/resources" component={Resources} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  
  // Get current user for notifications
  const { data: user } = useQuery({
    queryKey: ["/api", "auth", "user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
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
  
  // Show referral modal after login (once per user, persisted)
  useEffect(() => {
    if (user?.id && !hasShownModal) {
      // Check if user has seen the modal ever (using localStorage with user-specific key)
      const hasSeenModal = localStorage.getItem(`referral_modal_shown_${user.id}`);
      
      if (!hasSeenModal) {
        // Delay showing modal by 2 seconds after login to let page settle
        const timer = setTimeout(() => {
          setShowReferralModal(true);
          setHasShownModal(true);
          localStorage.setItem(`referral_modal_shown_${user.id}`, 'true');
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user, hasShownModal]);

  return (
    <div className="min-h-screen bg-background">
      <NavbarHover />
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
