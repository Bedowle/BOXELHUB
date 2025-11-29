export default function CubeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-orange-500"
      data-testid="cube-icon"
    >
      {/* Top-left edge (diagonal up-left) */}
      <line x1="50" y1="50" x2="20" y2="10" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Top-right edge (diagonal up-right) */}
      <line x1="50" y1="50" x2="80" y2="10" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Bottom edge (vertical down) */}
      <line x1="50" y1="50" x2="50" y2="90" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
