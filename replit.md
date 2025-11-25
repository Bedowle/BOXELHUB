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

### Backend
- **Runtime**: Node.js with Express.js (TypeScript, ESM).
- **Authentication**: Replit Auth (OIDC-based) with Passport.js and express-session (PostgreSQL session store).
- **API Design**: RESTful endpoints (`/api`), WebSocket server (`/ws`).
- **Database Access**: Drizzle ORM with connection pooling (@neondatabase/serverless).

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
    - `sliceEstimates`: Temporary slice previews for makers to estimate pricing without STL access (stores parameters and results, never G-code).
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

#### Maker Slicing Preview System (NEW)
- **Purpose**: Allow makers to estimate pricing by slicing with their own parameters without accessing the STL file
- **Security Model**: STL remains on server, never exposed to frontend during slicing
- **Slicing Engine**: `server/slicingEngine.ts` calculates realistic estimates based on STL geometry and parameters
- **Endpoints**:
  - `POST /api/projects/:id/slice-estimate` - Create slice estimate with parameters
  - `GET /api/projects/:id/slice-estimates` - Retrieve estimates for a project
- **Parameters**: Nozzle temperature, bed temperature, layer height, infill density, print speed
- **Results**: Estimated weight, time, layers, material used (never G-code)
- **UI**: SliceEstimator component in maker project details, interactive sliders for parameter adjustment
- **Access Control**: Only makers with pending bids can request estimates

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

### Key Libraries
- **Frontend**: `@tanstack/react-query`, `wouter`, `react-hook-form`, `zod`, `date-fns`, `@radix-ui/*`, `tailwindcss`.
- **Backend**: `express`, `passport`, `openid-client`, `drizzle-orm`, `drizzle-zod`, `ws`, `express-session`, `connect-pg-simple`.
- **Development**: `vite`, `tsx`, `esbuild`, `@replit/vite-plugin-*`.

### Environment Configuration
- `DATABASE_URL`
- `ISSUER_URL`
- `REPL_ID`
- `SESSION_SECRET`
- `NODE_ENV`

## Recent Changes (Nov 25, 2025)

### Implemented Maker Slicing Preview System
- **New Table**: `sliceEstimates` for storing temporary slice previews
- **Backend Engine**: `server/slicingEngine.ts` - intelligent slicing estimates without G-code exposure
- **Endpoints**: POST/GET slice estimates with parameter-based estimation
- **Frontend Component**: `SliceEstimator.tsx` with interactive parameter controls
- **Integration**: Added to maker project details for pending bids
- **Security**: STL remains protected on server, only statistics returned to frontend

### Fixed "Mis Proyectos Ganados" Page
- Changed filter to show ALL won projects (completed + in-progress)
- Previously excluded completed projects, now shows all projects with accepted bids

### Privacy System
- Added `showFullName` boolean field to users table
- Removed email from all profile displays (usernames always visible)
- Added privacy toggle in profile edit forms (clients and makers)
- Database synchronized with `npm run db:push`
