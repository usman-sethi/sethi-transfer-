# Sethi Transfer — Personal Cross-Device File Transfer Platform

A private, production-grade personal file-transfer web platform engineered with the clean, intuitive design philosophy of Google Drive and Google Photos. Sethi Transfer eliminates the friction of sending files through messaging apps, emails, or cables by providing a seamless, secure, cross-device bridge: upload from mobile, instantly view and preview or download on desktop.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural parameters were confirmed during Phase 1:
>
> - **Configuration Policy (Strict Mode)**: Cloudinary and MongoDB Atlas credentials will be strictly validated via environment variables. If configuration is missing, the backend returns clear diagnostic health checks and the UI guides the user on required credentials (`MONGODB_URI`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) with zero mock data substitution.
> - **Cross-Device Authentication Flow**: Standard, secure account-based authentication (Registration, Argon2-hashed passwords, short-lived JWT access tokens, HttpOnly/secure refresh token rotation). Sign in on mobile, sign in on laptop, and files synchronize instantaneously.
> - **Data Zero-State**: The system starts with a pristine, unseeded database. New users register their private account and upload their own files with realistic empty states, exactly as in production Google Workspace.

---

## 1. Overview & Core Concept

- **What It Does**: Sethi Transfer is a personal file cloud allowing users to authenticate on any device, upload diverse file types (PDF, Word, presentations, spreadsheets, photos, high-definition videos, compressed archives, text files), organize them, search instantly, preview supported media natively in-browser, and download original files bit-for-bit with preserved filenames.
- **Primary User Journey**:
  $$\text{Mobile Phone} \xrightarrow{\text{Upload Camera/Doc}} \text{Cloudinary + MongoDB Atlas} \xrightarrow{\text{Instant Sync}} \text{Laptop/Desktop} \xrightarrow{\text{Preview or Download}}$$
- **Target Persona**: Individuals seeking a clean, private, non-commercial file highway between their personal phone, tablet, and computer without ad-bloat, messaging compression, or file size truncation.
- **Key Value**: Native Google Workspace-level aesthetic, reliable multi-file upload progress, authenticated secure asset delivery, and resilient streaming downloads.

---

## 2. User Experience & Visual Design

### A. Visual Identity & Google Material Design 3 Philosophy

The interface follows Google Workspace design principles (Google Drive, Google Photos, Google Account settings): clean whitespace, subtle single-elevation cards, crisp hairline dividers, intuitive icons, and zero AI-slop (no garish neon gradients, no decorative pulsing dots, no pill badge sandwiches).

#### Color System Tokens
| Role | Light Theme Token | Dark Theme Token | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#F8FAFD` | `#131314` | Neutral background canvas |
| **Surface** | `#FFFFFF` | `#1E1F20` | Cards, sidebars, sheets |
| **Elevated Surface** | `#F1F3F4` | `#28292A` | Dialogs, toolbars, search bar |
| **Primary Brand Blue**| `#1A73E8` | `#A8C7FA` | Primary action buttons, active tab |
| **Hover Blue** | `#1558B0` | `#8AB4F8` | Button hover and focus states |
| **Borders & Dividers**| `#DADCE0` | `#444746` | Subtle 1px hairline boundaries |
| **Primary Text** | `#202124` | `#E3E3E3` | Headings and high-contrast labels |
| **Secondary Text** | `#5F6368` | `#AEB0B3` | Metadata, file sizes, timestamps |

#### Typography & Metrics Hierarchy
- **Font Stack**: `Plus Jakarta Sans` for clean, geometric Google-like display headlines and navigation; `DM Sans` for body copy; `JetBrains Mono` or `tabular-nums` for file sizes, dates, and storage gauges.
- **Metadata Discipline**: File attributes (e.g. `14.2 MB · Uploaded Nov 10, 2026 · PDF`) render as clean, unboxed typography separated by subtle dots (`·`), never wrapped in colored pill boxes.

### B. Responsive Layouts & Device Workflows

