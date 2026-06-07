// Tests for the shared JSON-LD serializer (lib/seo/serialize-json-ld.ts).
// Property under test: no string field can terminate the surrounding
// <script> tag, and the output is still valid JSON that round-trips.
//
// The two Unicode line terminators are built with String.fromCharCode so the
// test source stays pure ASCII (no invisible characters to be mangled).

import { serializeJsonLd } from '@/lib/seo/serialize-json-ld';

const LS = String.fromCharCode(0x2028); // U+2028 LINE SEPARATOR
const PS = String.fromCharCode(0x2029); // U+2029 PARAGRAPH SEPARATOR

describe('serializeJsonLd', () => {
  it('escapes a </script> breakout attempt so no literal "<" survives', () => {
    const graph = {
      '@type': 'VideoObject',
      name: 'Pwn </script><script>alert(document.cookie)</script>',
    };
    const out = serializeJsonLd(graph);
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).not.toContain('</script');
    // The escaped form is present instead.
    expect(out).toContain('\\u003c');
  });

  it('escapes the HTML-significant characters < > &', () => {
    const out = serializeJsonLd({ s: '<a & b>' });
    expect(out).toContain('\\u003c'); // <
    expect(out).toContain('\\u003e'); // >
    expect(out).toContain('\\u0026'); // &
  });

  it('escapes the U+2028 / U+2029 line terminators', () => {
    const out = serializeJsonLd({ s: `a${LS}b${PS}c` });
    expect(out).toContain('\\u2028');
    expect(out).toContain('\\u2029');
    // The raw terminators must not appear in the output.
    expect(out).not.toContain(LS);
    expect(out).not.toContain(PS);
  });

  it('produces valid JSON that round-trips to the original object', () => {
    const graph = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      name: 'Fix a slice & </script> safely',
      items: ['<one>', `two${LS}three`],
    };
    expect(JSON.parse(serializeJsonLd(graph))).toEqual(graph);
  });
});
