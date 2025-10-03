# SellFast.Now Design Guidelines

## Design Approach
**Reference-Based (Utility-Focused)**: Drawing inspiration from Facebook Marketplace and Craigslist's modern redesigns, emphasizing intuitive browsing, quick scanning, and efficient transactions.

## Core Design Principles
1. **Scan-First Interface**: Users should quickly identify relevant listings
2. **Trust & Transparency**: Clear pricing, seller info, and listing details
3. **Efficient Transactions**: Streamlined path from browse to contact
4. **Mobile Optimization**: Touch-friendly targets, thumb-zone CTAs

## Color Palette

**Light Mode (Primary)**
- Primary: 216 91% 60% (blue-600 #2563EB)
- Secondary: 20 91% 48% (orange-600 #EA580C)
- Background: 210 40% 98% (slate-50 #F8FAFC)
- Surface: 0 0% 100% (white)
- Text Primary: 222 47% 11% (slate-900 #0F172A)
- Text Secondary: 215 20% 35% (slate-600)
- Success: 160 84% 39% (emerald-600 #059669)
- Border: 214 32% 91% (slate-200 #E2E8F0)
- Hover: 217 91% 95% (blue-50)

**Dark Mode**
- Background: 222 47% 11% (slate-900)
- Surface: 217 33% 17% (slate-800)
- Text Primary: 210 40% 98% (slate-50)
- Border: 217 33% 25% (slate-700)

## Typography
**Fonts**: Inter (primary), system-ui (fallback)

- Hero Headline: 48px/1.1, weight-800 (mobile: 36px)
- Page Title: 32px/1.2, weight-700 (mobile: 24px)
- Section Heading: 24px/1.3, weight-600 (mobile: 20px)
- Card Title: 18px/1.4, weight-600
- Body: 16px/1.6, weight-400
- Small: 14px/1.5, weight-400
- Label: 14px/1.4, weight-500
- Price: 24px/1.2, weight-700 (listings)

## Layout System
**Spacing Scale**: Use Tailwind units 2, 4, 6, 8, 12, 16, 20, 24

- Container max-width: 1280px (max-w-7xl)
- Page padding: px-4 (mobile), px-8 (tablet), px-16 (desktop)
- Section spacing: py-12 (mobile), py-20 (desktop)
- Card gaps: gap-4 (mobile), gap-6 (desktop)
- Component spacing: Standard 16px between elements

**Grid Layouts**
- Listings: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Categories: grid-cols-2 md:grid-cols-4 lg:grid-cols-6
- Featured: grid-cols-1 lg:grid-cols-2
- Messages: Single column with max-w-4xl

## Component Library

### Navigation
- Fixed top navbar (h-16) with logo, search bar, and user menu
- Search bar: Central position on desktop, expandable on mobile
- Category pills: Horizontal scroll, sticky below navbar
- User dropdown: Avatar (40px), name, notifications badge

### Hero Section
- Height: 60vh (mobile), 70vh (desktop)
- Background: Gradient overlay on marketplace image showing diverse items
- Content: Centered headline + search bar + category shortcuts
- CTA: "Post Your Ad" button (orange secondary color, large)

### Listing Cards
- Aspect ratio: 4:3 image at top
- Image: Object-cover with hover scale (1.05)
- Content padding: p-4
- Border: 1px solid border color, rounded-lg (8px)
- Shadow: Subtle on hover (shadow-md)
- Info: Image → Price (prominent) → Title → Location → Time posted
- Quick actions: Favorite icon (top-right overlay)

### Filters Panel
- Sidebar on desktop (w-64), drawer on mobile
- Sections: Category, Price Range, Location, Condition
- Each filter: mb-6 spacing
- Apply button: Sticky at bottom (orange)

### Messaging Interface
- Split layout: List (1/3) + Thread (2/3) on desktop
- Stacked on mobile
- Message bubbles: Primary color (sent), slate-100 (received)
- Input: Fixed at bottom with attachment icon

### Forms (Post Ad)
- Single column, max-w-2xl centered
- Image upload: Drag-drop zone, 200px height, dashed border
- Field spacing: mb-6
- Labels: mb-2, weight-500
- Inputs: h-12, rounded-md, border-slate-200
- Textarea: min-h-32
- Submit button: Full-width on mobile, w-auto on desktop

### User Dashboard
- Tab navigation: My Listings | Messages | Favorites
- Stats cards: 3-column grid showing active/sold/views
- Action buttons: Edit (ghost), Delete (outline-destructive)

### Authentication
- Modal overlay: Centered card, max-w-md
- Toggle: Login ↔ Register
- Social login: Google, GitHub buttons with icons
- Form: Email, password fields with show/hide toggle

## Images

**Hero Background**: Collage-style image showing various marketplace items (electronics, furniture, clothing) with vibrant, inviting composition. Apply dark gradient overlay (from bottom) for text readability.

**Empty States**: Use simple illustrations for:
- No listings found (magnifying glass)
- No messages (envelope)
- No favorites (heart outline)

**Listing Placeholders**: Gray background with icon when no image uploaded

**Category Icons**: Use Heroicons for category representation in pills and filters

## Interactive Elements

**Buttons**
- Primary: bg-primary, text-white, h-12, px-6, rounded-md
- Secondary: bg-secondary, text-white, h-12, px-6, rounded-md
- Outline: border-2, border-primary, text-primary, bg-transparent
- Ghost: hover:bg-slate-100, text-slate-700
- On images: Use blur backdrop (backdrop-blur-sm bg-white/80)

**Cards**: Transition transform 200ms on hover, cursor pointer

**Inputs**: Focus ring (2px blue-500 offset), transition 150ms

**Links**: text-primary, underline-offset-4, hover:underline

## Responsive Breakpoints
- Mobile: < 768px (single column, stacked navigation)
- Tablet: 768px - 1024px (2-column grids)
- Desktop: > 1024px (full layouts, sidebars visible)

## Accessibility
- Contrast ratio: 4.5:1 minimum for text
- Focus indicators: Visible 2px outline
- Touch targets: Minimum 44px height
- Alt text: Required for all listing images
- Keyboard navigation: Tab order logical, skip links provided

## Performance
- Lazy load images below fold
- Thumbnail optimization: 400x300px for cards
- Icon library: Heroicons via CDN
- Limit animations: Only on hover/click, no auto-play