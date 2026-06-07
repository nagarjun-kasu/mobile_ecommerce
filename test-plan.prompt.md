# Test Plan Generation Prompt — MobileHub E-Commerce Application

> **How to use this file:** Copy the entire "Prompt" section below into a new LLM/agent session. Fill in any placeholders (e.g. environment URL, tester name) before sending. The model will produce a comprehensive test plan tailored to this codebase.

---

## Prompt

You are a **Senior QA Engineer** with expertise in test planning for full-stack web applications. Generate a **comprehensive, executable test plan** for the **MobileHub Premium Mobile E-Commerce** application located at `D:\AI\Mobile_ECommerce`.

### 1. Context — Application Under Test

**Project:** MobileHub — Premium Mobile E-Commerce
**Description:** Single-page e-commerce application for flagship smartphones (Samsung, Apple, Realme, OnePlus, Google). Free shipping on orders over $500.
**Tech stack:**

- **Backend:** Node.js + Express 4.21, in-memory data stores (Map for carts, Array for orders), `uuid` for IDs, `cors`, custom error-handling middleware.
- **Frontend:** Vanilla HTML/CSS/JS SPA (no framework), Inter web font, no build step.
- **Deployment:** `gh-pages` for static client; live API hosted at `https://mobile-ecommerce-0upb.onrender.com/api`.
- **Local dev:** `npm start` (or `npm run dev`) → server on `http://localhost:3000`, client served from `/`.

**Repository layout (read these files to understand behavior):**

```
client/
  index.html         # SPA shell, navbar, cart sidebar, product modal, toast container
  css/styles.css     # 39KB of styles — themes, responsive, scroll effects
  js/api.js          # API client (apiRequest wrapper, API object)
  js/app.js          # All UI logic: state, render, navigate, events, debounced search
  assets/images/     # Brand images (samsung.png, iphone.png, realme.png, oneplus.png, pixel.png)
server/
  index.js           # Express bootstrap, /api/* routes, SPA fallback
  routes/products.js # GET /, GET /brands, GET /:id  (filters: brand, search, sort, minPrice, maxPrice)
  routes/cart.js     # GET, POST, PUT /:id, DELETE /:id, DELETE /  (single "default" session)
  routes/orders.js   # POST /, GET /, GET /:id  (clears cart on success)
  models/cart.js     # In-memory cart, 8% tax, getCartTotal
  models/order.js    # Order creation, MEC-XXXXXXXX order numbers, 5-day ETA
  middleware/errorHandler.js  # errorHandler + notFound
  data/products.js   # 10KB product seed data
```

**Customer-facing pages (SPA routes):** `home`, `checkout`, `confirmation`, `orders`.

### 2. Your Mission

Produce a **complete test plan** in Markdown that an SDET or QA team can execute immediately. The plan must cover functional, API, UI/UX, negative, security, performance, accessibility, and compatibility testing.

### 3. Required Deliverables

Generate the test plan with the following sections, in this order:

#### Section A — Plan Header

- Document title, version, author, date (today: **2026-06-07**), environment.
- Test scope (in-scope vs. out-of-scope). Out-of-scope: payment-gateway integration, real auth, multi-user sessions, real inventory.
- Assumptions (in-memory store resets on server restart; cart session is "default" — no real session cookies).
- Entry/exit criteria.

#### Section B — Test Strategy

- Test levels: Unit (models), API (routes), Integration (UI↔API), E2E (Playwright/Cypress), Smoke, Regression.
- Test types: Functional, Negative, Boundary, Security (OWASP top 10 lite), Performance, Accessibility (WCAG 2.1 AA), Cross-browser, Responsive (mobile/tablet/desktop), Visual regression.
- Tools recommendations: **Jest** or **Vitest** for unit, **Supertest** for API, **Playwright** (preferred) or **Cypress** for E2E, **axe-core** for a11y, **k6** or **Artillery** for perf, **Postman/Newman** for API contract.
- Entry criteria, exit criteria, suspension/resumption criteria, test deliverables checklist.