#### 1. Mobile Experience (360px – 768px)
- **Top Bar**: Minimalist brand mark ("Sethi Transfer"), storage indicator icon, profile avatar with dropdown sheet.
- **Floating / Sticky Action Bar**: One-handed accessible "New Upload" pill button anchored at bottom-right or bottom bar.
- **Bottom Navigation**: Quick switches for `My Files`, `Recent`, `Starred`, and `Storage`.
- **Touch-Optimized File Cards**: Compact rows with clear touch targets ($\ge 44\text{px}$), swipe/tap action menus (Download, Star, Delete, Details).
- **Upload Tray**: Non-intrusive bottom progress card displaying upload speed, progress bar percentage, and cancel/retry buttons without obscuring the file browser.

#### 2. Desktop Experience (1024px – 1920px)
- **Top Navigation Bar**: Single-row 3-zone contract:
  - **Zone 1**: Brand wordmark + customizable logo icon.
  - **Zone 2**: Centered Google Drive-style search bar with instant filter dropdown (Type, Date, Starred).
  - **Zone 3**: Storage meter, Dark/Light theme toggle, and Account dropdown menu.
- **Left Sidebar ($256\text{px}$)**:
  - Primary "+ New" upload button (Google-style rounded-full elevation).
  - Navigation tree: My Files, Recent, Starred, Trash, Storage details.
  - Live storage capacity meter with color-coded gauge.
- **Main Viewport**:
  - View switcher (Grid vs. List view).
  - Multi-file drag-and-drop dropzone with drop overlay animations.
  - Category filters: Documents, Images, Videos, Audio, Archives, Others.
  - Sorting: Name (A-Z), Date modified, File size.
  - Contextual action bar: Multi-select download, star, delete, restore.

### C. File Preview & Media Player System
- **Images (PNG, JPG, WEBP, SVG)**: In-modal lightbox with zoom, pan, and direct download.
- **PDF Documents**: Embedded native PDF viewer with page controls.
- **Audio & Video (MP3, MP4, WEBM)**: Native HTML5 custom-styled audio/video players.
- **Text & Code (TXT, CSV, JSON)**: Monospace formatted, syntax-highlighted reader with copy capability.
- **Office Files (DOCX, PPTX, XLSX)**: Rich metadata card with file specifications, icon badges, and direct one-click download stream.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-Stack Express + Vite Integration on Port 3000**
  - *Chosen Approach*: Use `server.ts` to host Express REST API endpoints under `/api/v1/*` while mounting Vite middleware in development and serving static assets in production.
  - *Why*: Allows true server-side streaming downloads, Argon2 cryptographic operations, and private Cloudinary API interactions without exposing keys to the browser, while satisfying the platform's single-port iframe requirement.
- **Decision 2: Cloudinary Private Asset Delivery & Signed URLs**
  - *Chosen Approach*: Store files using Cloudinary authenticated/private delivery types (`resource_type: auto`, raw for documents/archives, image for photos, video for audiovisuals). Download endpoints generate short-lived signed delivery URLs or stream raw bytes directly through the Express server.
  - *Why*: Prevents unauthenticated users from guessing URLs or accessing private documents on public CDNs.
- **Decision 3: Password Security with Argon2 / Native Key Derivation**
  - *Chosen Approach*: Implement Argon2id password hashing with fallback to PBKDF2/SHA-512 (via Node.js `crypto`) to ensure rock-solid cryptographic security across all environments.
- **Decision 4: True HTTP Streaming Downloads**
  - *Chosen Approach*: Proxy Cloudinary or storage asset streams through Express with `res.setHeader('Content-Disposition', 'attachment; filename="original_name.ext"')` and `res.setHeader('Content-Type', mimeType)`.
  - *Why*: Prevents memory exhaustion when downloading large 500MB+ video files and guarantees the user's browser saves the file with its original name.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT VIEWPORT (React 19)                      │
