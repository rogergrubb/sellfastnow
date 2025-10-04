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

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={publishableKey}>
    <App />
  </ClerkProvider>
);
