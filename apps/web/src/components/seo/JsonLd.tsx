interface JsonLdProps {
  /** A schema.org node, or an array of them. */
  data: unknown;
}

/**
 * Renders structured data from a server component, so it is present in the
 * HTML that Google parses rather than injected after hydration.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
