import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateBidSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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
import { z } from "zod";
import { useState } from "react";

type UpdateBidData = z.infer<typeof updateBidSchema>;

interface BidEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bidId: string;
  projectId: string;
  currentPrice: string;
  currentDeliveryDays: number;
  currentMessage?: string;
}

export function BidEditDialog({
  open,
  onOpenChange,
  bidId,
  projectId,
  currentPrice,
  currentDeliveryDays,
  currentMessage,
}: BidEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const form = useForm<UpdateBidData>({
    resolver: zodResolver(updateBidSchema),
    defaultValues: {
      price: currentPrice,
      deliveryDays: currentDeliveryDays,
      message: currentMessage || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: UpdateBidData) => {
      await apiRequest("PATCH", `/api/bids/${bidId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Oferta actualizada",
        description: "Tu oferta ha sido actualizada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/bids/my-bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "my-bid"] });
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
        description: error.message || "No se pudo actualizar la oferta",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateBidData) => {
    mutation.mutate(data);
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/bids/${bidId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Oferta eliminada",
        description: "Tu oferta ha sido eliminada",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/bids/my-bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/my-bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bids/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "my-bid"] });
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
        description: error.message || "No se pudo eliminar la oferta",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    setConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    setConfirmDelete(false);
    deleteMutation.mutate();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Oferta</DialogTitle>
          <DialogDescription>
            Actualiza los detalles de tu oferta. Solo puedes editar ofertas pendientes.
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
                        data-testid="input-edit-bid-price"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Introduce tu nuevo precio total para este proyecto
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
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      data-testid="input-edit-delivery-days"
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
                      data-testid="input-edit-bid-message"
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
                data-testid="button-cancel-edit-bid"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1"
                data-testid="button-update-bid"
              >
                {mutation.isPending ? "Actualizando..." : "Actualizar"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                data-testid="button-delete-bid"
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Oferta</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta oferta? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="flex-1"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
