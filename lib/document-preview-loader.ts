function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function getPreviewLoaderMarkup(message: string): string {
  const safeMessage = escapeHtml(message)

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeMessage}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f8fafc;
        --bg-accent: rgba(14, 165, 233, 0.12);
        --panel: rgba(255, 255, 255, 0.88);
        --border: rgba(148, 163, 184, 0.18);
        --text: #0f172a;
        --muted: #64748b;
        --ring: rgba(14, 165, 233, 0.18);
        --ring-strong: #0ea5e9;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
        background:
          radial-gradient(circle at top, var(--bg-accent), transparent 34%),
          linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%);
        color: var(--text);
      }

      .overlay {
        width: 100%;
        padding: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .card {
        width: min(100%, 320px);
        border: 1px solid var(--border);
        border-radius: 24px;
        padding: 28px 24px;
        background: var(--panel);
        backdrop-filter: blur(18px);
        box-shadow:
          0 18px 50px rgba(15, 23, 42, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.65);
        text-align: center;
      }

      .spinner-wrap {
        position: relative;
        width: 96px;
        height: 96px;
        margin: 0 auto 18px;
        display: grid;
        place-items: center;
      }

      .spinner-ring,
      .spinner-ring-strong {
        position: absolute;
        inset: 0;
        border-radius: 9999px;
      }

      .spinner-ring {
        border: 1px solid var(--ring);
      }

      .spinner-ring-strong {
        border: 3px solid var(--ring);
        border-top-color: var(--ring-strong);
        animation: spin 0.9s linear infinite;
      }

      .spinner-core {
        position: relative;
        z-index: 1;
        width: 64px;
        height: 64px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(203, 213, 225, 0.8);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        display: grid;
        place-items: center;
      }

      .spinner-dot {
        width: 14px;
        height: 14px;
        border-radius: 9999px;
        background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
        box-shadow: 0 0 0 8px rgba(14, 165, 233, 0.12);
      }

      .title {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      .message {
        margin: 6px 0 0;
        font-size: 12px;
        color: var(--muted);
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    </style>
  </head>
  <body>
    <div class="overlay" role="status" aria-live="polite" aria-busy="true">
      <div class="card">
        <div class="spinner-wrap">
          <span class="spinner-ring"></span>
          <span class="spinner-ring-strong"></span>
          <div class="spinner-core">
            <span class="spinner-dot"></span>
          </div>
        </div>
        <p class="title">Preparando documento</p>
        <p class="message">${safeMessage}</p>
      </div>
    </div>
  </body>
</html>`
}

export function setDocumentPreviewLoadingState(
  previewWindow: Window | null | undefined,
  message = "Cargando documento..."
) {
  if (!previewWindow?.document) return

  previewWindow.opener = null
  previewWindow.document.open()
  previewWindow.document.write(getPreviewLoaderMarkup(message))
  previewWindow.document.close()
}
