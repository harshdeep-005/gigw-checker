/**
 * HomePage — entry point for submitting a site URL for compliance checking.
 *
 * TODO (Phase 1 shared):
 *  - Form: URL input + submit button
 *  - POST /api/jobs on submit, receive jobId
 *  - Poll GET /api/jobs/:id for status
 *  - Redirect to /reports/:id when status === "done"
 */
export function HomePage(): JSX.Element {
  return (
    <div>
      <h1>GIGW 3.0 Compliance Checker</h1>
      <p>
        Enter a <code>.gov.in</code> or <code>.nic.in</code> site URL to run a
        full GIGW 3.0 compliance audit.
      </p>
      {/* URL submission form — Phase 1 TODO */}
      <p style={{ color: "#888" }}>(Submission form coming in Phase 1)</p>
    </div>
  );
}
