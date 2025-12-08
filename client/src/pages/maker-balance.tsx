import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Wallet, ArrowDown, Download, CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { validateIBAN, formatIBAN } from "@/lib/iban-validator";

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
  stripeConnectAccountId: z.string().optional().or(z.literal("")),
  paypalAccountId: z.string().email("Email inválido").optional().or(z.literal("")),
  bankAccountIban: z.string()
    .refine(
      (val) => !val || validateIBAN(val),
      "IBAN inválido. Verifica que sea correcto"
    )
    .optional()
    .or(z.literal("")),
  bankAccountName: z.string()
    .refine(
      (val) => !val || val.length >= 2,
      "El nombre debe tener al menos 2 caracteres"
    )
    .optional()
    .or(z.literal("")),
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

  const { data: makerProfile, refetch: refetchProfile } = useQuery<MakerProfile>({
    queryKey: ["/api/maker-profile"],
    enabled: !!user,
    staleTime: 0, // Always refetch when invalidated
  });

  const { data: payouts, refetch: refetchPayouts } = useQuery<Payout[]>({
    queryKey: ["/api/maker/payouts"],
    enabled: !!user,
  });

  // Verify payouts manually when page loads
  useEffect(() => {
    if (!user) return;
    
    const verifyPayouts = async () => {
      try {
        await apiRequest("GET", "/api/maker/verify-payouts");
        refetchPayouts();
      } catch (error) {
        console.error("Error verifying payouts:", error);
      }
    };
    
    // Verify once when page loads
    verifyPayouts();
  }, [user]);

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
      stripeConnectAccountId: (makerProfile as any)?.stripeConnectAccountId || "",
      paypalAccountId: (makerProfile as any)?.paypalEmail || "",
      bankAccountIban: makerProfile?.bankAccountIban || "",
      bankAccountName: makerProfile?.bankAccountName || "",
    },
  });

  // Update form when profile changes
  useEffect(() => {
    if (makerProfile && !editingMethod) {
      console.log("🔍 Maker profile updated:", makerProfile);
      methodForm.reset({
        method: (makerProfile.payoutMethod as any) || "stripe",
        stripeConnectAccountId: (makerProfile as any)?.stripeConnectAccountId || "",
        paypalAccountId: (makerProfile as any)?.paypalEmail || "",
        bankAccountIban: makerProfile.bankAccountIban || "",
        bankAccountName: makerProfile.bankAccountName || "",
      });
    }
  }, [makerProfile, editingMethod, methodForm]);

  const { mutate: requestPayout, isPending: isPayoutPending } = useMutation({
    mutationFn: async (data: PayoutFormValues) => {
      const res = await apiRequest("POST", "/api/maker/request-payout", {
        amount: data.amount,
      });
      return res.json();
    },
    onSuccess: () => {
      console.log("✅ Payout created successfully!");
      toast({
        title: "Payout procesado",
        description: "Tu solicitud ha sido creada.",
      });
      payoutForm.reset();
      // Refetch IMMEDIATELY to show the new payout
      queryClient.refetchQueries({ queryKey: ["/api/maker/payouts"] });
      queryClient.refetchQueries({ queryKey: ["/api/maker/balance"] });
    },
    onError: (error: any) => {
      console.error("❌ Error requesting payout:", error);
      toast({
        title: "Error al solicitar payout",
        description: error.message || "Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const { mutate: updatePayoutMethod, isPending: isMethodPending } = useMutation({
    mutationFn: async (data: PayoutMethodFormValues) => {
      console.log("📤 Sending payout method:", data);
      const res = await apiRequest("POST", "/api/maker/payout-method", data);
      const result = await res.json();
      console.log("✅ Response:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("✅ Payout method saved successfully, profile:", data.profile);
      toast({
        title: "Método de pago actualizado",
        description: "Tu método de pago ha sido guardado.",
      });
      // Force refresh from server immediately
      setEditingMethod(false);
      setTimeout(() => {
        refetchProfile();
      }, 100);
    },
    onError: (error: any) => {
      console.error("❌ Error updating payout method:", error);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "processing":
        return <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />;
      case "pending":
        return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
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
      <header className="border-b px-4 py-4 sticky top-0 z-50 bg-gradient-to-r from-secondary/10 via-transparent to-primary/10 dark:from-secondary/20 dark:via-slate-900/50 dark:to-primary/20 backdrop-blur-md border-secondary/20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="hover-elevate"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
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
              <div className="space-y-3">
                <div>
                  <p className="font-semibold mb-2">
                    {makerProfile?.payoutMethod ? getPayoutMethodLabel(makerProfile.payoutMethod) : "No configurado"}
                  </p>
                  {makerProfile?.payoutMethod === "stripe" && (
                    <>
                      {makerProfile?.bankAccountIban ? (
                        <>
                          <p className="text-sm text-muted-foreground">IBAN: {makerProfile?.bankAccountIban}</p>
                          <p className="text-sm text-muted-foreground">Titular: {makerProfile?.bankAccountName}</p>
                        </>
                      ) : (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">Por configurar</p>
                      )}
                    </>
                  )}
                  {makerProfile?.payoutMethod === "paypal" && (
                    <>
                      {(makerProfile as any)?.paypalEmail ? (
                        <p className="text-sm text-muted-foreground">Email: {(makerProfile as any).paypalEmail}</p>
                      ) : (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">Por configurar</p>
                      )}
                    </>
                  )}
                  {makerProfile?.payoutMethod === "bank" && (
                    <>
                      {makerProfile?.bankAccountIban ? (
                        <>
                          <p className="text-sm text-muted-foreground">IBAN: {makerProfile?.bankAccountIban}</p>
                          <p className="text-sm text-muted-foreground">Titular: {makerProfile?.bankAccountName}</p>
                        </>
                      ) : (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">Por configurar</p>
                      )}
                    </>
                  )}
                </div>
                {process.env.NODE_ENV === "development" && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-900 dark:text-blue-100">
                      ℹ️ <strong>Modo desarrollo:</strong> Los payouts se simulan y se marcan como completados. En producción se enviarán realmente.
                    </p>
                  </div>
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
                        <Select value={field.value} onValueChange={(value) => {
                          field.onChange(value);
                          // Reset fields when method changes
                          methodForm.reset({
                            method: value as any,
                            bankAccountIban: "",
                            bankAccountName: "",
                            paypalAccountId: "",
                            stripeConnectAccountId: "",
                          });
                        }}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payout-method">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="stripe">Stripe (IBAN)</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="bank">Transferencia Bancaria (IBAN)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {methodForm.watch("method") === "stripe" && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-900 dark:text-blue-100">Los payouts se realizarán a través de tu cuenta bancaria conectada a Stripe.</p>
                      <FormField
                        control={methodForm.control}
                        name="bankAccountIban"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IBAN</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ES9121000418450200051332" 
                                {...field}
                                onChange={(e) => {
                                  const formatted = e.target.value.toUpperCase();
                                  field.onChange(formatted);
                                }}
                                data-testid="input-stripe-iban" 
                              />
                            </FormControl>
                            <FormMessage />
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
                              <Input placeholder="Tu nombre completo" {...field} data-testid="input-stripe-account-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {methodForm.watch("method") === "paypal" && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-900 dark:text-blue-100">Los payouts se realizarán a tu cuenta PayPal.</p>
                      <FormField
                        control={methodForm.control}
                        name="paypalAccountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email de PayPal</FormLabel>
                            <FormControl>
                              <Input placeholder="tu-email@example.com" {...field} data-testid="input-paypal-account-id" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {methodForm.watch("method") === "bank" && (
                    <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-900 dark:text-amber-100">Transferencia SEPA directa a tu cuenta bancaria (mínimo €20).</p>
                      <FormField
                        control={methodForm.control}
                        name="bankAccountIban"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IBAN</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ES9121000418450200051332" 
                                {...field}
                                onChange={(e) => {
                                  const formatted = e.target.value.toUpperCase();
                                  field.onChange(formatted);
                                }}
                                data-testid="input-iban" 
                              />
                            </FormControl>
                            <FormMessage />
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
                              <Input placeholder="Tu nombre completo" {...field} data-testid="input-bank-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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


        {/* Environment Notice */}
        {process.env.NODE_ENV === "development" && (
          <Card className="mb-8 border-blue-400 bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">🧪 Desarrollo - Payouts Simulados (USD)</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    Los payouts se simulan en desarrollo para testing. <strong>En producción (cuando publiques), funcionarán REALES con EUR.</strong>
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Aparecerán en tu Balance como "Completados" para simular el flujo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                    {makerProfile.payoutMethod === "stripe" && (
                      <p className="text-muted-foreground mt-2">Mínimo: €10.00 (a través de Stripe)</p>
                    )}
                    {makerProfile.payoutMethod === "paypal" && (
                      <p className="text-muted-foreground mt-2">Mínimo: €10.00 (a través de PayPal)</p>
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
                    className="flex items-center justify-between gap-3 p-4 border border-border rounded-lg hover-elevate transition-all"
                    data-testid={`payout-item-${payout.id}`}
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(payout.status)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base">{formatBalance(payout.amount)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(payout.createdAt).toLocaleDateString("es-ES", { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-sm font-medium ${getStatusColor(payout.status)}`}>
                        {payout.status === "completed" && "✓ Completado"}
                        {payout.status === "processing" && "En proceso"}
                        {payout.status === "pending" && "Pendiente"}
                        {payout.status === "failed" && "Fallido"}
                      </div>
                      <div className="text-xs text-muted-foreground">{getPayoutMethodLabel(payout.payoutMethod)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Sin historial de payouts aún</p>
                <p className="text-xs text-muted-foreground/75 mt-1">Cuando hagas un payout, aparecerá aquí</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