│                                                                        │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ Mobile Navigation /     │  │ Desktop Top Bar + Search Filter     │  │
│  │ Bottom Action Sheet     │  │ Desktop Collapsible Sidebar         │  │
│  └───────────┬─────────────┘  └──────────────────┬──────────────────┘  │
│              │                                   │                     │
│              ▼                                   ▼                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Dashboard Views: My Files / Recent / Starred / Trash / Storage   │  │
│  │ File Grid & List Views · Drag-and-Drop Dropzone · Upload Queue   │  │
│  │ In-Browser Preview Modal (PDF, Images, Audio, Video, Code)       │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ HTTP / REST (/api/v1/*)
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND SERVER (server.ts)                 │
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ Auth Middleware  │  │ Upload Handler   │  │ Streaming Download   │  │
│  │ (JWT & Cookies)  │  │ (Multer / Busboy)│  │ (Content-Disposition)│  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘  │
│           │                     │                       │              │
│           ▼                     ▼                       ▼              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Services Layer: AuthService · FileService · StorageService       │  │
│  │ Argon2 Hashing · MIME Signature Validation · Quota Calculation   │  │
│  └────────┬─────────────────────────────────────────────┬───────────┘  │
└───────────┼─────────────────────────────────────────────┼──────────────┘
            │                                             │
            ▼                                             ▼
┌───────────────────────┐                     ┌────────────────────────┐
│     MONGODB ATLAS     │                     │       CLOUDINARY       │
│                       │                     │                        │
│ - Users Collection    │                     │ - Authenticated Uploads│
│ - Files Collection    │                     │ - Resource Type Routing│
│ - RefreshTokens Coll. │                     │ - Signed Download URLs │
└───────────────────────┘                     └────────────────────────┘
```

### Data Models & Schemas

#### 1. User Schema (`src/server/models/User.ts`)
- `name`: String (trimmed, 1–100 chars)
- `email`: String (lowercase, unique, indexed)
- `passwordHash`: String (Argon2 / PBKDF2 hash)
- `avatar`: String (optional avatar URL)
- `storageLimit`: Number (default: 5 GB = 5,368,709,120 bytes)
- `storageUsed`: Number (default: 0 bytes, maintained atomically)
- `createdAt`, `updatedAt`: Date timestamps

#### 2. File Schema (`src/server/models/File.ts`)
- `userId`: ObjectId (ref: User, indexed)
- `originalName`: String (sanitized original file name)
- `displayName`: String (user-renamed display name)
- `mimeType`: String (verified MIME type from signature)
- `extension`: String (normalized, e.g. `.pdf`, `.mp4`)
- `size`: Number (bytes, indexed)
- `resourceType`: Enum (`image`, `video`, `raw`)
- `cloudinaryPublicId`: String (secure identifier)
- `storageDeliveryType`: Enum (`authenticated`, `private`, `upload`)
- `checksum`: String (SHA-256 hash for integrity & deduplication)
- `category`: Enum (`document`, `image`, `video`, `audio`, `archive`, `other`, indexed)
- `isStarred`: Boolean (default: false, indexed)
- `isDeleted`: Boolean (default: false, indexed)
- `deletedAt`: Date (optional, for 30-day trash cleanup)
- `createdAt`, `updatedAt`: Date timestamps
- **Indexes**: Compound `{ userId: 1, isDeleted: 1, createdAt: -1 }`, `{ userId: 1, category: 1 }`, `{ userId: 1, originalName: "text" }`

#### 3. RefreshToken Schema (`src/server/models/RefreshToken.ts`)
- `userId`: ObjectId (ref: User, indexed)
- `tokenHash`: String (SHA-256 hash of random UUID refresh token)
- `expiresAt`: Date (indexed with TTL for automatic MongoDB expiration)
- `revokedAt`: Date (optional)
- `createdAt`: Date

### REST API Contracts (`/api/v1`)

```
POST   /api/v1/auth/register          -> Register new user account
POST   /api/v1/auth/login             -> Authenticate, return access token & set refresh cookie
POST   /api/v1/auth/refresh           -> Rotate refresh token and issue new access token
POST   /api/v1/auth/logout            -> Revoke refresh token and clear cookie
GET    /api/v1/auth/me                -> Retrieve current authenticated user profile
POST   /api/v1/files/upload           -> Multi-part upload with MIME & size validation
GET    /api/v1/files                  -> List user files with search, filter, and pagination
GET    /api/v1/files/recent           -> List recently uploaded or accessed files
GET    /api/v1/files/starred          -> List starred files
GET    /api/v1/files/:id              -> Get file metadata
GET    /api/v1/files/:id/download     -> Stream download with Content-Disposition
GET    /api/v1/files/:id/preview      -> Get authorized preview URL / stream
PATCH  /api/v1/files/:id              -> Rename or toggle star status
DELETE /api/v1/files/:id              -> Soft-delete (move to trash) or permanent purge
POST   /api/v1/files/:id/restore      -> Restore file from trash
GET    /api/v1/storage/usage          -> Get total storage used, quota, and category breakdown
GET    /api/v1/health                 -> System status & Cloudinary/Mongo connectivity state
```

---

## 5. Security Engineering & Safeguards

1. **Untrusted Upload Sanitization**: Strip dangerous path characters (`../`, null bytes, control codes) from original filenames.
2. **True MIME Signature Validation**: Inspect binary magic numbers (file header bytes) before trusting client-sent `Content-Type` headers to prevent malicious executable injection (`.exe`, `.sh`, `.php` disguised as `.jpg`).
3. **Storage Quota Enforcement**: Pre-upload check: if `user.storageUsed + file.size > user.storageLimit`, immediately reject with HTTP 413 (Payload Too Large).
4. **Token Security**:
   - Access Token: Short-lived (15 minutes), signed with `JWT_ACCESS_SECRET`.
   - Refresh Token: Long-lived (7 days), stored hashed in MongoDB, transmitted via `HttpOnly`, `SameSite=Lax`, `Secure` cookie.
5. **NoSQL Injection & Parameter Sanitization**: Mongoose schema casting and input validation via Zod schemas.
6. **Compensating Transactions**: If Cloudinary upload succeeds but MongoDB save fails, an automated rollback unlinks the Cloudinary asset immediately to prevent orphaned storage bloat.

---

## 6. Implementation Roadmap & Phases

- **Phase 1: Environment & Full-Stack Core**
  - Install backend dependencies: `mongoose`, `cloudinary`, `multer`, `jsonwebtoken`, `zod`, `argon2` (with crypto fallback), `cookie-parser`, `cors`.
  - Configure `server.ts` to boot Express and attach Vite dev middleware seamlessly.
  - Implement MongoDB connection manager and Cloudinary configuration service.
  - Establish environment variable validator with actionable status reporting.

- **Phase 2: Authentication & Security Engine**
  - Build User & RefreshToken Mongoose models.
  - Implement register, login, refresh, logout, and auth middleware.
  - Decouple password hashing with unit tests using `node:test`.

- **Phase 3: File Storage, Upload & Streaming Engine**
  - Build File Mongoose model with composite indexes.
  - Configure Multer streaming storage and Cloudinary private upload adapter.
  - Implement MIME validation, quota tracker, and filename sanitizer.
  - Implement streaming download endpoint preserving original filenames.

- **Phase 4: Google-Grade Frontend Architecture**
  - Design tokens in `src/index.css` supporting light and dark themes.
  - Responsive header, navigation sidebar, and mobile bottom sheet.
  - Drag-and-drop upload zone with multi-file progress queue and retry controls.
  - Grid and List views with sorting, search, category filters, and file actions.
  - Rich preview modal for images, PDF, video, audio, and code.
  - Storage breakdown widget with visual category distribution.

- **Phase 5: Verification & End-to-End Validation**
  - Automated unit tests for authentication logic, file filters, and storage calculations.
  - Browser inspection across desktop (1440px) and mobile (390px) viewports using Playwright.
  - Mobile-upload-to-desktop-download journey verification.
