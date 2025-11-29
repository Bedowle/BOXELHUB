import { useLocation } from "wouter";
import logoPath from "@assets/image_1764454640480.png";

export default function Logo() {
  const [, setLocation] = useLocation();

  return (
    <button
      onClick={() => setLocation("/")}
      className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity"
      data-testid="button-logo"
    >
      <img src={logoPath} alt="VoxelHub" className="h-10 w-auto" />
    </button>
  );
}
