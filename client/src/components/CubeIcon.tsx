export default function CubeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-orange-500"
      data-testid="cube-icon"
    >
      {/* Three edges from top corner */}
      {/* Top-left edge (going down-left) */}
      <line x1="12" y1="2" x2="4" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Top-right edge (going down-right) */}
      <line x1="12" y1="2" x2="20" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Top-bottom edge (going straight down) */}
      <line x1="12" y1="2" x2="12" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Bottom edges to complete the partial cube outline */}
      {/* Left bottom edge */}
      <line x1="4" y1="8" x2="4" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Right bottom edge */}
      <line x1="20" y1="8" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Bottom-left to bottom edge */}
      <line x1="4" y1="20" x2="12" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Bottom-right to bottom edge */}
      <line x1="20" y1="20" x2="12" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
