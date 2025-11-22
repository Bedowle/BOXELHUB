# VoxelHub P2P Marketplace - Design Guidelines

## Design Approach

**Reference-Based: Marketplace Pattern**
Drawing inspiration from established P2P marketplaces like Fiverr, Upwork, and Airbnb, with emphasis on trust-building, clear user flows, and professional service presentation. The design prioritizes functional clarity for two distinct user journeys (Client vs Maker) while maintaining visual consistency.

## Core Design Principles

1. **Dual Identity System**: Clear visual differentiation between Client and Maker experiences while maintaining brand coherence
2. **Trust & Transparency**: Prominent display of ratings, reviews, maker credentials, and project details
3. **Action-Oriented**: Every screen guides users toward the next logical step in the marketplace flow
4. **Real-Time Feedback**: Visual indicators for live updates, new bids, and project status changes

## Typography

**Font Family**: Inter (Google Fonts)
- **Headings**: Inter Bold (700) - 32px to 48px for page titles, 24px for section headers
- **Subheadings**: Inter Semibold (600) - 18px to 20px
- **Body**: Inter Regular (400) - 16px for primary text, 14px for metadata
- **Small Text**: Inter Medium (500) - 12px for labels, tags, timestamps

**Hierarchy**: Clear size differentiation between heading levels. Maintain 1.5 line-height for body text, 1.2 for headings.

## Layout System

**Spacing Primitives**: Consistent use of Tailwind units: 2, 4, 6, 8, 12, 16, 20, 24 for padding/margins. Use px-4 to px-8 for container padding, py-6 to py-12 for section spacing, gap-4 to gap-6 for grid gaps.

**Grid Patterns**:
- Project cards: 3-column grid on desktop (lg:grid-cols-3), 2-column on tablet (md:grid-cols-2), single column on mobile
- Bid listings: Full-width cards with internal multi-column layout for bid details
- Dashboard sections: 12-column flexible grid for complex layouts

**Container Max-Widths**: max-w-7xl for main content areas, max-w-4xl for forms and focused content, max-w-2xl for chat interfaces

## Component Library

### Navigation
- **Navbar**: Fixed top navigation with logo left, user menu right. Different CTAs for logged-in vs logged-out states. Client sees "Upload Project", Maker sees "Browse Projects"
- **Sidebar Navigation** (Dashboards): Vertical navigation for Client/Maker dashboards with icons and labels. Active state with accent background and bold text

### Cards & Lists
- **Project Card**: Image placeholder/preview area, title, material badge, bid count, timestamp. Hover elevates with shadow transition
- **Bid Card**: Horizontal layout with maker avatar left, details center (price, delivery time, rating), action buttons right. Border on hover, subtle background change
- **Maker Profile Card**: Avatar, name, rating stars, printer capabilities as icon badges, "View Profile" CTA

### Forms & Inputs
- **Project Upload Form**: Multi-step wizard with progress indicator. File upload with drag-drop zone, text inputs for specifications, material selector dropdown
- **Bid Submission Form**: Price input (with currency symbol), delivery time selector, message textarea
- **Maker Registration**: Extended form with sections for business info, equipment details, material inventory checkboxes

### Status Indicators
- **Project Status Badges**: Pill-shaped badges with rounded-full class. "Active" in blue, "Reserved" in green, "Completed" in gray
- **Real-time Indicators**: Pulsing dot animation for new bids, notification badges with count
- **Filter Chips**: Removable filter tags with x icon for active filters

### Actions & CTAs
- **Primary Actions**: Full-width or prominent buttons in blue-600 with white text, rounded-lg
- **Secondary Actions**: Border buttons in blue-600 with transparent background
- **Destructive Actions**: Red-600 for reject/delete actions

### Chat Interface
- **Message Bubbles**: Client messages aligned right with blue background, Maker messages left with gray background
- **Input Area**: Fixed bottom textarea with send button, file attachment option
- **Conversation List**: Sidebar showing active chats with last message preview and unread count

### Data Display
- **Rating Display**: Yellow star icons (filled/half-filled/empty) with numerical rating and review count
- **Statistics Dashboard**: Grid of metric cards showing active projects, total bids, earnings (for makers)
- **History Timeline**: Chronological list with date separators, project thumbnails, status indicators

## Color Palette (Blue-Purple Gradient Theme)

While specific color values will be defined later, the design uses a blue-to-purple gradient as the primary brand expression in hero sections and key CTAs. Additional accent colors distinguish project states and user roles.

## Images

**Hero Section**: Large, full-width hero image showcasing 3D printed objects in use or a maker working with a 3D printer. Overlay with gradient (blue-to-purple) at 60% opacity for text legibility. Hero CTAs have blurred backgrounds for visibility.

**Project Cards**: Each project displays a placeholder thumbnail (320x240) representing the STL file or final print preview.

**Maker Profiles**: Avatar images for makers, optional background image for profile headers.

**Empty States**: Friendly illustrations for "No projects yet", "No bids received" screens.

## Landing Page Structure

1. **Hero Section**: Full-width with background image, gradient overlay, centered headline ("Connect with expert 3D printing makers"), dual CTAs ("I need printing" / "I'm a maker")
2. **How It Works**: 3-column section with icons explaining the process for clients
3. **Active Projects Preview**: Grid showcasing 6 recent projects to demonstrate activity
4. **For Makers Section**: Benefits of joining as a maker, registration CTA
5. **Trust Indicators**: Stats (makers registered, projects completed, average rating)
6. **Footer**: Multi-column with links, contact info, social media

## Dashboard Layouts

**Client Dashboard**:
- Top metrics bar: Active Projects, Pending Bids, Accepted Offers
- "Upload New Project" prominent CTA card
- Grid of active projects with real-time bid count updates
- Quick access to history and settings in sidebar

**Maker Dashboard**:
- Top metrics: Active Bids, Won Projects, Earnings This Month
- "Browse Projects" CTA
- Active bids section (max 2 shown prominently)
- Recommended projects feed based on maker capabilities
- Sidebar with profile completion status and quick actions

## Interactions & Animations

**Minimal, Purposeful Animations**:
- Card hover: Subtle translate-y and shadow increase (transition-all duration-300)
- New bid notification: Brief scale animation on notification badge
- Project state change: Fade transition when moving between Active/Reserved
- Form submission: Loading spinner replaces button text
- Chat messages: Slide-in animation for new messages

**No Complex Animations**: Avoid page transitions, scroll-triggered effects, or decorative animations that distract from core functionality.

## Accessibility

- Consistent focus states with ring-2 ring-blue-500 for all interactive elements
- Form labels always visible, not placeholder-dependent
- ARIA labels for icon-only buttons
- Sufficient color contrast ratios throughout
- Keyboard navigation support for all critical flows

## Responsive Breakpoints

- **Mobile (default)**: Single column layouts, stacked navigation, full-width cards
- **Tablet (md: 768px)**: 2-column grids, expanded navigation, side-by-side forms
- **Desktop (lg: 1024px)**: Full multi-column layouts, persistent sidebars, 3-column grids

This marketplace prioritizes clarity, trust, and efficiency—enabling clients to quickly find makers and makers to efficiently submit competitive bids. Every design decision supports the core flow: upload project → receive bids → accept offer.