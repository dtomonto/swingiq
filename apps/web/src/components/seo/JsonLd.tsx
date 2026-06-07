/**
 * Renders a JSON-LD structured-data block. Pass a graph object
 * built with the helpers in lib/seo/jsonLd.ts.
 *
 * Serialization (escaping `<>&` + the U+2028/U+2029 line terminators so a
 * "</script>" in any field cannot break out of the tag) lives in the shared
 * lib/seo/serialize-json-ld helper — the single source of truth for every
 * JSON-LD emitter in the app.
 */
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld';

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Escaped by serializeJsonLd so it cannot break out of the script tag.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
