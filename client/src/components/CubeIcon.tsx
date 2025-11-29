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
      {/* Three solid edges from top corner vertex - viewed from above */}
      {/* Top-left edge (going up-left) */}
      <line x1="50" y1="50" x2="20" y2="20" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      
      {/* Top-right edge (going up-right) */}
      <line x1="50" y1="50" x2="80" y2="20" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      
      {/* Bottom edge (going down) */}
      <line x1="50" y1="50" x2="50" y2="85" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      
      {/* Disintegrating edges - fading to pixels */}
      {/* Left back edge dissolving */}
      <line x1="20" y1="20" x2="25" y2="40" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
      <circle cx="25" cy="45" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="24" cy="52" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="26" cy="58" r="1" fill="currentColor" opacity="0.2" />
      
      {/* Right back edge dissolving */}
      <line x1="80" y1="20" x2="75" y2="40" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
      <circle cx="75" cy="45" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="76" cy="52" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="74" cy="58" r="1" fill="currentColor" opacity="0.2" />
      
      {/* Back bottom edge dissolving */}
      <line x1="25" y1="40" x2="75" y2="40" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      <circle cx="30" cy="42" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="40" cy="44" r="1.2" fill="currentColor" opacity="0.3" />
      <circle cx="50" cy="45" r="1" fill="currentColor" opacity="0.2" />
      <circle cx="60" cy="44" r="1.2" fill="currentColor" opacity="0.3" />
      <circle cx="70" cy="42" r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
