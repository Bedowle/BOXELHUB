export default function CubeIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-orange-500"
      data-testid="cube-icon"
    >
      {/* Top face edges */}
      <line x1="20" y1="20" x2="50" y2="35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="35" x2="80" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="20" x2="50" y2="5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="5" x2="20" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      
      {/* Left face edges (where V will float) */}
      <line x1="20" y1="20" x2="20" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="35" x2="50" y2="75" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="60" x2="50" y2="75" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      
      {/* Right face edges (where H will float) */}
      <line x1="80" y1="20" x2="80" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="75" x2="80" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      
      {/* Bottom back edge */}
      <line x1="20" y1="60" x2="80" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      
      {/* LEFT FACE - V character */}
      <line x1="26" y1="32" x2="35" y2="55" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <line x1="35" y1="55" x2="44" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      
      {/* RIGHT FACE - H character */}
      <line x1="56" y1="32" x2="56" y2="58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <line x1="56" y1="45" x2="74" y2="45" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <line x1="74" y1="32" x2="74" y2="58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}
