"use client";

/**
 * Last-resort boundary: catches failures in the root layout itself, which the
 * per-segment error.tsx cannot reach.
 *
 * It replaces <html> entirely, so it gets no providers, no fonts and no theme
 * script — hence the inline styles and the system font stack. Deliberately
 * plain: this file has to work when everything else is broken.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "#fbf8f5",
          color: "#1c1917",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <main style={{ maxWidth: "32rem" }}>
          <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>
            Something went wrong
          </h1>
          <p
            style={{
              margin: "0 0 1.25rem",
              lineHeight: 1.6,
              color: "#57534e",
            }}
          >
            The app failed to start up. Nothing was changed, and no money moved.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: "44px",
              padding: "0 1.25rem",
              borderRadius: "10px",
              border: 0,
              background: "#6b4e7a",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.75rem",
                color: "#6b6560",
              }}
            >
              Reference: <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
