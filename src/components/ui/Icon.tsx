const P: Record<string, React.ReactNode> = {
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />,
  bag: <><path d="M4.5 8h15l-1 13h-13Z" /><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" /></>,
  menu: <><path d="M3 8h18" /><path d="M3 16h18" /></>,
  close: <><path d="m5 5 14 14" /><path d="M19 5 5 19" /></>,
  arrow: <><path d="M4 12h16" /><path d="m14 6 6 6-6 6" /></>,
  "arrow-left": <><path d="M20 12H4" /><path d="m10 6-6 6 6 6" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lock: <><rect x="5" y="10.5" width="14" height="10" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  zoom: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /><path d="M10.5 7.5v6M7.5 10.5h6" /></>,
  ruler: <><path d="M3 15 15 3l6 6L9 21Z" /><path d="m7 11 2 2M10 8l2 2M13 5l2 2" /></>,
  truck: <><path d="M2.5 6.5h11v10h-11Z" /><path d="M13.5 10h4.5l3 3.5v3h-7.5" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8" /><path d="M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16" /><path d="M20 20v-4h-4" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  play: <path d="M8 5.5v13l11-6.5Z" />,
  filter: <><path d="M4 7h16M7 12h10M10 17h4" /></>,
  instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".6" /></>,
  pix: <><path d="m12 3 4.2 4.2-4.2 4.2-4.2-4.2Z" /><path d="m12 12.6 4.2 4.2L12 21l-4.2-4.2Z" /><path d="m3 12 4.2-4.2 4.2 4.2-4.2 4.2Z" /><path d="m12.6 12 4.2-4.2L21 12l-4.2 4.2Z" /></>,
  card: <><rect x="3" y="5.5" width="18" height="13" /><path d="M3 10h18" /></>,
  barcode: <path d="M4 5v14M7 5v14M10 5v14M14 5v14M16 5v14M20 5v14" />,
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8Z" />,
};

export type IconName = keyof typeof P;

export default function Icon({ name, size = 20, filled, className, label }: { name: IconName; size?: number; filled?: boolean; className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      className={className}
    >
      {P[name]}
    </svg>
  );
}
