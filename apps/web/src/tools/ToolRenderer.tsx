'use client';

import { TOOL_COMPONENTS } from './index';

/**
 * Renders one tool by slug. This lives in a client component on purpose:
 * next/dynamic only code-splits when called from client code, so each tool
 * page downloads just its own tool instead of every tool on the site.
 */
export function ToolRenderer({ slug }: { slug: string }) {
  const Component = TOOL_COMPONENTS[slug];
  return Component ? <Component /> : null;
}