#### Section C — Test Environment & Data

- Environment matrix: local (Windows 11), dev (Render), production (GitHub Pages + Render API).
- Browsers: Chrome (latest), Edge (latest), Firefox (latest), Safari (latest); viewports 360×800, 768×1024, 1366×768, 1920×1080.
- Test data: brand list, product IDs (verify which exist in `data/products.js`), sample customer info, valid/invalid card numbers (use test 4242…4242), boundary prices.
- How to seed/reset: restart server (in-memory store wipes).

#### Section D — API Test Cases (numbered, priority-tagged)

For **every endpoint** in `server/routes/`, write at least: **happy path, validation failure, not-found, edge cases, security checks**. Use this table form:

| ID | Method | Endpoint | Scenario | Pre-conditions | Steps | Expected Status | Expected Body | Priority | Type |
|----|--------|----------|----------|----------------|-------|-----------------|---------------|----------|------|

Endpoints to cover:

1. `GET /api/health`
2. `GET /api/products` (with/without filters)
3. `GET /api/products/brands`
4. `GET /api/products/:id`
5. `GET /api/cart`
6. `POST /api/cart`
7. `PUT /api/cart/:id`
8. `DELETE /api/cart/:id`
9. `DELETE /api/cart`
10. `POST /api/orders`
11. `GET /api/orders`
12. `GET /api/orders/:id`
13. 404 fallthrough
14. CORS preflight (`OPTIONS`)
15. Malformed JSON, oversized payloads, SQL-injection-like strings in query params.

For each filter (`brand`, `search`, `sort`, `minPrice`, `maxPrice`), enumerate test cases for: valid value, empty value, case-insensitivity, boundary (0, max-int, negative), special characters, XSS payloads, very long strings.

#### Section E — UI / Functional Test Cases (grouped by page)

For each page below, list test cases in **Given-When-Then** format with priority, severity, and traceability:

**E1 — Home / Product Listing**

- Initial load: 10+ products render, brand chips, default "All" selected.
- Brand filter: click each brand → only that brand's products shown; click "All" → all return.
- Search: debounce (300ms), match by name/description/brand, case-insensitive, no-result state, clear search.
- Sort: price asc/desc, rating, name (verify default order).
- Product card: image loads (or gradient fallback), name, brand, price, rating stars, "Add to Cart" button, "View Details".
- Quick add to cart from card → cart badge increments, toast appears, no page jump.
- Pagination / infinite scroll (verify whether it exists; if not, document as out-of-scope).
- Empty state when filters return zero results.
- Concurrent: rapid clicks on "Add to Cart" → no race condition, badge updates correctly.

**E2 — Product Detail Modal**

- Opens on "View Details", trap focus, scroll lock.
- Shows image, full description, specs, price, quantity selector, "Add to Cart".
- Close: X button, overlay click, **Escape** key.
- Quantity stepper: increments/decrements, min 1, max (e.g. 99), keyboard input.
- Add to cart from modal → updates cart, modal stays open or closes (verify spec).

**E3 — Cart Sidebar**

- Open via cart icon, close via X / overlay / Escape.
- Empty state: friendly message + "Continue shopping" CTA.
- Item row: image, name, brand, unit price, quantity stepper, line total, remove (trash) button.
- Update quantity: subtotal, tax (8%), total recompute in real time; qty 0 → item removed (verify PUT behavior vs DELETE).
- Remove item → confirm? (verify whether confirm dialog exists) → row removed, totals update.
- Clear cart button (if present) → confirm → cart empty.
- "Proceed to Checkout" button enabled only when cart has items.
- Cart badge in nav reflects `itemCount`.
- Persistence: refresh page → cart contents retained (server-side in-memory).

**E4 — Checkout**

