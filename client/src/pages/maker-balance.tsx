import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Wallet, ArrowDown, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface MakerBalance {
  totalBalance: string;
  availableBalance: string;
}

interface MakerProfile {
  id: string;
  payoutMethod?: string;
  stripeEmail?: string;
  paypalEmail?: string;
  bankAccountIban?: string;
  bankAccountName?: string;
}

interface Payout {
  id: string;
  makerId: string;
  amount: string;
  method: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
}

const payoutSchema = z.object({
  amount: z.string().refine(val => {
    const num = parseFloat(val);
    return num > 0;
  }, "Amount must be greater than 0"),
});

type PayoutFormValues = z.infer<typeof payoutSchema>;

const payoutMethodSchema = z.object({
  method: z.enum(["stripe", "paypal", "bank"]),
  stripeEmail: z.string().email().optional().or(z.literal("")),
  paypalEmail: z.string().email().optional().or(z.literal("")),
  bankAccountIban: z.string().optional().or(z.literal("")),
  bankAccountName: z.string().optional().or(z.literal("")),
});

type PayoutMethodFormValues = z.infer<typeof payoutMethodSchema>;

export default function MakerBalance() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [editingMethod, setEditingMethod] = useState(false);

  const { data: balance } = useQuery<MakerBalance>({
    queryKey: ["/api/maker/balance"],
    enabled: !!user,
  });

  const { data: makerProfile } = useQuery<MakerProfile>({
    queryKey: ["/api/maker-profile"],
    enabled: !!user,
  });

  const { data: payouts } = useQuery<Payout[]>({
    queryKey: ["/api/maker/payouts"],
    enabled: !!user,
  });

  const payoutForm = useForm<PayoutFormValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      amount: "",
    },
  });

  const methodForm = useForm<PayoutMethodFormValues>({
    resolver: zodResolver(payoutMethodSchema),
    defaultValues: {
      method: (makerProfile?.payoutMethod as any) || "stripe",
      stripeEmail: makerProfile?.stripeEmail || "",
      paypalEmail: makerProfile?.paypalEmail || "",
      bankAccountIban: makerProfile?.bankAccountIban || "",
      bankAccountName: makerProfile?.bankAccountName || "",
    },
  });

  const { mutate: requestPayout, isPending: isPayoutPending } = useMutation({
    mutationFn: async (data: PayoutFormValues) => {
      const res = await apiRequest("POST", "/api/maker/request-payout", {
        amount: data.amount,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitud de payout exitosa",
        description: "Tu solicitud ha sido procesada.",
      });
      payoutForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/maker/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/maker/payouts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al solicitar payout",
        description: error.message || "Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const { mutate: updatePayoutMethod, isPending: isMethodPending } = useMutation({
    mutationFn: async (data: PayoutMethodFormValues) => {
      const res = await apiRequest("POST", "/api/maker/payout-method", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Método de pago actualizado",
        description: "Tu método de pago ha sido guardado.",
      });
      setEditingMethod(false);
      queryClient.invalidateQueries({ queryKey: ["/api/maker-profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar método de pago",
        description: error.message || "Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const formatBalance = (bal: string | undefined): string => {
    if (!bal) return "€0.00";
    const num = parseFloat(bal);
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getPayoutMethodLabel = (method: string) => {
    switch (method) {
      case "stripe":
        return "Stripe";
      case "paypal":
        return "PayPal";
      case "bank":
        return "Transferencia Bancaria";
      default:
        return "No configurado";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 dark:text-green-400";
      case "processing":
        return "text-blue-600 dark:text-blue-400";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "failed":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  if (!authLoading && !user) {
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            Mi Saldo
          </h1>
          <p className="text-muted-foreground">Gestiona tu saldo y solicita payouts</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-total-balance">
                {formatBalance(balance?.totalBalance)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Incluye saldos pendientes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Disponible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-available-balance">
                {formatBalance(balance?.availableBalance)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Listo para transferir</p>
            </CardContent>
          </Card>
        </div>

        {/* Payout Method */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Método de Pago</span>
              {!editingMethod && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingMethod(true)}
                  data-testid="button-edit-payout-method"
                >
                  Editar
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!editingMethod ? (
              <div>
                <p className="font-semibold mb-2">
                  {makerProfile?.payoutMethod ? getPayoutMethodLabel(makerProfile.payoutMethod) : "No configurado"}
                </p>
                {makerProfile?.payoutMethod === "stripe" && makerProfile?.stripeEmail && (
                  <p className="text-sm text-muted-foreground">{makerProfile.stripeEmail}</p>
                )}
                {makerProfile?.payoutMethod === "paypal" && makerProfile?.paypalEmail && (
                  <p className="text-sm text-muted-foreground">{makerProfile.paypalEmail}</p>
                )}
                {makerProfile?.payoutMethod === "bank" && (
                  <>
                    <p className="text-sm text-muted-foreground">IBAN: {makerProfile?.bankAccountIban}</p>
                    <p className="text-sm text-muted-foreground">Titular: {makerProfile?.bankAccountName}</p>
                  </>
                )}
              </div>
            ) : (
              <Form {...methodForm}>
                <form onSubmit={methodForm.handleSubmit(data => updatePayoutMethod(data))} className="space-y-4">
                  <FormField
                    control={methodForm.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selecciona método</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payout-method">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="bank">Transferencia Bancaria</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {methodForm.watch("method") === "stripe" && (
                    <FormField
                      control={methodForm.control}
                      name="stripeEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email para Stripe</FormLabel>
                          <FormControl>
                            <Input placeholder="email@example.com" {...field} data-testid="input-stripe-email" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {methodForm.watch("method") === "paypal" && (
                    <FormField
                      control={methodForm.control}
                      name="paypalEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email para PayPal</FormLabel>
                          <FormControl>
                            <Input placeholder="email@example.com" {...field} data-testid="input-paypal-email" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {methodForm.watch("method") === "bank" && (
                    <>
                      <FormField
                        control={methodForm.control}
                        name="bankAccountIban"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IBAN</FormLabel>
                            <FormControl>
                              <Input placeholder="ES9121000418450200051332" {...field} data-testid="input-iban" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={methodForm.control}
                        name="bankAccountName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Titular de la Cuenta</FormLabel>
                            <FormControl>
                              <Input placeholder="Tu nombre" {...field} data-testid="input-bank-name" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isMethodPending} data-testid="button-save-payout-method">
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingMethod(false)}
                      data-testid="button-cancel-payout-method"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Request Payout */}
        {makerProfile?.payoutMethod && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDown className="h-5 w-5" />
                Solicitar Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...payoutForm}>
                <form onSubmit={payoutForm.handleSubmit(data => requestPayout(data))} className="space-y-4">
                  <FormField
                    control={payoutForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad a transferir (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="100.00"
                            {...field}
                            data-testid="input-payout-amount"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="bg-muted p-3 rounded text-sm">
                    <p className="text-muted-foreground">
                      Disponible: <span className="font-semibold">{formatBalance(balance?.availableBalance)}</span>
                    </p>
                    {makerProfile.payoutMethod === "bank" && (
                      <p className="text-muted-foreground mt-2">Mínimo: €20.00</p>
                    )}
                    {(makerProfile.payoutMethod === "stripe" || makerProfile.payoutMethod === "paypal") && (
                      <p className="text-muted-foreground mt-2">Mínimo: €10.00</p>
                    )}
                  </div>
                  <Button type="submit" disabled={isPayoutPending} className="w-full" data-testid="button-request-payout">
                    Solicitar Payout
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Historial de Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payouts && payouts.length > 0 ? (
              <div className="space-y-3">
                {payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover-elevate"
                    data-testid={`payout-item-${payout.id}`}
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{formatBalance(payout.amount)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(payout.createdAt).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getStatusColor(payout.status)}`}>
                        {payout.status === "completed" && "Completado"}
                        {payout.status === "processing" && "En proceso"}
                        {payout.status === "pending" && "Pendiente"}
                        {payout.status === "failed" && "Fallido"}
                      </div>
                      <div className="text-xs text-muted-foreground">{getPayoutMethodLabel(payout.method)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sin historial de payouts aún</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
