import logoSrc from "@/assets/chronosquares-logo.png";

interface Props {
  withText?: boolean;
  size?: number;
  className?: string;
}

/**
 * ChronoSquares brand mark.
 * Renders the hourglass+square-ring icon (image) plus an optional "ChronoSquares" wordmark.
 */
export function CSLogo({ withText = true, size = 28, className }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <img
        src={logoSrc}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="object-contain select-none"
        style={{ width: size, height: size }}
        draggable={false}
      />
      {withText && (
        <span className="font-semibold tracking-tight text-base whitespace-nowrap">
          Chrono<span className="text-brand">Squares</span>
        </span>
      )}
    </span>
  );
}
