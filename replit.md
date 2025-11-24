# VoxelHub P2P Marketplace

## Overview

VoxelHub is a peer-to-peer marketplace connecting clients who need 3D printing services with makers who own 3D printers. The platform enables clients to upload STL files and specifications for their projects, while makers can browse available projects and submit competitive bids. The system features real-time notifications, dual user experiences (client/maker), and comprehensive project management workflows.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React with TypeScript, using Vite as the build tool and development server.

**UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. The design system uses a "New York" style variant with custom color schemes and spacing tokens.

**State Management**: TanStack Query (React Query) handles all server state with aggressive caching strategies (staleTime: Infinity by default). No global client state management library - component-level state with React hooks.

**Routing**: Wouter for lightweight client-side routing. Routes are split by user type (client vs. maker) with authentication guards.

**Form Handling**: React Hook Form with Zod schema validation, integrated with shadcn/ui form components.

**Real-time Updates**: WebSocket connection for live notifications about new bids, project status changes, and messages. Automatically reconnects on disconnect.

**Chat Interface**: Split-view chat page (Wallapop/Milanuncios style) with conversation list sidebar on left and chat window on right. Features:
- Conversation list with search filter, user avatars, last message preview, timestamps, unread badges
- Chat window with message grouping by date, sender/receiver differentiation, message timestamps
- Auto-scroll to latest messages, mark-as-read functionality
- Support for both project-based and marketplace design chats
- Messages refetch every 2 seconds for near real-time updates

### Backend Architecture

**Runtime**: Node.js with Express.js server framework using TypeScript and ESM modules.

**Development vs. Production**: 
- Dev mode uses Vite middleware for hot module replacement
- Production serves pre-built static assets from dist/public
- Separate entry points (index-dev.ts vs. index-prod.ts)

**Authentication**: Replit Auth (OIDC-based) with Passport.js strategy. Session-based authentication using express-session with PostgreSQL session store (connect-pg-simple).

**API Design**: RESTful endpoints under `/api` namespace. WebSocket server mounted at `/ws` for real-time features.

**Database Access**: Drizzle ORM with connection pooling via @neondatabase/serverless. Schema-first approach with TypeScript type inference.

**Storage Layer**: Abstraction pattern with IStorage interface defining all database operations, implemented in storage.ts. Supports users, projects, bids, maker profiles, and messages.

### Data Architecture

**Database**: PostgreSQL (configured for Neon serverless)

**Schema Design**:
- **users**: Core user table with email, name, profile image, userType enum (client/maker)
- **makerProfiles**: Extended profile for makers with printer capabilities, materials, ratings
- **projects**: Client-uploaded projects with STL files, specifications, status workflow
- **bids**: Maker offers on projects with price, delivery time, status
- **messages**: Direct messaging between users
- **sessions**: Session storage (required for Replit Auth)

**Key Relationships**:
- User → MakerProfile (one-to-one, optional)
- User → Projects (one-to-many as client)
- User → Bids (one-to-many as maker)
- Project → Bids (one-to-many)
- Messages: bidirectional User relationships

**Enums**: 
- userType: client, maker
- printerType: FDM, SLA, SLS
- projectStatus: active, reserved, completed
- bidStatus: pending, accepted, rejected

### Authentication & Authorization

**Strategy**: Session-based auth with Replit's OIDC provider. User session stored in PostgreSQL with 7-day TTL.

**User Flow**:
1. Unauthenticated users redirected to `/api/login`
2. After OAuth flow, user record created/updated in database
3. New users must select userType (client/maker) via UserTypeSelector
4. Makers required to complete profile before accessing maker features

**Route Protection**: Custom `isAuthenticated` middleware checks session, handles 401 responses on client with redirect to login.

**WebSocket Auth**: Users register with WebSocket server using userId from session after connection established.

### Real-time Features

**Implementation**: Native WebSocket (ws library) with connection registry mapping userId to WebSocket instances.