- Form fields: firstName, lastName, email, phone, street, city, state, zipCode, country (default US), paymentMethod, cardLast4.
- Client-side validation: required fields, email regex, phone format, zip regex, last4 = 4 digits.
- Server-side validation: `POST /api/orders` rejects missing required fields with 400.
- Order summary panel: line items, subtotal, tax, shipping (0 or "Free over $500" logic), total.
- "Free shipping" rule: orders over $500 → shipping $0; verify under $500 behavior.
- Payment method selector: credit_card / paypal / others — how is `cardLast4` captured? (verify spec)
- Submit: disables button, shows spinner/loading state, calls `POST /api/orders`, on success navigates to `confirmation`, on failure shows inline error.
- Empty cart on checkout page → block checkout (return to home or show error).

**E5 — Order Confirmation**

- Order number displayed (format `MEC-XXXXXXXX`).
- Order summary, customer info, shipping address, payment method, last4.
- Estimated delivery date = created + 5 days.
- "Continue Shopping" CTA → back to home, cart empty.

**E6 — Orders (My Orders)**

- Lists all orders (since server restart) sorted newest first.
- Click order → detail view (verify: modal? page? expand row?).
- Empty state when no orders.
- Order detail shows same info as confirmation page.

#### Section F — Cross-cutting Concerns

- **Navigation:** Logo, Orders icon, Cart icon; SPA fallback for unknown routes (`/foo` → serves `index.html`, no 404 page).
- **Error handling:** API down → toast "Failed to load products", graceful degradation; 500 from server → user-friendly error.
- **Loading states:** Skeleton/spinner while products load; disabled buttons during in-flight requests.
- **Toasts:** Success, error, info variants; auto-dismiss; multiple toasts stack.
- **Responsive:** Navbar collapses on mobile, cart sidebar full-width, modal scales, touch targets ≥44×44 px.
- **Keyboard:** Tab order, visible focus rings, Escape closes modal/cart, Enter submits forms.
- **Screen reader:** ARIA labels on icon-only buttons (nav, cart, modal close), aria-live for toasts, modal `role="dialog"` + `aria-modal="true"`.
- **Theme/dark mode:** If dark mode exists, verify both modes.
- **Fonts:** Inter loads; fallback fonts; no FOIT/FOUT issues.
- **Performance:** LCP < 2.5s, FID < 100ms, CLS < 0.1 on home page; API p95 < 500ms.

#### Section G — Security Test Cases

Apply **OWASP Top 10 (2021)** lite:

- **A01 Broken Access Control:** No auth — note that all endpoints are public; document risk.
- **A02 Cryptographic Failures:** No HTTPS enforcement at app level; no PII encryption at rest.
- **A03 Injection (XSS):** Submit `<script>alert(1)</script>` in search, name, address fields. Reflected vs stored? (Frontend uses textContent? verify).
- **A04 Insecure Design:** Cart is single-session "default" — any user shares the cart; document.
- **A05 Security Misconfiguration:** CORS allows all origins (`cors()` default); security headers (X-Content-Type-Options, X-Frame-Options, CSP) — verify presence.
- **A07 Identification & Auth Failures:** No auth — all orders publicly viewable via `GET /api/orders`.
- **A08 Software & Data Integrity:** No integrity check on responses.
- **A10 SSRF:** N/A for this app.
- Rate limiting: not implemented — document.
- Input size limits: send 1MB JSON to `POST /api/cart` — does it 413/timeout?
- Negative quantity, NaN, Infinity, string `"abc"` for numeric fields.
- HTTP method tampering: try `TRACE`, `PATCH`, etc.

#### Section H — Performance & Load Test Plan

- Smoke: 10 concurrent users, basic browse.
- Load: 100 RPS on `GET /api/products` for 5 min — p95 < 500ms, error rate < 1%.
- Stress: ramp to 500 RPS, find breaking point.
- Spike: 0 → 1000 RPS in 10s.
- Soak: 50 RPS for 1 hour — memory leak check (in-memory cart will grow).
- Frontend: Lighthouse run, target Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 80.

#### Section I — Accessibility Test Plan (WCAG 2.1 AA)

