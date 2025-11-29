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
      {/* Top face edges */}
      <line x1="20" y1="20" x2="50" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="35" x2="80" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="80" y1="20" x2="50" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="5" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Left face edges (where V will float) */}
      <line x1="20" y1="20" x2="20" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="35" x2="50" y2="75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="60" x2="50" y2="75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Right face edges (where H will float) */}
      <line x1="80" y1="20" x2="80" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="75" x2="80" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Bottom back edge */}
      <line x1="20" y1="60" x2="80" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* LEFT FACE - V character */}
      <line x1="28" y1="35" x2="35" y2="55" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="35" y1="55" x2="42" y2="35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      
      {/* RIGHT FACE - H character */}
      <line x1="58" y1="35" x2="58" y2="55" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="58" y1="45" x2="72" y2="45" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="72" y1="35" x2="72" y2="55" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}
