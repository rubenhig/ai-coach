interface DuxLogoProps {
  size?: number
  className?: string
  showName?: boolean
}

export function DuxIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Head */}
      <circle cx="22" cy="4.5" r="2.8" fill="currentColor" />
      {/* Torso — inclinado ~40° hacia adelante */}
      <path
        d="M20.5 7.5 L13 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Brazo delantero — arriba hacia adelante */}
      <path
        d="M17.5 11 L25 8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Brazo trasero — abajo hacia atrás */}
      <path
        d="M17.5 11 L10.5 15"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Pierna delantera — rodilla elevada, pie adelante */}
      <path
        d="M13 18 L19 24 L23 30"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pierna trasera — empujando hacia atrás */}
      <path
        d="M13 18 L8 23 L5 29"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DuxLogo({ size = 32, className, showName = true }: DuxLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <div
        style={{ width: size, height: size }}
        className="rounded bg-strava text-white flex items-center justify-center flex-shrink-0"
      >
        <DuxIcon size={Math.round(size * 0.72)} />
      </div>
      {showName && (
        <span
          style={{ fontSize: size * 0.6 }}
          className="font-extrabold tracking-tight leading-none"
        >
          Dux
        </span>
      )}
    </div>
  )
}
