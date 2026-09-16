import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { HomePage } from "./shell/HomePage.js";
import { NotFoundPage } from "./shell/NotFoundPage.js";

/**
 * App shell — shared nav, routing, layout.
 * Domain-specific view components (accessibility/, cybersecurity/,
 * quality-lifecycle/) are lazy-loaded once built (Phase 2).
 */
export function App(): JSX.Element {
  return (
    <BrowserRouter>
      <header role="banner" style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
        <nav aria-label="Main navigation">
          <NavLink to="/">Home</NavLink>
          {/* Domain nav links added by each member as their views are built */}
        </nav>
      </header>

      <main id="main-content" role="main" style={{ padding: "1rem" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Domain routes added in Phase 2:
              /reports/:id          → SiteReport overview
              /reports/:id/accessibility   → Member A's view
              /reports/:id/cybersecurity   → Member A's view
              /reports/:id/quality         → Member B's view
              /reports/:id/lifecycle       → Member B's view
              /reports/:id/manual-review   → manual checklist (shared)
          */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
