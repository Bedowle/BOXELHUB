import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage.tsx";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock } from "lucide-react";

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export default function LoginForm({ onSuccess, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", {
        email,
        password,
      });
      return res;
    },
    onSuccess: () => {
      toast({
        title: t('auth.loginSuccess'),
        description: t('common.loading'),
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('auth.invalidCredentials'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: t('common.error'),
        description: t('validation.materialRequired'),
        variant: "destructive",
      });
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="login-email" className="text-sm">
          {t('auth.email')}
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={mutation.isPending}
            className="pl-10"
            data-testid="input-login-email"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="login-password" className="text-sm">
          {t('auth.password')}
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="login-password"
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={mutation.isPending}
            className="pl-10"
            data-testid="input-login-password"
            required
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1"
          data-testid="button-login-submit"
        >
          {mutation.isPending ? t('common.loading') : t('auth.login')}
        </Button>
        {onForgotPassword && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onForgotPassword}
            disabled={mutation.isPending}
            data-testid="button-forgot-password"
          >
            {t('auth.loginSuccess')}
          </Button>
        )}
      </div>
    </form>
  );
}
