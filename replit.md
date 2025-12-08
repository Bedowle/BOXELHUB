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
- **Authentication**: Session-based with express-session and PostgreSQL session store (connect-pg-simple).
- **API Design**: RESTful endpoints (`/api`), WebSocket server (`/ws`).
- **Database Access**: Drizzle ORM with connection pooling.

### Data Architecture
- **Database**: PostgreSQL (supports Neon serverless, Render, Vercel, or any PostgreSQL provider).
- **Schema**:
    - `users`: Core user data, `userType` enum (client/maker).
    - `makerProfiles`: Maker-specific details (printer capabilities, materials, ratings, payout configuration).
    - `projects`: Client projects (STL files, specifications, status workflow).
    - `bids`: Maker offers (price, delivery time, status).
    - `messages`: Direct messaging.
    - `sessions`: Session storage for express-session.
    - `marketplaceDesigns`: STL designs uploaded by makers for sale (free, fixed price, or minimum price).
    - `designPurchases`: Purchase transactions tracking (who bought what, payment status).
    - `makerEarnings`: Earnings with retention periods (7 days for Stripe/PayPal, 15 days for bank transfers).
    - `makerPayouts`: Payout requests/history (pending, processing, completed, failed status).
- **Relationships**: One-to-many relationships between users and projects/bids/designs/earnings/payouts, one-to-one (optional) for user to maker profile.
- **Enums**: `userType`, `printerType`, `projectStatus`, `bidStatus`, `payoutMethod` (stripe, paypal, bank).

### Authentication & Authorization
- **Strategy**: Session-based with express-session storing sessions in PostgreSQL.
- **User Flow**: Registration with email/password, email verification, login, `userType` selection, maker profile completion for full access.
- **Route Protection**: `requireAuth` middleware for session validation.
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
- **Marketplace Design STL Upload & Purchase System**: Enables makers to upload STL files and clients to purchase/download them. Supports free, fixed, and minimum pricing models. Includes access control, download validation, and checkout integration (e.g., Stripe/PayPal).
- **Unread Bids Badge System**: Displays unread bid counts for active/reserved projects, updates in real-time via WebSocket, and clears upon project access.
- **Maker Payout System with Retention**: 
  - **Payout Methods**: Three options (Stripe, PayPal, Bank Transfer).
  - **Retention Periods**: Stripe/PayPal: 7 days, Bank Transfer: 15 days (to prevent fraud/chargebacks).
  - **Bank Transfer Minimum**: €10.00 minimum, below which balance stays in VoxelHub account for future purchases.
  - **Balance Management**: Total balance = all earnings, Available balance = earnings after retention period.
  - **Configuration**: Makers set payout method and contact info (email for Stripe/PayPal, IBAN for bank) in profile.
  - **Endpoints**: 
    - `GET /api/maker/balance` - Fetch total and available balance.
    - `POST /api/maker/payout-method` - Configure payout method.
    - `GET /api/maker/payouts` - View payout history.
    - `POST /api/maker/request-payout` - Request payout (after retention period expires).

## External Dependencies

### Third-party Services
- **PostgreSQL Database**: Any PostgreSQL provider (Neon, Render, Vercel, AWS RDS, etc.).

### Key Libraries
- **Frontend**: `@tanstack/react-query`, `wouter`, `react-hook-form`, `zod`, `date-fns`, `@radix-ui/*`, `tailwindcss`.
- **Backend**: `express`, `express-session`, `connect-pg-simple`, `drizzle-orm`, `drizzle-zod`, `ws`, `bcryptjs`.
- **Development**: `vite`, `tsx`, `esbuild`.

## Deployment Configuration

### Required Environment Variables
For all deployments (development, staging, production):

- `DATABASE_URL` - PostgreSQL connection string (e.g., `postgresql://user:password@host:port/dbname`)
- `SESSION_SECRET` - Random string for signing session cookies (generate with: `openssl rand -base64 32`)
- `NODE_ENV` - `development` or `production`
- `PORT` - Server port (default: 5000)

### Optional Environment Variables
- `PUBLIC_URL` - Public URL for email verification links (default: `http://localhost:5000`)

### Build Steps
1. Install dependencies: `npm install`
2. Create database schema: `npm run db:push`
3. Build frontend: `npm run build`
4. Start production server: `npm run start`

### Deployment Platforms
The application is fully portable and can be deployed to:
- **Render**: Set environment variables in dashboard, deploy with `npm run build` as build command and `npm run start` as start command.
- **Vercel**: Node.js compatible environment with environment variables configured.
- **Railway**: Direct PostgreSQL integration available.
- **Fly.io**: Standard Node.js deployment.
- **Traditional VPS**: Install Node.js and PostgreSQL, set environment variables, run `npm run build && npm run start`.

### Recent Changes (Dec 8, 2025)
- Added express-session with PostgreSQL backend (connect-pg-simple) for proper session management
- Removed Replit-specific dependencies and plugins
- Made vite.config.ts portable (removed Replit plugins)
- Cleaned up app.ts to remove stripe-replit-sync dependency (optional Stripe integration)
- Application now works on any Node.js + PostgreSQL platform
