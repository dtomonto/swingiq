/**
 * Renders a JSON-LD structured-data block. Pass a graph object
 * built with the helpers in lib/seo/jsonLd.ts.
 */

/**
 * Serialize structured data for safe inline embedding inside a <script> tag.
 *
 * SwingVantage's JSON-LD is built from internal schema builders, but those builders
 * include page titles, FAQ answers, and other copy. A raw JSON.stringify would
 * let a "</script>" sequence in any such string break out of the script
 * context — a classic stored-XSS sink. We escape the HTML-significant
 * characters plus the two Unicode line terminators that are valid in JSON but
 * illegal in JS string literals. The output stays valid JSON, so search
 * engines parse it identically.
 */
function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(
    /[<>&\u2028\u2029]/g,
    (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'),
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Escaped by serializeJsonLd so it cannot break out of the script tag.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
