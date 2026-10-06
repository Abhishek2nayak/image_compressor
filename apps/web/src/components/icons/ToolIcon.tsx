export type ToolIconName =
  | 'compress-image'
  | 'jpg-to-pdf'
  | 'merge-pdf'
  | 'split-pdf'
  | 'compress-pdf'
  | 'resize-image'
  | 'pdf-to-jpg';

interface ToolIconProps {
  name: ToolIconName;
  size?: number;
  className?: string;
}

const ACCENT: Record<ToolIconName, { solid: string; soft: string; mid: string }> = {
  'compress-image': { solid: '#FF1744', soft: '#FFE1E7', mid: '#FF94AC' },
  'jpg-to-pdf': { solid: '#FF9F1C', soft: '#FFEFD1', mid: '#FFC46A' },
  'merge-pdf': { solid: '#2563EB', soft: '#DBEAFE', mid: '#93C5FD' },
  'split-pdf': { solid: '#22C55E', soft: '#DCFCE7', mid: '#86EFAC' },
  'compress-pdf': { solid: '#7C3AED', soft: '#EDE9FE', mid: '#C4B5FD' },
  'resize-image': { solid: '#FF4D8D', soft: '#FFE4EE', mid: '#FF9FC2' },
  'pdf-to-jpg': { solid: '#0D9488', soft: '#CCFBF1', mid: '#5EEAD4' },
};

const LABEL: Record<ToolIconName, string> = {
  'compress-image': 'Compress image',
  'jpg-to-pdf': 'JPG to PDF',
  'merge-pdf': 'Merge PDF',
  'split-pdf': 'Split PDF',
  'compress-pdf': 'Compress PDF',
  'resize-image': 'Resize image',
  'pdf-to-jpg': 'PDF to JPG',
};

/**
 * Duotone tool icons on a 48px grid.
 *
 * Built to stay readable at 24px, so each one has a single clear subject and
 * chunky strokes. Documents always carry a visible folded corner; compression
 * is always a pair of bold arrows pressing inward.
 */
export function ToolIcon({ name, size = 32, className }: ToolIconProps) {
  const c = ACCENT[name];
  const line = {
    stroke: c.solid,
    strokeWidth: 2.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  /** Page with a folded top-right corner. */
  const Page = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => {
    const f = Math.min(w, h) * 0.34; // fold size
    const r = 2.5;
    return (
      <>
        <path
          d={`M${x + r} ${y}h${w - f - r}l${f} ${f}v${h - f - r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}V${y + r}a${r} ${r} 0 0 1 ${r} -${r}Z`}
          fill={c.soft}
        />
        <path d={`M${x + w - f} ${y}l${f} ${f}h-${f}Z`} fill={c.mid} />
        <path
          d={`M${x + r} ${y}h${w - f - r}l${f} ${f}v${h - f - r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}V${y + r}a${r} ${r} 0 0 1 ${r} -${r}Z`}
          {...line}
        />
      </>
    );
  };

  /** Photo frame with a sun and a mountain. */
  const Photo = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
    <>
      <rect x={x} y={y} width={w} height={h} rx="3.5" fill={c.soft} />
      <circle cx={x + w * 0.28} cy={y + h * 0.32} r={h * 0.1} fill={c.solid} />
      <path
        d={`M${x + 2} ${y + h - 3}l${w * 0.3} -${h * 0.42} l${w * 0.26} ${h * 0.26} l${w * 0.2} -${h * 0.18} L${x + w - 2} ${y + h - 3}Z`}
        fill={c.mid}
      />
      <rect x={x} y={y} width={w} height={h} rx="3.5" {...line} />
    </>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label={LABEL[name]}
      className={className}
    >
      {name === 'compress-image' && (
        <>
          {/* arrows pressing in from top and bottom */}
          <path d="M24 3v7M20 6.5l4 3.5 4-3.5" {...line} />
          <path d="M24 45v-7M20 41.5l4-3.5 4 3.5" {...line} />
          <Photo x={7} y={15} w={34} h={18} />
        </>
      )}

      {name === 'compress-pdf' && (
        <>
          {/* arrows pressing in from left and right */}
          <path d="M3 24h7M6.5 20l3.5 4-3.5 4" {...line} />
          <path d="M45 24h-7M41.5 20l-3.5 4 3.5 4" {...line} />
          <Page x={14} y={8} w={20} h={32} />
          <path d="M19 20h10M19 26h10M19 32h6" stroke={c.mid} strokeWidth="2.6" strokeLinecap="round" />
        </>
      )}

      {name === 'jpg-to-pdf' && (
        <>
          <Photo x={4} y={15} w={17} h={16} />
          <path d="M23 23h5.5M26 20l3 3-3 3" {...line} strokeWidth={2.4} />
          <Page x={31} y={11} w={14} h={25} />
        </>
      )}

      {name === 'pdf-to-jpg' && (
        <>
          <Page x={3} y={11} w={14} h={25} />
          <path d="M19.5 23H25M22.5 20l3 3-3 3" {...line} strokeWidth={2.4} />
          <Photo x={27} y={15} w={17} h={16} />
        </>
      )}

      {name === 'merge-pdf' && (
        <>
          {/* two pages feeding down into one */}
          <Page x={4} y={4} w={16} h={18} />
          <Page x={28} y={4} w={16} h={18} />
          <path d="M12 24v3a4 4 0 0 0 4 4h16a4 4 0 0 0 4-4v-3" {...line} strokeWidth={2.4} />
          <path d="M24 29v12M19.5 36.5L24 41l4.5-4.5" {...line} />
        </>
      )}

      {name === 'split-pdf' && (
        <>
          {/* two halves pulling apart, with the cut line between them */}
          <Page x={4} y={11} w={16} h={26} />
          <Page x={28} y={11} w={16} h={26} />
          <path d="M24 6v36" stroke={c.solid} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 4" />
          <path d="M20.5 24h-4M18.5 21.5L16 24l2.5 2.5" {...line} strokeWidth={2.2} />
          <path d="M27.5 24h4M29.5 21.5L32 24l-2.5 2.5" {...line} strokeWidth={2.2} />
        </>
      )}

      {name === 'resize-image' && (
        <>
          {/* target size dashed behind, actual photo in front, dragged along the diagonal */}
          <path
            d="M7 7h34v34H7z"
            stroke={c.mid}
            strokeWidth="2.4"
            strokeDasharray="4 4.5"
            fill="none"
            strokeLinejoin="round"
          />
          <Photo x={7} y={7} w={21} h={18} />
          <path d="M30 30l9 9" {...line} strokeWidth={2.6} />
          <path d="M30 36v-6h6M39 33v6h-6" {...line} strokeWidth={2.4} />
        </>
      )}
    </svg>
  );
}
