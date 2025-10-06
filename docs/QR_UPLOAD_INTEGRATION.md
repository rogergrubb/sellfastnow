# QR Code Upload Integration Guide

## Overview
The QR code upload feature allows users to seamlessly transfer photos from their phone to the desktop browser for listing creation. This is particularly useful when users have photos on their phone but are filling out the listing form on desktop.

## Components

### 1. QRUploadWidget Component
**Location:** `client/src/components/QRUploadWidget.tsx`

**Props:**
```typescript
interface QRUploadWidgetProps {
  onImagesReceived: (imageUrls: string[]) => void;
}
```

**Usage Example:**
```typescript
import { QRUploadWidget } from "@/components/QRUploadWidget";

function MyComponent() {
  const handleImagesReceived = (imageUrls: string[]) => {
    console.log('Received images from phone:', imageUrls);
    // Add images to your state/form
  };

  return (
    <QRUploadWidget onImagesReceived={handleImagesReceived} />
  );
}
```

### 2. Mobile Upload Page
**Location:** `client/src/pages/MobileUpload.tsx`  
**Route:** `/mobile-upload/:sessionId`

This page is automatically opened when users scan the QR code from their phone. It provides a simple interface to upload photos from camera or gallery.

## How It Works

### Flow Diagram
```
Desktop User              Mobile User              Server
    |                          |                      |
    |-- Create Session ------->|                      |
    |<-- Session ID ----------|                      |
    |                          |                      |
    | Display QR Code          |                      |
    |                          |-- Scan QR Code ----->|
    |                          |                      |
    |                          |-- Upload Photos ---->|
    |<-- Poll for Images ------|<-- Store Images -----|
    |                          |                      |
    | Receive Images!          |                      |
    |                          |                      |
    |-- Cleanup Session ------>|                      |
```

### Implementation Details

1. **Session Creation:**
   - When QRUploadWidget mounts, it creates an upload session via `POST /api/upload-session/create`
   - Returns: `{ id, userId, images, expiresAt }`
   - Session expires after 30 minutes

2. **QR Code Display:**
   - Generates QR code containing URL: `{origin}/mobile-upload/{sessionId}`
   - User scans with phone camera app

3. **Mobile Upload:**
   - Phone opens `/mobile-upload/:sessionId` page
   - User uploads photos (using existing image upload infrastructure)
   - Photos stored in session via `POST /api/upload-session/:sessionId/upload`

4. **Polling:**
   - Desktop polls `GET /api/upload-session/:sessionId/images` every 2 seconds
   - When new images detected, triggers `onImagesReceived` callback
   - Shows toast notification to user

5. **Cleanup:**
   - On component unmount, sends authenticated `DELETE /api/upload-session/:sessionId`
   - Removes session from database
   - Prevents stale sessions

## API Endpoints

### POST /api/upload-session/create
Creates new upload session for authenticated user.

**Auth:** Required (Bearer token)  
**Response:**
```json
{
  "id": "abc123",
  "userId": "user_xyz",
  "images": [],
  "expiresAt": "2025-10-06T05:00:00Z"
}
```

### POST /api/upload-session/:id/upload
Adds images to existing session.

**Auth:** Required (Bearer token)  
**Body:**
```json
{
  "imageUrl": "https://cloudinary.com/..."
}
```

### GET /api/upload-session/:id/images
Retrieves current session images.

**Auth:** Required (Bearer token)  
**Response:**
```json
{
  "images": ["url1", "url2"]
}
```

### DELETE /api/upload-session/:id
Deletes upload session.

**Auth:** Required (Bearer token)

## Database Schema

```typescript
export const uploadSessions = pgTable("upload_sessions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  images: text("images").array().default([]),
  expiresAt: timestamp("expires_at").notNull(),
});
```

## Integration with PostAdEnhanced

To integrate QR upload into the listing creation page:

```typescript
// In PostAdEnhanced.tsx

// 1. Import the component
import { QRUploadWidget } from "@/components/QRUploadWidget";

// 2. Add callback handler
const handleQRImages = (imageUrls: string[]) => {
  // Add to existing images state
  setUploadedImages(prev => [...prev, ...imageUrls]);
  
  // Optionally trigger AI analysis on new images
  imageUrls.forEach(url => {
    analyzeImage(url);
  });
};

// 3. Add widget to UI (alongside existing upload)
<div className="grid md:grid-cols-2 gap-4">
  <div>
    {/* Existing drag-drop upload */}
    <FileDropZone />
  </div>
  <div>
    {/* QR code upload */}
    <QRUploadWidget onImagesReceived={handleQRImages} />
  </div>
</div>
```

## Security Considerations

- ✅ All endpoints require Bearer token authentication
- ✅ Users can only access their own sessions (userId check)
- ✅ Sessions expire after 30 minutes
- ✅ Automatic cleanup prevents session accumulation
- ✅ Images stored in Cloudinary with existing security settings

## Testing Notes

- Automated E2E testing is limited by Google OAuth bot detection
- Manual testing recommended:
  1. Open /post-ad on desktop
  2. Scan QR code with phone
  3. Upload photos from phone
  4. Verify desktop receives images
  5. Navigate away and check session cleanup

## Future Enhancements

- [ ] WebSocket support for instant updates (replace polling)
- [ ] Session reconnection if network drops
- [ ] Multi-device support (multiple phones to one desktop)
- [ ] Progress indicators for large uploads
- [ ] Manual cleanup job for expired sessions (cron)
