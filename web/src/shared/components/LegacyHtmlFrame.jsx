import { useEffect, useState } from "react";

function withBaseHref(html, htmlPath) {
  const baseHref = `${window.location.origin}${htmlPath.replace(/[^/]*$/, "")}`;

  if (/<base\s/i.test(html)) {
    return html;
  }

  return html.replace(/<head(.*?)>/i, `<head$1><base href="${baseHref}">`);
}

function LegacyHtmlFrame({ htmlPath, title }) {
  const [srcDoc, setSrcDoc] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setError("");
        setLoading(true);

        const response = await fetch(htmlPath, {
          cache: "default",
          headers: {
            Accept: "text/html",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to load ${htmlPath}: ${response.status} ${response.statusText}`,
          );
        }

        const html = await response.text();
        if (!active) {
          return;
        }

        setSrcDoc(withBaseHref(html, htmlPath));
      } catch (err) {
        if (!active) {
          return;
        }
        setSrcDoc("");
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load page. Please refresh.",
        );
        console.error("LegacyHtmlFrame Error:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [htmlPath]);

  if (error) {
    return (
      <div
        style={{
          padding: "2rem",
          color: "#b91c1c",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h2>⚠️ Error Loading Page</h2>
        <p>{error}</p>
        <details style={{ marginTop: "1rem", cursor: "pointer" }}>
          <summary>Debug Info</summary>
          <pre
            style={{
              background: "#f3f4f6",
              padding: "1rem",
              borderRadius: "0.5rem",
              overflow: "auto",
              fontSize: "0.875rem",
            }}
          >
            Path: {htmlPath}
            Origin: {window.location.origin}
          </pre>
        </details>
      </div>
    );
  }

  if (loading && !srcDoc) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#6b7280",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <iframe
      title={title}
      srcDoc={srcDoc}
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
        display: "block",
      }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-top-navigation-by-user-activation"
      referrerPolicy="no-referrer"
    />
  );
}

export default LegacyHtmlFrame;
