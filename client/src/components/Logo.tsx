import { useLocation } from "wouter";
import logoSvg from "@assets/voxelhub-logo.svg";

export default function Logo() {
  const [, setLocation] = useLocation();

  return (
    <button
      onClick={() => setLocation("/")}
      className="fixed top-4 left-4 z-50 flex items-center gap-2 hover:opacity-80 transition-opacity"
      data-testid="button-logo"
    >
      <img src={logoSvg} alt="VoxelHub" className="h-10 w-10" />
      <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
        VoxelHub
      </span>
    </button>
  );
}
