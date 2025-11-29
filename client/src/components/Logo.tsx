import { useLocation } from "wouter";

export default function Logo() {
  const [, setLocation] = useLocation();

  return (
    <button
      onClick={() => setLocation("/")}
      className="fixed top-4 left-4 z-50 text-orange-500 font-bold text-2xl hover:opacity-80 transition-opacity"
      data-testid="button-logo"
    >
      VoxelHub ◼
    </button>
  );
}
