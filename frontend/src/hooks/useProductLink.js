import { useCallback } from "react";

/**
 * Hook personalizado para abrir enlaces de productos o proveedores de manera segura.
 * Valida el protocolo (http/https) y abre la URL en una nueva pestaña sin exponer window.opener.
 */
export function useProductLink() {
  const sanitizeUrl = useCallback((rawUrl) => {
    if (!rawUrl) return null;
    try {
      const parsed = new URL(rawUrl);
      if (["http:", "https:"].includes(parsed.protocol)) {
        return parsed.href;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const openProductLink = useCallback(
    (rawUrl) => {
      const validUrl = sanitizeUrl(rawUrl);
      if (validUrl) {
        window.open(validUrl, "_blank", "noopener,noreferrer");
      }
    },
    [sanitizeUrl]
  );

  return { openProductLink, sanitizeUrl };
}

export default useProductLink;
