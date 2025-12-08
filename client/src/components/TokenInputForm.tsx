import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TokenInputFormProps {
  onTokenSubmit: (token: string) => void;
  onCancel: () => void;
}

export default function TokenInputForm({ onTokenSubmit, onCancel }: TokenInputFormProps) {
  const [token, setToken] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onTokenSubmit(token.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4 text-sm">
        <p className="text-blue-900 dark:text-blue-100">
          <strong>Instrucciones:</strong> Copia el token del email de recuperación que recibiste y pégalo abajo.
        </p>
      </div>

      <div>
        <Label htmlFor="reset-token" className="text-sm">
          Token de Recuperación
        </Label>
        <Input
          id="reset-token"
          type="text"
          placeholder="Pega el token aquí"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          data-testid="input-reset-token"
          required
        />
        <p className="text-xs text-muted-foreground mt-2">
          El token tiene aproximadamente 20-25 caracteres
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!token.trim()}
        size="lg"
        data-testid="button-submit-token"
      >
        Continuar
      </Button>

      <Button 
        type="button"
        variant="ghost" 
        className="w-full"
        onClick={onCancel}
        data-testid="button-cancel-token"
      >
        Cancelar
      </Button>
    </form>
  );
}
