import { useLanguage } from "@/hooks/useLanguage.tsx";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
      className="flex items-center gap-2"
      title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
      data-testid="button-language-switcher"
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">
        {language === 'es' ? 'EN' : 'ES'}
      </span>
    </Button>
  );
}
