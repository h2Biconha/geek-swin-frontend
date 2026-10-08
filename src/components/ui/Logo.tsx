import { BRAND } from "@/lib/brand";

/** Wordmark. O "_" é o cursor de terminal: a assinatura da marca (também no loading e no favicon). */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display inline-flex items-baseline text-[1.375rem] leading-none tracking-[-0.005em] lg:text-[1.5rem] ${className}`}>
      {BRAND.name}
      <span className="text-accent-fg" aria-hidden>
        _
      </span>
    </span>
  );
}
