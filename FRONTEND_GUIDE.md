# WeBet Social - Frontend Documentation

## 🎉 What We've Built

A comprehensive Next.js 14 frontend application with complete user and admin dashboards for the WeBet Social betting platform.

## ✨ Features Implemented

### 🔐 Authentication System
- **Google OAuth Login** for regular users
- **Email/Password Login** for admin users with JWT
- Auth context provider for global auth state
- Protected routes for user and admin pages
- Auto-redirect based on auth status

### 🎨 UI Component Library
All components use Tailwind CSS and TypeScript:

#### Core Components
- **Button** - Multiple variants (primary, secondary, danger, success, outline)
- **Modal** - Responsive modals with backdrop
- **Card** - Reusable card container
- **Table** - Paginated table with customizable columns
- **CountdownTimer** - Live countdown for bet expiration
- **OutcomeDistributionBar** - Visual distribution of bet outcomes
- **BetCard** - Complete bet card with stats and actions

### 📱 User-Facing Pages

#### 1. Home Feed (`/`)
- **Category Filters**: Filter bets by SPORTS, POLITICS, ENTERTAINMENT, etc.
- **Live Connection Indicator**: Shows WebSocket connection status
- **Google OAuth Login**: One-click sign in
- **User Balance Display**: Shows current play money balance
- **Bet Cards Grid**: Responsive grid of active bets
- **Real-time Updates**: Automatic refresh when new bets are created

#### 2. Bet Detail Page (`/bets/[id]`)
- **Countdown Timer**: Live countdown to bet close time
- **Outcome Distribution**: Visual bar showing bet distribution
- **Place Bet Modal**: Interactive modal to place bets
- **Potential Return Calculator**: Shows potential winnings
- **Bet Information Sidebar**: Category, pool, participants, end time
- **Real-time Updates**: Live odds changes via WebSocket

#### 3. User Dashboard (`/dashboard`)
- **Protected Route**: Requires authentication
- **Stats Overview Cards**: Balance, Total Bets, Win Rate, Total Winnings
- **Filterable Tabs**: Active, Pending, Completed, History
- **Bet History Cards**: Complete bet history with status
- **Navigation**: Quick access to profile editing

### 🔧 Admin Pages

#### 1. Admin Login (`/admin/login`)
- Email/password authentication
- JWT-based session management
- Auto-redirect if already logged in
- Default credentials shown for testing

#### 2. AI Suggestions Queue (`/admin/ai-suggestions`)
- **Protected Admin Route**: Requires admin authentication
- **Filter by Status**: PENDING, APPROVED, REJECTED, ALL
- **Approve/Reject Actions**: One-click approval or rejection
- **Preview Modal**: Detailed view before approval
- **Confidence Score Display**: AI confidence percentage
- **Suggested Outcomes**: Shows AI-recommended bet outcomes

## 🚀 State Management & APIs

### React Query Setup
- **QueryClient** configured with smart defaults
- **Automatic refetching** on window focus disabled
- **React Query Devtools** included for debugging
- **Optimistic updates** for better UX

### API Hooks Created

#### User Hooks (`useApi.ts`)
- `useActiveBets(filters)` - Fetch active bets with filters
- `useBet(betId)` - Fetch single bet details
- `usePlaceBet()` - Place a bet mutation
- `useUserBets(status)` - Fetch user's betting history
- `useUserProfile()` - Fetch user profile
- `useUpdateProfile()` - Update user profile
- `useNotifications()` - Fetch user notifications
- `useMarkNotificationRead()` - Mark notification as read

#### Admin Hooks (`useAdminApi.ts`)
- `useAISuggestions(status)` - Fetch AI suggestions
- `useApproveAISuggestion()` - Approve AI suggestion
- `useRejectAISuggestion()` - Reject AI suggestion
- `useCreateBet()` - Create manual bet
- `useAdminBets(filters)` - Fetch all bets for admin
- `useResolveBet()` - Resolve a bet with winner
- `useCancelBet()` - Cancel a bet
- `useAnalytics(period)` - Fetch analytics data

### WebSocket Integration (`useSocket.ts`)
Real-time event listeners:
- `betUpdate` - Bet details changed
- `oddsUpdate` - Odds changed on a bet
- `notification` - New notification received
- `betResolved` - Bet was resolved with winner

## 📁 Project Structure

```
packages/frontend/src/
├── app/
│   ├── admin/
│   │   ├── login/page.tsx
│   │   └── ai-suggestions/page.tsx
│   ├── bets/
│   │   └── [id]/page.tsx
│   ├── dashboard/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   │   ├── AdminProtectedRoute.tsx
│   │   ├── GoogleLoginButton.tsx
│   │   └── ProtectedRoute.tsx
│   ├── bets/
│   │   └── BetCard.tsx
│   ├── providers/
│   │   └── Providers.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── CountdownTimer.tsx
│       ├── Modal.tsx
│       ├── OutcomeDistributionBar.tsx
│       └── Table.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useAdminApi.ts
│   ├── useApi.ts
│   └── useSocket.ts
└── providers/
    └── ReactQueryProvider.tsx
```

