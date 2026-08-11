# PulseNews AI — Security Architecture

## 1. Security Overview

PulseNews AI implements defense-in-depth security with multiple layers: network (Nginx), application (Express middleware), data (RLS + Firestore rules), and AI (output validation).

---

## 2. Authentication

### 2.1 Firebase Auth (Google OAuth)

```
User clicks "Sign in with Google"
    │
    ▼
Firebase Auth handles OAuth flow
    │
    ▼
Client receives Firebase ID Token (JWT)
    │
    ├──> Token stored in memory (not localStorage — XSS protection)
    │
    └──> Token sent in Authorization header for API calls
         Authorization: Bearer <firebase_id_token>
              │
              ▼
         Backend middleware verifies token with Firebase Admin SDK
              │
              ├──> Valid: extract uid, attach to request
              └──> Invalid: return 401 Unauthorized
```

### 2.2 Token Lifecycle

| Property | Value |
|----------|-------|
| Token type | Firebase ID Token (JWT) |
| Lifetime | 1 hour (Firebase default) |
| Refresh | Firebase SDK auto-refreshes in background |
| Storage | In-memory only (not persisted to localStorage) |
| Transmission | HTTPS only — never over plain HTTP |

### 2.3 Public vs Authenticated Endpoints

| Endpoint | Auth Required | Rationale |
|----------|--------------|-----------|
| `GET /api/digest/today` | No | Public feed — visible to all users |
| `POST /api/quiz/submit` | Yes | Must track user's quiz history |
| `POST /api/user/bookmark` | Yes | Must associate bookmark with user |
| `GET /api/user/profile` | Yes | Must return only the requesting user's data |
| `POST /api/ai/*` | Yes | AI generation is rate-limited per user |
| `POST /api/news/*` | No (future: Yes) | Open News Studio is public during beta |
| Socket.io connection | No (future: Yes) | Public real-time feed |

---

## 3. Authorization (RBAC)

### 3.1 Role Definitions

| Role | Permissions | Assignment |
|------|------------|------------|
| `anonymous` | Read public feed, view live streams | Default (no sign-in) |
| `user` | All anonymous + bookmarks, quiz, AI tutor, PDF download | Any authenticated user |
| `admin` | All user + QC review queue, user management, system metrics, prompt management | Manually assigned in Firestore |

### 3.2 Role Storage

```
Firestore: users/{uid}
{
  role: "user" | "admin",
  email: string,
  display_name: string,
  created_at: timestamp,
  quizzes_solved: number,
  accuracy: number,
  total_questions: number
}
```

### 3.3 Role Check Middleware

```typescript
const requireRole = (role: string) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: "Unauthorized" });
    if (req.user.role !== role && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    next();
  };
};

// Usage:
app.post("/api/admin/review", requireAuth, requireRole("admin"), handler);
```

---

## 4. Data Security

### 4.1 PostgreSQL Row Level Security (RLS)

Every table in Supabase has RLS enabled with per-user policies:

```sql
-- Users can only access their own bookmarks
CREATE POLICY "select_own_bookmarks" ON bookmarks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_bookmarks" ON bookmarks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
```

**Public tables (knowledge_objects, sources, live_streams):**

```sql
-- Anyone can read published knowledge objects
CREATE POLICY "select_published_kos" ON knowledge_objects
  FOR SELECT TO anon, authenticated USING (reviewed = true);
```

