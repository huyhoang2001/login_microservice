import { useEffect, useRef } from "react";

function toAbsolute(url, baseUrl) {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

function LegacyPageLoader({ htmlPath }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let active = true;
    const cleanupNodes = [];

    const load = async () => {
      const response = await fetch(htmlPath, { cache: "no-store" });
      const html = await response.text();
      if (!active || !containerRef.current) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const baseUrl = window.location.origin + htmlPath;

      containerRef.current.innerHTML = doc.body.innerHTML;

      const headLinks = Array.from(doc.head.querySelectorAll('link[rel="stylesheet"]'));
      headLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (!href) return;
        const node = document.createElement("link");
        node.rel = "stylesheet";
        node.href = toAbsolute(href, baseUrl);
        document.head.appendChild(node);
        cleanupNodes.push(node);
      });

      const scripts = [
        ...Array.from(doc.head.querySelectorAll("script")),
        ...Array.from(doc.body.querySelectorAll("script")),
      ];

      for (const script of scripts) {
        const node = document.createElement("script");
        const src = script.getAttribute("src");
        const type = script.getAttribute("type");
        if (type) {
          node.type = type;
        }
        if (src) {
          node.src = toAbsolute(src, baseUrl);
          node.async = false;
        } else {
          node.textContent = script.textContent;
        }
        document.body.appendChild(node);
        cleanupNodes.push(node);
      }
    };

    load();

    return () => {
      active = false;
      cleanupNodes.forEach((node) => node.remove());
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [htmlPath]);

  return <div ref={containerRef} />;
}

export default LegacyPageLoader;
