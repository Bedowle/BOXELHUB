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
    - `users`: Core user data, `userType` enum (client/maker).
    - `makerProfiles`: Maker-specific details (printer capabilities, materials, ratings).
    - `projects`: Client projects (STL files, specifications, status workflow).
    - `bids`: Maker offers (price, delivery time, status).
    - `messages`: Direct messaging.
    - `sessions`: For Replit Auth.
- **Relationships**: One-to-many relationships between users and projects/bids, one-to-one (optional) for user to maker profile.
- **Enums**: `userType`, `printerType`, `projectStatus`, `bidStatus`.

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
- **Marketplace Design STL Upload & Purchase System**: Enables makers to upload STL files and clients to purchase/download them. Supports free, fixed, and minimum pricing models. Includes access control, download validation, and checkout integration (e.g., Stripe/PayPal).
- **Unread Bids Badge System**: Displays unread bid counts for active/reserved projects, updates in real-time via WebSocket, and clears upon project access.

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