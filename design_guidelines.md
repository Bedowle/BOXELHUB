# VoxelHub P2P Marketplace - Design Guidelines

## Design Approach

**Reference-Based: Premium Marketplace Pattern**
Inspired by Linear's refined aesthetics, Stripe's professional restraint, and Airbnb's trust-building patterns. Emphasizes premium feel through generous whitespace, sophisticated typography hierarchy, and polished micro-interactions. Designed for dark mode with light mode compatibility.

## Core Design Principles

1. **Premium Positioning**: Elevated visual language distinguishing VoxelHub from commodity marketplaces
2. **Dual User Flows**: Client interface emphasizes control and overview; Maker interface optimizes for discovery and competitive positioning
3. **Real-Time Clarity**: Live bid updates with subtle animations, instant status changes
4. **Dark-First Design**: Optimized for dark mode with carefully calibrated contrast and accent usage

## Typography

**Font Family**: Inter (Google Fonts CDN)

**Hierarchy**:
- **Display Headlines**: Inter Bold (700) - 48px to 56px, tight leading (1.1), used sparingly for hero sections
- **Page Titles**: Inter Semibold (600) - 32px to 40px, leading 1.2
- **Section Headers**: Inter Semibold (600) - 24px, leading 1.3
- **Card Titles**: Inter Medium (500) - 18px to 20px
- **Body Text**: Inter Regular (400) - 16px, leading 1.6 for optimal readability
- **Metadata**: Inter Medium (500) - 14px for timestamps, counts, labels
- **Micro Copy**: Inter Medium (500) - 12px for badges, tooltips

**Letter Spacing**: Slight negative tracking (-0.02em) on headlines for premium feel, normal spacing for body text.

## Color System

