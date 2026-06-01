/**
 * Renders a JSON-LD structured-data block. Pass a graph object
 * built with the helpers in lib/seo/jsonLd.ts.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Content is generated from trusted, internal schema builders.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