### 4.2 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own profile
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }

    // Users can only access their own bookmarks
    match /users/{userId}/bookmarks/{bookmarkId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Users can only access their own chat history
    match /users/{userId}/chats/{chatId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Users can only access their own quiz history
    match /users/{userId}/quiz_history/{quizId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### 4.3 Column-Level Security

Columns that users must never control directly:

| Table | Column | Protection |
|-------|--------|-----------|
| `users` | `role` | Set only via admin function, not client write |
| `knowledge_objects` | `exam_importance` | AI-set, not user-editable |
| `knowledge_objects` | `reviewed` | Admin-only update |
| `knowledge_objects` | `is_breaking` | System-set, not user-editable |
| `quiz_submissions` | `score` | Server-calculated, not client-submitted |

---

## 5. API Security

### 5.1 Rate Limiting

| Endpoint Group | Rate Limit | Implementation |
|----------------|-----------|----------------|
| `POST /api/ai/*` | 10 requests/minute per user | Redis counter (future) / in-memory |
| `GET /api/*` | 100 requests/minute per user | Nginx limit_req |
| `POST /api/quiz/submit` | 20 requests/minute per user | Express middleware |
| Socket.io events | 5 events/second per socket | Socket.io rate limiter |

### 5.2 Input Validation

Every API endpoint validates input before processing:

| Input Type | Validation | Rejection |
|-----------|------------|-----------|
| String fields | Max length, no HTML tags | 400 Bad Request |
| URL fields | Must be valid http(s) URL | 400 Bad Request |
| Topic fields | Alphanumeric + spaces, max 200 chars | 400 Bad Request |
| MCQ answers | Must be 0-3 integer | 400 Bad Request |
| JSON body | Must parse as valid JSON | 400 Bad Request |

### 5.3 CORS Policy

```typescript
// Development
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Production (future)
const corsOptionsProd = {
  origin: ["https://pulsenews.ai", "https://www.pulsenews.ai"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
```

---

## 6. Secrets Management

### 6.1 Secret Inventory

| Secret | Where Used | Exposed to Client? |
|--------|-----------|-------------------|
| `GEMINI_API_KEY` | Backend only (server.ts) | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend only (migrations) | No |
| `SUPABASE_ANON_KEY` | Frontend + Backend | Yes (designed to be public) |
| `FIREBASE_API_KEY` | Frontend + Backend | Yes (Firebase API key is safe to expose) |
| `NEWSDATA_API_KEY` | Backend only | No |
| `GNEWS_API_KEY` | Backend only | No |

### 6.2 Secret Handling Rules

1. **Backend secrets** are read from `process.env` at startup — never written to disk
2. **Client-safe keys** (Supabase anon, Firebase API key) are injected via Vite environment variables
3. **No secrets in git** — `.env` is gitignored, `.env.example` has placeholder values only
4. **CI/CD secrets** are stored in GitHub Actions secrets, injected as environment variables at build time
5. **Key rotation** — If any key is compromised, rotate via provider console and update CI/CD secrets

### 6.3 Client-Side Key Safety

The Supabase anon key and Firebase API key are designed to be public-facing. Security is enforced by:

- **Supabase RLS** — Anon key can only access data allowed by RLS policies
- **Firestore Rules** — Firebase API key alone doesn't grant data access; auth UID is checked
- **No privileged operations from client** — Service role key is never sent to the browser

---

## 7. OWASP Top 10 Mitigation

| OWASP Risk | Mitigation |
|-----------|------------|
| **A01: Broken Access Control** | RLS on all tables, Firebase UID check in Firestore rules, role middleware on admin endpoints |
| **A02: Cryptographic Failures** | HTTPS only in production, Firebase handles JWT signing, no homemade crypto |
| **A03: Injection** | Parameterized queries (Supabase client), no raw SQL from user input, input validation |
| **A04: Insecure Design** | Modular architecture, defense in depth, threat modeling per volume |
| **A05: Security Misconfiguration** | `.env` gitignored, Nginx hardening, no default credentials |
| **A06: Vulnerable Components** | `npm audit` in CI, Dependabot alerts, locked versions in package-lock.json |
| **A07: Auth Failures** | Firebase OAuth (not homemade), token verification on every request, short token lifetime |
| **A08: Data Integrity Failures** | JWT verification via Firebase Admin SDK, no unsigned tokens accepted |
| **A09: Logging Failures** | All API requests logged with timestamp, UID, endpoint, response code |
| **A10: SSRF** | Server-side URL fetching (Open News Studio) validates URLs against allowlist, blocks internal IPs |

---

## 8. AI-Specific Security

### 8.1 Prompt Injection Prevention

| Risk | Mitigation |
|------|------------|
| User input in AI prompt | User text is wrapped in delimiters and labeled as "user input" |
| AI generating harmful content | Gemini has built-in safety filters; output is additionally validated |
| AI leaking system prompt | System prompt is never sent to client; only AI response is returned |
| AI accessing unauthorized data | RAG retrieves only from published (reviewed=true) knowledge objects |

### 8.2 AI Output Validation

Every AI response is validated before being shown to users:

```typescript
const validateAIQuickTake = (response: unknown): string[] => {
  if (!response || typeof response !== 'object') throw new Error('Invalid AI response');
  const data = response as { quick_take?: unknown };
  if (!Array.isArray(data.quick_take)) throw new Error('quick_take must be an array');
  if (data.quick_take.length !== 3) throw new Error('quick_take must have exactly 3 items');
  return data.quick_take.map((item, i) => {
    if (typeof item !== 'string') throw new Error(`quick_take[${i}] must be a string`);
    if (item.length > 200) return item.substring(0, 197) + '...';
    return item;
  });
};
```
