import { createRoot } from "react-dom/client";
import { ClerkProvider } from '@clerk/clerk-react';
import App from "./App";
import "./index.css";
import { clerkConfig } from "../../clerk.config";

const envKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isValidKey = envKey && envKey.startsWith('pk_');
const publishableKey = isValidKey ? envKey : clerkConfig.publishableKey;

if (!publishableKey) {
  throw new Error("Missing Clerk Publishable Key");
}

// Get current domain from browser - this works for any Replit URL
const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';

// Configure allowed redirect origins for Clerk
const allowedRedirectOrigins = currentDomain ? [currentDomain] : [];

createRoot(document.getElementById("root")!).render(
  <ClerkProvider 
    publishableKey={publishableKey}
    allowedRedirectOrigins={allowedRedirectOrigins}
  >
    <App />
  </ClerkProvider>
);
