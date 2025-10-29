# Image Rotation Feature Implementation Plan

## Overview
Add rotate button to all images (upload, drafts, editing) that rotates 90° clockwise and persists rotation state.

## State Management Changes

### 1. Add rotation state
```typescript
const [imageRotations, setImageRotations] = useState<number[]>([]);
// Array of rotation angles (0, 90, 180, 270) matching uploadedImages indices
```

### 2. Rotation helper function
```typescript
const rotateImage = (index: number) => {
  setImageRotations(prev => {
    const newRotations = [...prev];
    newRotations[index] = ((newRotations[index] || 0) + 90) % 360;
    return newRotations;
  });
};
```

### 3. Initialize rotations when images are uploaded
```typescript
// When uploadedImages changes, ensure imageRotations array matches length
useEffect(() => {
  setImageRotations(prev => {
    const newRotations = [...prev];
    while (newRotations.length < uploadedImages.length) {
      newRotations.push(0);
    }
    return newRotations.slice(0, uploadedImages.length);
  });
}, [uploadedImages.length]);
```

## UI Changes

### 1. Add RotateIcon import
```typescript
import { RotateCw } from "lucide-react";
```

### 2. Add rotate button to image thumbnails

**Location 1: Simple mode image list (line ~2705)**
```tsx
<div className="relative w-24 h-24 rounded overflow-hidden flex-shrink-0">
  <img 
    src={img} 
    alt={`Photo ${index + 1}`} 
    className="w-full h-full object-cover transition-transform"
    style={{ transform: `rotate(${imageRotations[index] || 0}deg)` }}
  />
  {/* Existing delete button */}
  <Button
    type="button"
    size="icon"
    variant="destructive"
    className="absolute top-1 right-1 h-6 w-6"
    onClick={() => removeImage(index)}
  >
    <X className="h-3 w-3" />
  </Button>
  {/* NEW: Rotate button */}
  <Button
    type="button"
    size="icon"
    variant="secondary"
    className="absolute bottom-1 right-1 h-6 w-6"
    onClick={() => rotateImage(index)}
    title="Rotate 90°"
  >
    <RotateCw className="h-3 w-3" />
  </Button>
</div>
```

**Location 2: Per-photo forms (line ~2232)**
```tsx
<div className="w-32 h-32 flex-shrink-0 relative">
  <img 
    src={imageUrl} 
    alt={`Photo ${photoIndex + 1}`} 
    className="w-full h-full object-cover rounded-lg transition-transform"
    style={{ transform: `rotate(${imageRotations[photoIndex] || 0}deg)` }}
  />
  <Button
    type="button"
    size="icon"
    variant="secondary"
    className="absolute bottom-2 right-2 h-8 w-8"
    onClick={() => rotateImage(photoIndex)}
    title="Rotate 90°"
  >
    <RotateCw className="h-4 w-4" />
  </Button>
</div>
```

## Persistence

### 1. Save rotation with listing
Add `imageRotations` field to listing schema or store in metadata

### 2. Load rotation when editing
When loading existing listing, restore `imageRotations` state

### 3. Apply rotation to final image
Option A: CSS transform only (client-side display)
Option B: Server-side image rotation (permanent)

**Recommendation: Start with CSS transform (Option A)**
- Faster implementation
- No image processing overhead
- Can add server-side rotation later if needed

## Files to Modify

1. `/client/src/pages/PostAdEnhanced.tsx` - Add rotation state and buttons
2. `/shared/schema.ts` - Add imageRotations field to listing schema (optional)
3. `/server/routes/listings.ts` - Store/retrieve rotation data (if persisting)

## Testing Checklist

- [ ] Upload images and rotate them
- [ ] Rotation persists when switching between photos
- [ ] Rotation saved in drafts
- [ ] Rotation loads when editing existing listing
- [ ] Rotation displays correctly on listing detail page
- [ ] Multiple rotations work (90°, 180°, 270°, 360°/0°)
- [ ] Rotation works on mobile

