import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MakerProfileDialog } from "@/components/MakerProfileDialog";
import { ArrowLeft, Edit2, Star, Printer, DollarSign, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MakerProfile } from "@shared/schema";

export default function MakerProfile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("");
  const [stripeEmail, setStripeEmail] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankName, setBankName] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const { toast } = useToast();

  const { data: profile, isLoading: profileLoading } = useQuery<MakerProfile>({
    queryKey: ["/api/maker-profile"],
    enabled: !!user,
  });

  const { data: balance } = useQuery<any>({
    queryKey: ["/api/maker/balance"],
    enabled: !!user,
  });

  const { data: payouts } = useQuery<any>({
    queryKey: ["/api/maker/payouts"],
    enabled: !!user,
  });

  const updatePayoutMethodMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/maker/payout-method", data);
    },
    onSuccess: () => {
      toast({ title: "Método de pago actualizado", description: "Tu configuración ha sido guardada." });
      queryClient.invalidateQueries({ queryKey: ["/api/maker-profile"] });
      setPayoutMethod("");
      setStripeEmail("");
      setPaypalEmail("");
      setBankIban("");
      setBankName("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const requestPayoutMutation = useMutation({
    mutationFn: async (amount: string) => {
      return apiRequest("POST", "/api/maker/request-payout", { amount });
    },
    onSuccess: () => {
      toast({ title: "Payout solicitado", description: "Tu solicitud de pago ha sido procesada." });
      queryClient.invalidateQueries({ queryKey: ["/api/maker/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/maker/balance"] });
      setPayoutAmount("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleUpdatePayoutMethod = () => {
    if (!payoutMethod) {
      toast({ title: "Error", description: "Selecciona un método de pago", variant: "destructive" });
      return;
    }

    const data: any = { method: payoutMethod };

    if (payoutMethod === "stripe" && stripeEmail) {
      data.stripeEmail = stripeEmail;
    } else if (payoutMethod === "paypal" && paypalEmail) {
      data.paypalEmail = paypalEmail;
    } else if (payoutMethod === "bank" && bankIban && bankName) {
      data.bankAccountIban = bankIban;
      data.bankAccountName = bankName;
    }

    updatePayoutMethodMutation.mutate(data);
  };

  const handleRequestPayout = () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast({ title: "Error", description: "Ingresa una cantidad válida", variant: "destructive" });
      return;
    }
    requestPayoutMutation.mutate(payoutAmount);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        {/* Profile Header Card */}
        <Card className="mb-8 border-2 border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:via-transparent dark:to-secondary/10">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              {/* Avatar */}
              <Avatar className="h-24 w-24 flex-shrink-0">
                <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || "User"} />
                <AvatarFallback className="text-2xl">
                  {(user.firstName || "U").charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-4xl font-bold mb-1">{user.username}</h1>
                  {user.showFullName && (
                    <p className="text-muted-foreground">{user.firstName} {user.lastName}</p>
                  )}
                </div>

                {/* Rating */}
                {profile && (
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => {
                          const rating = typeof profile.rating === 'string' ? parseFloat(profile.rating) : (profile.rating || 0);
                          return (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.floor(rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : i < rating
                                  ? "fill-yellow-400 text-yellow-400 opacity-50"
                                  : "text-muted-foreground"
                              }`}
                            />
                          );
                        })}
                      </div>
                      <span className="font-semibold text-lg">
                        {(typeof profile.rating === 'string' ? parseFloat(profile.rating) : (profile.rating || 0)).toFixed(2)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation("/maker/reviews")}
                      data-testid="button-view-reviews"
                    >
                      {profile.totalReviews || 0} reseña{(profile.totalReviews || 0) !== 1 ? "s" : ""}
                    </Button>
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <Button
                onClick={() => setProfileDialogOpen(true)}
                className="gap-2"
                data-testid="button-edit-profile"
              >
                <Edit2 className="h-4 w-4" />
                Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Printer Details */}
        {profile && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Printer Info Card */}
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Printer className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Impresora</h2>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{profile.printerType}</span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Materiales:</span>
                      <div className="text-right">
                        {profile.materials && profile.materials.length > 0 ? (
                          <div className="space-y-1">
                            {profile.materials.map((material) => (
                              <Badge key={material} variant="outline" className="text-xs">
                                {material}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="font-medium">No especificado</span>
                        )}
                      </div>
                    </div>

                    {profile.hasMulticolor && (
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground">Multicolor:</span>
                        <Badge className="text-xs">Sí</Badge>
                      </div>
                    )}

                    {profile.maxColors && profile.maxColors > 1 && (
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground">Máx. Colores:</span>
                        <span className="font-medium">{profile.maxColors}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dimensions Card */}
            {(profile.maxPrintDimensionX || profile.maxPrintDimensionY || profile.maxPrintDimensionZ) && (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Dimensiones Máximas</h2>

                    <div className="space-y-3 text-sm">
                      {profile.maxPrintDimensionX && (
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Ancho (X):</span>
                          <span className="font-medium">{profile.maxPrintDimensionX} mm</span>
                        </div>
                      )}

                      {profile.maxPrintDimensionY && (
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Profundidad (Y):</span>
                          <span className="font-medium">{profile.maxPrintDimensionY} mm</span>
                        </div>
                      )}

                      {profile.maxPrintDimensionZ && (
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Alto (Z):</span>
                          <span className="font-medium">{profile.maxPrintDimensionZ} mm</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Card */}
            {profile.location && (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Ubicación</h2>
                    <p className="text-sm">{profile.location}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Capabilities Card */}
            {profile.capabilities && (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Descripción</h2>
                    <p className="text-sm text-muted-foreground">{profile.capabilities}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Balance Card - Hidden for now */}
            {false && balance && (
              <Card className="md:col-span-2">
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Wallet className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold">Mi Balance</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Balance Total</p>
                        <p className="text-2xl font-bold">€{balance.totalBalance}</p>
                      </div>
                      <div className="p-4 bg-green-500/10 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Balance Disponible</p>
                        <p className="text-2xl font-bold">€{balance.availableBalance}</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      *El balance pendiente estará disponible en {profile?.payoutMethod === "bank" ? "15" : "7"} días
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payout Configuration Card - Hidden for now */}
            {false && (
              <Card className="md:col-span-2">
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold">Configurar Pagos</h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Método de Pago</label>
                        <select
                          value={payoutMethod}
                          onChange={(e) => {
                            setPayoutMethod(e.target.value);
                            setStripeEmail("");
                            setPaypalEmail("");
                            setBankIban("");
                            setBankName("");
                          }}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                          data-testid="select-payout-method"
                        >
                          <option value="">Selecciona un método...</option>
                          <option value="stripe">Stripe (7 días de retención, mín. €10)</option>
                          <option value="paypal">PayPal (7 días de retención, mín. €10)</option>
                          <option value="bank">Transferencia Bancaria (15 días, mín. €20)</option>
                        </select>
                      </div>

                      {payoutMethod === "stripe" && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Email de Stripe</label>
                          <input
                            type="email"
                            value={stripeEmail}
                            onChange={(e) => setStripeEmail(e.target.value)}
                            placeholder="tu-email@example.com"
                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                            data-testid="input-stripe-email"
                          />
                        </div>
                      )}

                      {payoutMethod === "paypal" && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Email de PayPal</label>
                          <input
                            type="email"
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                            placeholder="tu-email@example.com"
                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                            data-testid="input-paypal-email"
                          />
                        </div>
                      )}

                      {payoutMethod === "bank" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-2">IBAN</label>
                            <input
                              type="text"
                              value={bankIban}
                              onChange={(e) => setBankIban(e.target.value)}
                              placeholder="ES91 2100 0418 4502 0005 1332"
                              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                              data-testid="input-bank-iban"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Titular de la Cuenta</label>
                            <input
                              type="text"
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              placeholder="Tu nombre"
                              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                              data-testid="input-bank-name"
                            />
                          </div>
                        </>
                      )}

                      <Button
                        onClick={handleUpdatePayoutMethod}
                        disabled={updatePayoutMethodMutation.isPending}
                        className="w-full"
                        data-testid="button-save-payout-method"
                      >
                        {updatePayoutMethodMutation.isPending ? "Guardando..." : "Guardar Método"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payout History - Hidden for now */}
            {false && payouts && payouts.length > 0 && (
              <Card className="md:col-span-2">
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Historial de Payouts</h2>

                    <div className="space-y-2">
                      {payouts.map((payout: any) => (
                        <div key={payout.id} className="flex justify-between items-center p-3 border border-border rounded-lg">
                          <div>
                            <p className="font-medium">€{payout.amount}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payout.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={payout.status === "completed" ? "default" : "outline"}>
                              {payout.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Profile Edit Dialog */}
      <MakerProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} profile={profile || null} />
    </div>
  );
}
