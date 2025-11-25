# VoxelHub P2P Marketplace

## Overview
VoxelHub is a peer-to-peer marketplace connecting clients needing 3D printing services with makers owning 3D printers. It facilitates clients uploading STL files and project specifications, and makers browsing projects to submit bids. The platform offers real-time notifications, distinct client and maker user experiences, and comprehensive project management workflows. The business vision is to create a dynamic marketplace for 3D printing services, fostering collaboration and efficient project execution.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Technology Stack**: React with TypeScript, Vite.
- **UI Framework**: shadcn/ui (Radix UI, Tailwind CSS) with a "New York" style variant and custom color schemes.
- **State Management**: TanStack Query for server state (aggressive caching), React hooks for component-level state.
- **Routing**: Wouter, with authentication guards and split routes by user type.
- **Form Handling**: React Hook Form with Zod validation.
- **Real-time Updates**: WebSocket for live notifications.
- **Chat Interface**: Split-view design with conversation list, search, avatars, unread badges, and a chat window featuring message grouping, timestamps, auto-scroll, and mark-as-read functionality. Supports project-based and marketplace design chats.
- **3D Visualization**: Three.js for STL rendering and interactive 3D model positioning.

### Backend
- **Runtime**: Node.js with Express.js (TypeScript, ESM).
- **Authentication**: Replit Auth (OIDC-based) with Passport.js and express-session (PostgreSQL session store).
- **API Design**: RESTful endpoints (`/api`), WebSocket server (`/ws`).
- **Database Access**: Drizzle ORM with connection pooling (@neondatabase/serverless).
- **Slicing Engine**: Slic3r CLI-based real 3D slicer running on server (generates actual G-code).

### Data Architecture
- **Database**: PostgreSQL (Neon serverless).
- **Schema**:
    - `users`: Core user data, `userType` enum (client/maker), `showFullName` field for privacy control.
    - `makerProfiles`: Maker-specific details (printer capabilities, materials, ratings, payout configuration).
    - `projects`: Client projects (STL files, specifications, status workflow).
    - `bids`: Maker offers (price, delivery time, status).
    - `messages`: Direct messaging.
    - `sessions`: For Replit Auth.
    - `marketplaceDesigns`: STL designs uploaded by makers for sale (free, fixed price, or minimum price).
    - `designPurchases`: Purchase transactions tracking (who bought what, payment status).
    - `makerEarnings`: Earnings with retention periods (7 days for Stripe/PayPal, 15 days for bank transfers).
    - `makerPayouts`: Payout requests/history (pending, processing, completed, failed status).
    - `sliceEstimates`: Real G-code generation results from Slic3r (stores parameters, G-code, and statistics).
- **Relationships**: One-to-many relationships between users and projects/bids/designs/earnings/payouts/sliceEstimates, one-to-one (optional) for user to maker profile.
- **Enums**: `userType`, `printerType`, `projectStatus`, `bidStatus`, `payoutMethod` (stripe, paypal, bank).

### Authentication & Authorization
- **Strategy**: Session-based with Replit's OIDC provider (7-day TTL).
- **User Flow**: Redirect to `/api/login`, user record creation/update, `userType` selection, maker profile completion for full access.
- **Route Protection**: `isAuthenticated` middleware for session validation.
- **WebSocket Auth**: User registration with WebSocket server post-session establishment.

### Real-time Features
- **Implementation**: Native WebSocket (`ws` library).
- **Event Types**: `new_bid`, `bid_accepted`, `bid_rejected`, `new_message`.
- **Client Behavior**: Auto-reconnect, automatic query invalidation.

### Design System
- **Typography**: Inter font family.
- **Color System**: HSL-based with CSS custom properties for light/dark mode.
- **Component Patterns**: Card-based layouts, badge system, empty states, skeleton loaders, modal dialogs.
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints.

### Feature Specifications

#### Privacy Controls
- **showFullName Field**: Boolean on users table (default false) allows users to control whether firstName/lastName are visible in profiles
- **Email Privacy**: Emails never shown in profiles or anywhere visible to other users
- **Username**: Always visible and clickable to navigate to user profiles
- **Implementation**: Both client and maker profile edit forms include privacy toggle

#### Interactive 3D Slicer Interface - IMPLEMENTED (TODAY)
- **Purpose**: Makers can use a full-featured interactive 3D slicer with Slic3r backend for real G-code generation
- **Security Model**: STL remains on server, never exposed to client. Slic3r runs on server backend. Only makers with pending bids can access.
- **UI Components**: 
  - `AdvancedSlicerInterface.tsx` - Complete interactive 3D slicer interface
  - Three.js 3D viewer with real-time model rendering
  - Auto-rotating preview with grid floor visualization
- **3D Viewer Features**:
  - Real-time STL visualization with proper lighting and shading
  - Interactive model rotation (auto-rotate by default)
  - Print bed visualization (XY plane grid)
  - Model auto-centering
- **Slicing Parameters**:
  - **Basic Parameters**: Nozzle temp (180-260°C), bed temp (20-110°C), layer height (0.1-0.4mm), infill density (0-100%), print speed (10-150mm/s)
  - **Advanced Parameters**: Wall thickness, nozzle diameter, filament diameter, retract distance/speed, first layer speed, top/bottom solid layers
  - **Support Parameters**: Support density control with density slider (5-50%)
