# Homepage Blank Screen Debug Guide

## Issue
Homepage appears blank after login, but works fine when logged out.

## Fixes Applied
1. ✅ Changed SignIn.tsx to use client-side navigation instead of hard reload
2. ✅ Fixed PendingDeals.tsx to use `/api/auth/user` instead of `/api/user`

## Potential Remaining Issues

### 1. Browser Cache
**Problem**: Old JavaScript bundle cached in browser  
**Solution**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### 2. Deployment Not Complete
**Problem**: Railway still deploying changes  
**Solution**: Wait 2-3 minutes and refresh

### 3. API Endpoints Failing
The following API calls happen on the homepage when logged in:

#### Navbar Component
- `/api/messages` - Fetches messages for unread count
- `/api/user/credits` - Fetches user credits

#### Home Component
- `/api/users/top-rated` - Fetches top sellers
- `/api/auth/user` - Fetches current user
- `/api/listings/search` or `/api/listings` - Fetches listings

#### PendingDeals Component
- `/api/auth/user` - Fetches current user (FIXED)
- `/api/transactions/pending` - Fetches pending transactions

### 4. React Query Error Handling
**Problem**: If any query throws an error without proper error handling, it might break rendering  
**Solution**: Add error boundaries or better error handling to queries

## Debugging Steps

### Step 1: Check Browser Console
1. Open browser console (F12)
2. Look for errors (red text)
3. Share the errors with me

### Step 2: Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Look for failed requests (red, 404, 500 status codes)
5. Share which endpoints are failing

### Step 3: Check Railway Logs
1. Go to Railway dashboard
2. Click on your project
3. Check deployment logs
4. Look for errors during startup

### Step 4: Test API Endpoints Manually
Open browser console and run:
```javascript
// Test each endpoint
fetch('/api/auth/user').then(r => r.json()).then(console.log);
fetch('/api/messages').then(r => r.json()).then(console.log);
fetch('/api/user/credits').then(r => r.json()).then(console.log);
fetch('/api/listings').then(r => r.json()).then(console.log);
fetch('/api/transactions/pending').then(r => r.json()).then(console.log);
```

## Quick Fixes to Try

### Fix 1: Clear All Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Fix 2: Incognito/Private Mode
1. Open incognito/private window
2. Login again
3. Check if homepage loads

### Fix 3: Different Browser
Try a different browser to rule out browser-specific issues

## Next Steps

If the issue persists after:
- Hard refresh
- Waiting for deployment
- Clearing cache

Then we need to:
1. Add error boundaries to prevent crashes
2. Add better error handling to all queries
3. Make queries more fault-tolerant with proper fallbacks

