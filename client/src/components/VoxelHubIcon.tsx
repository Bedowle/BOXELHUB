interface VoxelHubIconProps {
  size?: 24 | 32 | 48;
  className?: string;
}

export default function VoxelHubIcon({ size = 24, className = "" }: VoxelHubIconProps) {
  const sizeClass = {
    24: "w-6 h-6",
    32: "w-8 h-8",
    48: "w-12 h-12"
  }[size];

  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} ${className} voxelhub-icon`}
      role="img"
      aria-label="Icono cubo esquina VoxelHub"
      data-testid="icon-voxelhub-cube"
    >
      <title>VoxelHub - Cubo 3D</title>
      <defs>
        <style>{`
          .voxelhub-icon line {
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
            transition: stroke 150ms ease-out;
          }
          .voxelhub-icon:hover line {
            stroke: #005fa3;
          }
          @media (prefers-reduced-motion: reduce) {
            .voxelhub-icon line {
              transition: none;
            }
          }
        `}</style>
      </defs>
      {/* Arista vertical (hacia arriba) */}
      <line x1="18" y1="18" x2="18" y2="6" />
      {/* Arista horizontal (hacia izquierda) */}
      <line x1="18" y1="18" x2="6" y2="18" />
      {/* Arista isométrica (hacia atrás-arriba) */}
      <line x1="18" y1="18" x2="12" y2="12" />
    </svg>
  );
}
