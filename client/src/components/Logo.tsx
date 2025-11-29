import { useLocation } from "wouter";
import VoxelHubIcon from "./VoxelHubIcon";

export default function Logo() {
  const [, setLocation] = useLocation();

  return (
    <button
      onClick={() => setLocation("/")}
      className="fixed top-4 left-4 z-50 font-bold text-2xl hover:opacity-85 transition-opacity flex items-center gap-2 group"
      data-testid="button-logo"
      aria-label="VoxelHub - Ir a página principal"
    >
      <div className="text-[#007acc] group-hover:text-[#005fa3] transition-colors duration-150">
        <VoxelHubIcon size={24} />
      </div>
      <span className="text-foreground">VoxelHub</span>
    </button>
  );
}