- **Parameter Organization**: Three tabs - Basic, Advanced, Support for organized UI
- **G-code Generation**: Sends all parameters to backend Slic3r for real G-code generation
- **Download**: Users can download generated .gcode files directly
- **Access Control**: Only available when maker has pending bid on project (myBid.status === 'pending')
- **Backend Endpoint**: 
  - `POST /api/projects/:id/slice-estimate` - Generates real G-code with all parameters
  - `GET /api/projects/:id/slice-estimates` - Retrieves slice history
- **Database**: Stores G-code in `sliceEstimates.gcode` text field

#### Real Cloud Slicer (Slic3r Integration) - IMPLEMENTED
- **Purpose**: Makers can use Slic3r (industry standard) to generate actual G-code for projects without STL file access
- **Security Model**: STL remains on server, never exposed to client. Slic3r runs on server backend.
- **Slicing Engine**: `server/slicerService.ts` - CLI wrapper around Slic3r for real G-code generation
- **Results**: Real G-code, estimated weight, print time, layer count, material usage
- **Download**: G-code files can be downloaded directly from the UI

#### Marketplace Design STL Upload & Purchase System
- **Purpose**: Enables makers to upload STL files and clients to purchase/download them
- **Pricing Models**: Free, fixed price, minimum price
- **Access Control**: Download validation, purchase history tracking
- **Checkout Integration**: Stripe/PayPal support

#### Unread Bids Badge System
- **Display**: Unread bid counts for active/reserved projects
- **Real-time**: Updates via WebSocket
- **Clear**: Upon project access

#### Maker Payout System with Retention
- **Payout Methods**: Three options (Stripe, PayPal, Bank Transfer)
- **Retention Periods**: Stripe/PayPal: 7 days, Bank Transfer: 15 days (to prevent fraud/chargebacks)
- **Bank Transfer Minimum**: €10.00 minimum, below which balance stays in VoxelHub account for future purchases
- **Balance Management**: Total balance = all earnings, Available balance = earnings after retention period
- **Configuration**: Makers set payout method and contact info (email for Stripe/PayPal, IBAN for bank) in profile
- **Endpoints**: 
  - `GET /api/maker/balance` - Fetch total and available balance
  - `POST /api/maker/payout-method` - Configure payout method
  - `GET /api/maker/payouts` - View payout history
  - `POST /api/maker/request-payout` - Request payout (after retention period expires)

## External Dependencies

### Third-party Services
- **Replit Auth**: OAuth 2.0 / OIDC provider.
- **Neon Database**: Serverless PostgreSQL.

### System Tools
- **Slic3r**: Industry-standard open-source 3D slicer for real G-code generation.

### Key Libraries
- **Frontend**: `@tanstack/react-query`, `wouter`, `react-hook-form`, `zod`, `date-fns`, `@radix-ui/*`, `tailwindcss`, `three.js`.
- **Backend**: `express`, `passport`, `openid-client`, `drizzle-orm`, `drizzle-zod`, `ws`, `express-session`, `connect-pg-simple`.
- **Development**: `vite`, `tsx`, `esbuild`, `@replit/vite-plugin-*`.

### Environment Configuration
- `DATABASE_URL`
- `ISSUER_URL`
- `REPL_ID`
- `SESSION_SECRET`
- `NODE_ENV`

## Recent Changes (Nov 25, 2025 - LATEST)

### MAJOR: Complete Interactive 3D Slicer Interface (TODAY - FINAL)
- **New Component**: `AdvancedSlicerInterface.tsx` - Full-featured interactive slicer
- **3D Viewer**: Three.js-powered STL visualization with:
  - Real-time model rendering with Phong material and proper lighting
  - Auto-rotating preview for visual appeal
  - Print bed grid visualization (XY plane)
  - Proper model centering and bounding box calculation
- **Parameter Control**: Three-tab interface with 14+ adjustable parameters:
  - Basic: Temperature, layer height, infill, speed
  - Advanced: Wall thickness, retraction, first layer, solid layers
  - Support: Support density control
- **Slic3r Integration**: Real G-code generation with all parameters
- **Download**: Direct .gcode file download functionality
- **UI/UX**: Visual feedback, loading states, error handling
- **Replaced**: Old SliceEstimator with complete AdvancedSlicerInterface
- **Access**: Only for makers with pending bids on projects

### MAJOR: Integrated Real Slic3r Cloud Slicer (EARLIER TODAY)
- **Replaced**: Mock slicing estimations with REAL G-code generation
- **New File**: `server/slicerService.ts` - Full Slic3r CLI wrapper
- **System Tool**: Installed Slic3r package for real 3D slicing
- **Database**: Added `gcode` field to `sliceEstimates` table
- **Endpoint**: Updated POST `/api/projects/:id/slice-estimate` to use real Slic3r
- **Features**: 
  - Makers can now generate actual printable G-code
  - Download .gcode files directly from the UI
  - Real parameter support (temperatures, layer height, infill, speed)
  - STL stays on server for security

### Fixed STL Download Access Control
- STL download button only appears AFTER bid is accepted
- Previously was accessible during pending bid status

### Privacy System
- Added `showFullName` boolean field to users table
- Removed email from all profile displays (usernames always visible)
- Added privacy toggle in profile edit forms (clients and makers)
- Database synchronized with `npm run db:push`