**Event Types**:
- `new_bid`: Notifies clients when makers submit bids
- `bid_accepted`: Notifies makers when their bid is accepted
- `bid_rejected`: Notifies makers when their bid is rejected
- `new_message`: Real-time chat notifications

**Client Behavior**: Auto-reconnect with exponential backoff, automatic query invalidation on relevant events.

### Design System

**Typography**: Inter font family from Google Fonts with weight variants (300-700).

**Color System**: HSL-based with CSS custom properties for theme support. Separate light/dark mode variables defined in index.css.

**Component Patterns**:
- Card-based layouts for projects and bids
- Badge system for status indicators and metadata
- Empty states with icons and CTAs
- Skeleton loaders for async content
- Modal dialogs for forms and confirmations

**Responsive Design**: Mobile-first approach with Tailwind breakpoints (md, lg). Grid layouts collapse to single column on mobile.

## Recent Changes (Nov 24, 2025)

### Bug Fix #1: Chat Parsing in getConversationsWithUnread()
- **Issue**: Conversation keys with multiple `::` delimiters weren't parsed correctly, breaking marketplace design chats
- **Root Cause**: Using `split('::')` without limit returned 3 elements for keys like `partnerId::design::designId`, but destructuring only took 2
- **Solution**: Replaced with `indexOf()` + `substring()` to correctly extract partnerId and full contextKey
- **Impact**: ✅ Makers now see all conversations for marketplace designs

### Bug Fix #2: React Key Warnings + Selection Issues
- **Issue**: Two conversations with same user (one project, one marketplace design) caused "two children with the same key" warning and couldn't switch between them
- **Root Cause**: Keys were only `userId` instead of unique combinations; selection was too coarse-grained
- **Solution**: 
  - Changed keys to: `${userId}-${projectId || ''}-${designId || ''}`
  - Changed state from `selectedUserId` to `selectedConvKey` (object with userId, projectId, designId)
  - Updated matching logic to compare all three fields
- **Impact**: ✅ Perfect UI state management for same-user multiple conversations

### New Chat UI - Wallapop/Milanuncios Style
- **New Components**:
  - `ChatListItem.tsx`: Individual conversation item with avatar, username, preview, timestamp, unread badge
  - `ChatWindow.tsx`: Chat display with date grouping, sender/receiver differentiation, timestamps
  - `chats-split.tsx`: Split-view page with sidebar (conversations) + main (chat)
- **Features**:
  - Search conversations by username/email/message content
  - Real-time updates (3-second refetch)
  - Auto-scroll to latest messages
  - Mark-as-read functionality
  - Responsive design for mobile
  - Works for both project-based and marketplace design chats

## External Dependencies

### Third-party Services

**Replit Auth**: OAuth 2.0 / OIDC authentication provider. Requires `ISSUER_URL`, `REPL_ID`, and `SESSION_SECRET` environment variables.

**Neon Database**: Serverless PostgreSQL database. Requires `DATABASE_URL` environment variable with WebSocket support enabled.

### Key Libraries

**Frontend**:
- @tanstack/react-query: Server state management
- wouter: Client-side routing
- react-hook-form + @hookform/resolvers: Form handling
- zod: Runtime schema validation
- date-fns: Date formatting and manipulation
- @radix-ui/*: Unstyled accessible UI primitives
- tailwindcss: Utility-first CSS framework

**Backend**:
- express: Web framework
- passport + openid-client: Authentication
- drizzle-orm: Database ORM
- drizzle-zod: Schema to Zod validator generation
- ws: WebSocket server
- express-session: Session management
- connect-pg-simple: PostgreSQL session store

**Development**:
- vite: Build tool and dev server
- tsx: TypeScript execution
- esbuild: Production bundling
- @replit/vite-plugin-*: Replit-specific dev tools

### Environment Configuration

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `ISSUER_URL`: Replit Auth OIDC issuer (defaults to https://replit.com/oidc)
- `REPL_ID`: Replit application identifier
- `SESSION_SECRET`: Secret for session signing
- `NODE_ENV`: development | production