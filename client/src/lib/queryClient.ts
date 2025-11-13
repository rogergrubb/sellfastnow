import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get Supabase auth token, refresh if needed
  let { data: { session } } = await supabase.auth.getSession();
  
  // Check if session is missing, has no token, or is expired/expiring soon
  const now = Math.floor(Date.now() / 1000);
  const isExpired = session?.expires_at ? session.expires_at <= now : true;
  const isExpiringSoon = session?.expires_at ? session.expires_at - now < 60 : true; // Refresh if less than 60 seconds left
  
  if (!session || !session.access_token || isExpired || isExpiringSoon) {
    console.log('Session invalid or expiring, refreshing...', {
      hasSession: !!session,
      hasToken: !!session?.access_token,
      isExpired,
      isExpiringSoon,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
    });
    
    const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Failed to refresh session:', error);
      throw new Error('Authentication required. Please sign in again.');
    }
    
    if (!refreshedSession?.access_token) {
      throw new Error('Failed to obtain valid session after refresh.');
    }
    
    session = refreshedSession;
    console.log('✅ Session refreshed successfully, new expiry:', new Date((session.expires_at || 0) * 1000).toISOString());
  }
  
  const token = session.access_token;
  
  if (!token) {
    throw new Error('No authentication token available. Please sign in.');
  }

  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get Supabase auth token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