- All images have `alt` text (or `alt=""` for decorative).
- Color contrast ≥ 4.5:1 for text, ≥ 3:1 for large text and UI components.
- Run `axe-core` automated scan; resolve all critical/serious issues.
- Manual screen reader pass (NVDA on Windows, VoiceOver on macOS) for: home, cart, checkout flow.
- Form labels associated with inputs; error messages linked via `aria-describedby`.
- Focus is not trapped or lost after modal open/close.
- Skip-to-content link (if missing, recommend adding).

#### Section J — Compatibility Matrix

| Browser | Desktop (1920×1080) | Tablet (768×1024) | Mobile (360×800) | OS |
|---------|--------------------|--------------------|--------------------|----|
| Chrome latest | ✓ | ✓ | ✓ | Win/macOS/iOS/Android |
| Edge latest | ✓ | ✓ | ✓ | Win |
| Firefox latest | ✓ | ✓ | ✓ | Win/macOS |
| Safari latest | ✓ | ✓ | ✓ | macOS/iOS |

#### Section K — Test Case Summary Table

End with a summary table:

| Module | Total | P0 | P1 | P2 | Automated? |
|--------|-------|----|----|----|-----------|
| API Products | … | … | … | … | yes/no |
| API Cart | … | … | … | … | … |
| API Orders | … | … | … | … | … |
| UI Home | … | … | … | … | … |
| UI Cart | … | … | … | … | … |
| UI Checkout | … | … | … | … | … |
| UI Confirmation | … | … | … | … | … |
| UI Orders | … | … | … | … | … |
| Security | … | … | … | … | … |
| Performance | … | … | … | … | … |
| A11y | … | … | … | … | … |
| **Total** | … | … | … | … | … |

#### Section L — Risks, Open Questions, and Follow-ups

- In-memory store is lost on restart — how to test across restarts? (Recommend documenting in CI to restart between suites.)
- Single shared cart across all visitors — privacy/correctness risk; recommend session ID.
- No payment integration — `cardLast4` is client-supplied; document trust boundary.
- No rate limiting / brute-force protection.
- Confirm free-shipping threshold ($500) with product owner.
- Confirm `quantity` upper bound on `PUT /api/cart/:id`.
- Confirm whether updating quantity to 0 deletes the item (`updateCartItem` returns `removeFromCart` on qty ≤ 0 — verify intended).

#### Section M — Exit Criteria Checklist

- [ ] All P0 test cases pass.
- [ ] ≥ 95% of P1 cases pass.
- [ ] No open Sev1/Sev2 bugs.
- [ ] Code coverage ≥ 80% on `server/models/`, ≥ 70% on `server/routes/`.
- [ ] Lighthouse Performance ≥ 90, A11y ≥ 95.
- [ ] axe-core: 0 critical, 0 serious violations.
- [ ] Security smoke (XSS, injection, oversized payload) all pass.
- [ ] Test plan reviewed and signed off by QA Lead and Product Owner.

### 4. Quality Bar

- **Read the source first.** Inspect `client/js/app.js`, `client/js/api.js`, and all `server/**` files to ground every test case in real behavior. If a behavior is unclear (e.g. "does qty=0 remove the item?"), state both the assumption and the test that will confirm it.
- **Be specific.** Use exact field names, IDs, endpoint paths, and HTTP status codes from the code. Quote function names from `app.js` (e.g. `navigate`, `loadCart`, `renderHomePage`).
- **Prioritize ruthlessly.** Tag each case **P0** (blocker), **P1** (must), **P2** (should), **P3** (nice).
- **Make it executable.** Each test case should be runnable by a human or by Playwright/Cypress code shown inline.
- **Cite the file and line** when you reference behavior: e.g. `server/models/cart.js:42-44` for the qty ≤ 0 → remove behavior.
- **Output length target:** 1500–3000 lines of Markdown. Do not pad; do not skip depth.

### 5. Deliverable Format

A single Markdown document with a Table of Contents at the top, the sections above (A through M), and inline tables/code blocks where useful. Save the result to `test-plan.md` in the project root.

---