### Core Palette
**Primary Gradient**: Blue (#3B82F6) to Purple (#8B5CF6) - used for hero backgrounds, primary CTAs, status highlights
**VoxelHub Orange**: #FF6B35 - logo accent, notification badges, active states
**Success Green**: #10B981 - accepted bids, completed states
**Warning Yellow**: #F59E0B - pending actions
**Error Red**: #EF4444 - rejected bids, destructive actions

### Dark Mode (Primary)
- **Background Base**: #0A0E1A (deep navy-black)
- **Surface Level 1**: #141B2E (cards, elevated elements)
- **Surface Level 2**: #1E2842 (hover states, nested cards)
- **Border Subtle**: #2D3A5C
- **Border Emphasis**: #3D4E73
- **Text Primary**: #F8FAFC (high contrast)
- **Text Secondary**: #94A3B8 (metadata, descriptions)
- **Text Tertiary**: #64748B (disabled, placeholders)

### Light Mode (Secondary)
- **Background Base**: #FFFFFF
- **Surface Level 1**: #F8FAFC
- **Surface Level 2**: #F1F5F9
- **Border Subtle**: #E2E8F0
- **Border Emphasis**: #CBD5E1
- **Text Primary**: #0F172A
- **Text Secondary**: #475569
- **Text Tertiary**: #94A3B8

## Layout System

**Spacing Scale**: Tailwind units 2, 4, 6, 8, 12, 16, 20, 24, 32, 40

**Application**:
- Component padding: p-6 to p-8
- Section spacing: py-12 to py-24
- Card gaps: gap-6
- Content max-width: max-w-7xl for dashboards, max-w-6xl for landing
- Form containers: max-w-2xl for focused input flows

**Grid Patterns**:
- Project cards: lg:grid-cols-3 md:grid-cols-2 grid-cols-1 with gap-6
- Dashboard metrics: grid-cols-3 for stat cards with gap-4
- Bid listings: Full-width with internal flex layout

## Component Library

### Navigation
**Main Navbar**: Fixed top, backdrop-blur-lg with 80% background opacity. Logo left (with orange accent), centered navigation links (Browse/Dashboard/Messages), user menu right with profile avatar. Client navbar shows "Upload Project" in gradient button; Maker shows "Browse Projects".

**Dashboard Sidebar**: Persistent left sidebar (w-64) with icon+label navigation. Active route gets gradient background with orange left border indicator.

### Cards & Containers
**Project Card**: Rounded-xl with border, hover elevates (translate-y-1) with enhanced border glow. Internal layout: thumbnail area (16:9 aspect ratio), title (truncate after 2 lines), material badge, bid count with pulsing indicator for new bids, timestamp.

**Bid Card**: Horizontal flex layout with maker avatar (48px rounded-full), name/rating stack, price in large semibold type, delivery time with clock icon, message preview (max 2 lines), action buttons aligned right.

**Stat Cards**: Dashboard metrics in cards with gradient borders. Large number display (32px bold), label below (14px text-secondary), subtle icon top-right.

### Forms & Inputs
**Styling**: All inputs with rounded-lg, border-emphasis in default state, focus ring-2 ring-blue-500 with ring-offset-2. Labels use text-secondary, positioned above input with mb-2.

**Project Upload**: Multi-step with progress dots indicator at top. Drag-drop zone with dashed border, file icon, "Drop STL file or click to upload" centered text.

**Bid Form**: Price input with large text (24px), currency symbol prefix. Delivery time slider with day markers. Message textarea with character count.

### Status & Feedback
**Badges**: Pill-shaped with px-3 py-1, rounded-full. Use gradient backgrounds for active states, solid for completed/inactive.

**Real-time Updates**: Notification dot (w-2 h-2) with animate-pulse on new bids. Toast notifications slide in from top-right with auto-dismiss.

**Loading States**: Skeleton screens with animated gradient shimmer for cards during data fetch. Button loading shows spinner with disabled state.

### Chat Interface
**Layout**: Split view with conversation list (w-80) on left, message area on right. Client messages use blue-purple gradient bubble aligned right, Maker messages use surface-level-2 aligned left. Fixed bottom input with rounded-full styling, attachment icon, send button.

## Images

### Hero Section
**Large Hero Image**: Full-width background image (min-h-[600px]) showing high-quality 3D printed object or maker workspace in action. Apply gradient overlay (blue-purple diagonal gradient at 70% opacity). Centered content with headline, subheadline, dual CTAs with blurred glass-morphism backgrounds.

### Project Thumbnails
Consistent 16:9 aspect ratio for all project preview images. Placeholder shows wireframe 3D object icon in center with gradient background. Display in project cards at 320px width.

### Maker Avatars
Circular profile images (48px in cards, 96px in profiles). Default avatar uses gradient background with initials in white.

### Empty States
Custom illustrations for "No projects yet" and "No bids" screens using blue-purple gradient elements. Center-aligned with supporting text and CTA below.

## Client vs Maker Interface Distinctions

### Client Dashboard
- **Metric Priority**: Active Projects (gradient card), Total Spent, Average Rating Received
- **Primary CTA**: "Upload New Project" in hero card with gradient background
- **Project Grid**: Shows client's projects with bid count badges, latest bid preview
- **Quick Actions**: View bids, accept offer, message maker
- **Accent Color**: Leans toward blue in gradients

### Maker Dashboard  
- **Metric Priority**: Active Bids (gradient card), Won Projects, Total Earnings
- **Primary CTA**: "Browse Projects" with filters visible
- **Project Feed**: Recommended based on capabilities, distance filters
- **Bid Management**: Active bids section with countdown timers, edit/withdraw options
- **Accent Color**: Leans toward purple in gradients

## Animations

**Minimal & Purposeful**:
- Card hover: translate-y-1 with border glow (duration-200)
- New bid: Scale pulse on notification badge (duration-500)
- Page transitions: Fade opacity only (duration-150)
- Skeleton loading: Shimmer gradient animation
- Button states: Scale-95 on active press

## Responsive Behavior

**Mobile (< 768px)**: 
- Collapse sidebar to bottom tab bar
- Single column grids
- Stack bid card elements vertically
- Simplified navbar with hamburger menu

**Tablet (768px - 1024px)**:
- Two-column project grids
- Condensed sidebar (icons only with tooltips)
- Horizontal bid cards maintained

**Desktop (≥ 1024px)**:
- Full multi-column layouts
- Persistent sidebars
- Expanded chat interface

## Accessibility

- All interactive elements have visible focus states with ring-2 ring-orange-500
- Form labels always visible above inputs
- ARIA labels for icon-only actions
- Color contrast meets WCAG AAA in dark mode, AA in light mode
- Keyboard shortcuts for primary actions (Upload: Cmd+U, Browse: Cmd+B)

This premium marketplace establishes VoxelHub as the sophisticated choice for serious 3D printing collaboration, with dark mode excellence and real-time marketplace dynamics.