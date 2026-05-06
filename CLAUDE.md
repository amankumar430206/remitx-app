# CLAUDE.md — RemitX Mobile

## Project

White-label cross-border payment platform — Expo React Native app.
API lives at remitx-api/. Reference docs in parent folder (../01_PRD.md etc.)

## CURRENT_PHASE: 12A

## Stack

Expo SDK 52 · React Native 0.76 · TypeScript
React Navigation v6 (native-stack + bottom-tabs)
TanStack Query v5 · Zustand v4
expo-secure-store · expo-local-authentication
expo-notifications · expo-camera
Axios (shared JWT interceptor pattern from web)

## Absolute Rules

1. Tokens ONLY in expo-secure-store — NEVER AsyncStorage
2. Biometric check on every app resume (AppState: background → active)
3. Bottom tab navigation (5 tabs: Dashboard, Payments, Approve, Accounts, Settings)
4. Offline: check NetInfo, block payment initiation, show persistent banner
5. Deep links configured in app.json (scheme: remitx)
6. TypeScript strict mode — no `any`
7. All API calls via src/api/client.ts — no raw fetch/axios elsewhere
8. All data fetching via TanStack Query hooks in src/hooks/
9. Zustand stores in src/stores/ — no local state for server data
10. Elegant, premium fintech UI — dark navy palette, consistent spacing, polished UX

## API Contract (mirrors web exactly)

- Base URL: `EXPO_PUBLIC_API_URL` env var (default http://localhost:3000/api/v1)
- Auth header: `Authorization: Bearer <token>`
- Tenant header: `X-Tenant-Slug: <slug>`
- Response envelope: `{ success, data, meta?, error? }`
- Silent token refresh on 401 (same pattern as web client)

### Auth endpoints
- POST /auth/login → `{ accessToken, refreshToken, mfaRequired?, mfaChallengeToken?, user }`
- POST /auth/refresh → `{ accessToken, refreshToken }`
- POST /auth/mfa/challenge → `{ accessToken, refreshToken, user }`
- POST /auth/logout
- GET /auth/me → `{ id, email, name, role, kycStatus }`

### User shape (from web)
```typescript
interface AuthUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  tenant_id: string
  status: string
  kyc_status?: string
}
```

## Design System

**Color palette (dark-first):**
- Background: `#0A0E1A` (deep navy)
- Card: `#111827` (dark card)
- Surface: `#1C2333` (elevated surface)
- Primary: `#6366F1` (indigo)
- Success: `#10B981`
- Warning: `#F59E0B`
- Danger: `#EF4444`
- Text primary: `#F9FAFB`
- Text muted: `#9CA3AF`
- Border: `#1F2937`

**Typography:** System font stack, bold headings, muted subtitles
**Spacing:** 8px grid (4, 8, 12, 16, 20, 24, 32, 48)
**Border radius:** 12px cards, 8px inputs, 24px buttons
**Shadows:** Subtle elevation for cards

## Feature Flags (from web Phase 11)

Feature flags are stored in tenant config. Mobile should respect the same flags
(fetch from /tenants/:slug/config or /auth/me response). Same keys as web:
- `enable_kyc`, `enable_maker_checker`, `enable_fx_widget`, `enable_notifications`

## Phase

Read ../02_PHASES.md Phase 12A-12C for specs.
Read ../01_PRD.md Section 10 for mobile screen inventory.