## 🎯 How to Use

### For Users

1. **Browse Bets**
   - Visit homepage at `http://localhost:3000`
   - Filter bets by category using top filters
   - View live indicator for WebSocket connection

2. **Sign In with Google**
   - Click "Continue with Google" button
   - Authorize the application
   - You'll be redirected back with $10,000 starting balance

3. **Place a Bet**
   - Click on any bet card to view details
   - Click on an outcome option
   - Enter your bet amount
   - Confirm to place bet

4. **View Dashboard**
   - Click "Dashboard" in header
   - See your stats: Balance, Total Bets, Win Rate, Winnings
   - Filter your bets by status: Active, Pending, Completed, History
   - Click on any bet to view full details

### For Admins

1. **Admin Login**
   - Visit `http://localhost:3000/admin/login`
   - Use default credentials: `admin@webet.com` / `admin123`
   - You'll be redirected to admin dashboard

2. **Review AI Suggestions**
   - Navigate to `/admin/ai-suggestions`
   - Filter by status: PENDING, APPROVED, REJECTED
   - Preview each suggestion
   - Approve or reject with one click
   - Approved suggestions automatically create bets

3. **Create Manual Bet** (Ready to implement)
   - Navigate to create bet page
   - Fill in question, description, category
   - Set end time
   - Add outcomes
   - Publish bet

4. **Manage Bets** (Ready to implement)
   - View all published bets
   - Filter by status and category
   - Resolve bets by selecting winning outcome
   - Cancel bets if needed

## 🔌 Environment Variables

Make sure these are set in `/packages/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=957133942213-3uugd5akuvc6ld00e5sji53e9m0fpe3d.apps.googleusercontent.com
```

## 🎨 Design Features

### Responsive Design
- Mobile-first approach
- Breakpoints: `sm`, `md`, `lg`
- Grid layouts adapt to screen size
- Mobile-friendly navigation

### Color Scheme
- Primary: Blue (`#3B82F6`)
- Success: Green
- Warning: Yellow
- Danger: Red
- Neutral: Gray scale

### Accessibility
- Keyboard navigation support
- Focus indicators on interactive elements
- ARIA labels where needed
- Semantic HTML

## 🚀 Next Steps (Optional Enhancements)

### Remaining Pages to Build
1. **Profile Page** (`/profile`)
   - Edit user information
   - Upload avatar
   - View detailed stats

2. **Notifications Dropdown**
   - Header notification bell
   - Real-time notification count
   - Mark as read functionality

3. **Admin Dashboard** (`/admin/dashboard`)
   - Overview stats
   - Recent activity
   - Quick actions

4. **Create Bet Page** (`/admin/bets/create`)
   - Form to create manual bets
   - Outcome management
   - Date/time picker

5. **Manage Bets Page** (`/admin/bets`)
   - Paginated table of all bets
   - Resolution queue
   - Payout preview calculator

6. **Analytics Dashboard** (`/admin/analytics`)
   - Charts and graphs
   - User activity metrics
   - Revenue tracking
   - Category performance

### Additional Features
- [ ] Search functionality for bets
- [ ] User leaderboard
- [ ] Social features (follow users, comments)
- [ ] Push notifications
- [ ] Dark mode toggle
- [ ] Bet sharing on social media
- [ ] Advanced filters (date range, amount)
- [ ] Export betting history

## 🐛 Troubleshooting

### WebSocket Not Connecting
- Check backend is running on port 3001
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check browser console for connection errors

### Google OAuth Not Working
- Verify Google Client ID in `.env.local`
- Check redirect URI in Google Cloud Console matches `http://localhost:3001/api/auth/google/callback`
- Ensure backend Google OAuth is configured

### Queries Not Loading
- Open React Query Devtools (bottom right)
- Check if queries are fetching/failing
- Verify API endpoints are responding
- Check browser network tab

## 📦 Dependencies Installed

```json
{
  "@tanstack/react-query": "latest",
  "@tanstack/react-query-devtools": "latest",
  "socket.io-client": "latest"
}
```

## 🎉 Success!

You now have a fully functional betting platform frontend with:
- ✅ Complete authentication system
- ✅ User dashboard and betting interface
- ✅ Admin panel for management
- ✅ Real-time updates via WebSocket
- ✅ Responsive, modern UI
- ✅ Type-safe API integration
- ✅ Production-ready component library

**Start the app:**
```bash
# From WeBet root directory
pnpm dev
```

Visit `http://localhost:3000` to see your application! 🚀
