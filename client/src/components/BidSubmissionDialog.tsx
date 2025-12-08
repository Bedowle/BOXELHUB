import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBidSchema, type InsertBid } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface BidSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function BidSubmissionDialog({ open, onOpenChange, projectId }: BidSubmissionDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<InsertBid>({
    resolver: zodResolver(insertBidSchema),
    defaultValues: {
      projectId,
      makerId: user?.id || "",
      price: "",
      deliveryDays: 3,
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertBid) => {
      await apiRequest("POST", `/api/projects/${projectId}/bids`, data);
    },
    onSuccess: () => {
      toast({
        title: "Oferta enviada",
        description: "El cliente ha sido notificado de tu oferta",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "my-bid"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Iniciando sesión...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la oferta",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBid) => {
    mutation.mutate({ ...data, projectId, makerId: user?.id || "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Oferta</DialogTitle>
          <DialogDescription>
            Completa los detalles de tu oferta. El cliente podrá ver tu perfil y decidir.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio (€)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        €
                      </span>
                      <Input
                        type="text"
                        placeholder="45.00"
                        className="pl-8"
                        {...field}
                        data-testid="input-bid-price"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Introduce tu precio total para este proyecto
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Delivery Days */}
            <FormField
              control={form.control}
              name="deliveryDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiempo de Entrega (días)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-delivery-days"
                    />
                  </FormControl>
                  <FormDescription>
                    ¿Cuántos días necesitas para completar el proyecto? (máximo 30 días)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe tu experiencia con este tipo de proyectos, materiales que usarás, acabado, etc."
                      className="min-h-24"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-bid-message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-back-bid"
              >
                ← Atrás
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1"
                data-testid="button-send-bid"
              >
                {mutation.isPending ? "Enviando..." : "Enviar Oferta"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
