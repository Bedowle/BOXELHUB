import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Euro, Download, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import type { MarketplaceDesign } from "@shared/schema";

export default function MarketplaceDesignDetailPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/marketplace-design/:designId");
  const designId = params?.designId;
  const { toast } = useToast();
  const [customAmount, setCustomAmount] = useState("");
  const [paypalAvailable, setPaypalAvailable] = useState(false);

  const { data: design, isLoading, error } = useQuery<any>({
    queryKey: ["/api/marketplace/designs", designId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/designs/${designId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch design");
      return res.json();
    },
    enabled: !!designId,
  });

  const { data: maker } = useQuery({
    queryKey: ["/api/user", design?.makerId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${design?.makerId}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!design?.makerId,
  });

  const { data: accessInfo, isLoading: accessLoading } = useQuery({
    queryKey: ["/api/marketplace/designs", designId, "access"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/marketplace/designs/${designId}/access`, {
          credentials: "include",
        });
        if (!res.ok) {
          console.error("Access check failed:", res.status);
          return { canAccess: false, reason: "error" };
        }
        return res.json();
      } catch (err) {
        console.error("Access check error:", err);
        return { canAccess: false, reason: "error" };
      }
    },
    enabled: !!designId,
  });

  // Check PayPal availability
  useEffect(() => {
    fetch('/api/paypal/status')
      .then(res => res.json())
      .then(data => setPaypalAvailable(data.available))
      .catch(() => setPaypalAvailable(false));
  }, []);

  // Download design mutation
  const downloadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/marketplace/designs/${designId}/download`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const binaryString = atob(data.stlFileContent.split(",")[1]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Design downloaded" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to download design",
        variant: "destructive",
      });
    },
  });

  // Free acquisition mutation
  const acquireFreeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/marketplace/designs/${designId}/purchase-free`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Design acquired! You can now download it." });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/designs", designId, "access"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to acquire design",
        variant: "destructive",
      });
    },
  });

  // Stripe checkout mutation
  const stripeCheckoutMutation = useMutation({
    mutationFn: async (amount: string) => {
      const res = await fetch(`/api/marketplace/designs/${designId}/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      const { checkoutUrl } = await res.json();
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout",
        variant: "destructive",
      });
    },
  });

  // PayPal order creation mutation
  const paypalOrderMutation = useMutation({
    mutationFn: async (amount: string) => {
      const res = await fetch(`/api/marketplace/designs/${designId}/paypal-order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      const { approvalUrl } = await res.json();
      if (approvalUrl) {
        window.location.href = approvalUrl;
      } else {
        throw new Error("No approval URL received");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create PayPal order",
        variant: "destructive",
      });
    },
  });

  // Handle payment confirmation after redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const paymentStatus = params.get("payment");
    const isPayPal = params.get("paypal") === "true";
    const orderId = params.get("token");

    if (paymentStatus === "canceled") {
      toast({
        title: "Pago cancelado",
        description: "Volviendo a la página anterior...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.history.back();
      }, 2000);
      return;
    }

    if (sessionId && paymentStatus === "success" && designId && !isPayPal) {
      fetch(`/api/marketplace/designs/${designId}/confirm-payment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then(res => res.json())
        .then(data => {
          toast({
            title: "Success",
            description: "Payment completed! Design acquired. You can now download it.",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/marketplace/designs", designId, "access"] });
          window.history.replaceState({}, document.title, `/marketplace-design/${designId}`);
        })
        .catch(err => {
          toast({
            title: "Error",
            description: err.message || "Failed to record purchase",
            variant: "destructive",
          });
        });
    }

    if (orderId && paymentStatus === "success" && designId && isPayPal) {
      fetch(`/api/marketplace/designs/${designId}/paypal-capture`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })
        .then(res => res.json())
        .then(data => {
          toast({
            title: "Success",
            description: "Payment completed! Design acquired. You can now download it.",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/marketplace/designs", designId, "access"] });
          window.history.replaceState({}, document.title, `/marketplace-design/${designId}`);
        })
        .catch(err => {
          toast({
            title: "Error",
            description: err.message || "Failed to record purchase",
            variant: "destructive",
          });
        });
    }
  }, [designId, toast]);

  if (!match) return null;
  if (isLoading) return <div className="p-4">Cargando...</div>;
  if (error || !design) return <div className="p-4">Diseño no encontrado</div>;

  const makerInitial = maker?.username?.[0]?.toUpperCase() || "M";
  const priceDisplay = design.priceType === "free" ? "Gratis" : `€${Number(design.price).toFixed(2)}`;
  const canAccess = accessInfo?.canAccess ?? false;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="mb-6"
          data-testid="button-back-to-marketplace"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{design.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {design.priceType === "free"
                      ? "Gratis"
                      : design.priceType === "fixed"
                        ? "Precio Fijo"
                        : "Precio Mínimo"}
                  </Badge>
                  <Badge variant="outline">{design.material}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {design.imageUrl && (
              <div className="aspect-square w-full bg-muted rounded-lg overflow-hidden">
                <img
                  src={design.imageUrl}
                  alt={design.title}
                  className="w-full h-full object-cover"
                  data-testid="img-design-detail"
                />
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Descripción</h3>
              <p className="text-muted-foreground">{design.description}</p>
            </div>

            {/* Price Section */}
            <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Precio</p>
                <p className="text-2xl font-bold flex items-center">
                  <Euro className="h-6 w-6" />
                  {design.priceType === "free" ? "Gratis" : Number(design.price).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Purchase/Download Section */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold">Descargar Diseño</h3>

              {design.priceType === "free" ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Este diseño está disponible sin costo</p>
                  {!canAccess ? (
                    <Button
                      className="w-full"
                      onClick={() => acquireFreeMutation.mutate()}
                      disabled={acquireFreeMutation.isPending}
                      data-testid="button-acquire-free"
                    >
                      {acquireFreeMutation.isPending ? "Adquiriendo..." : "Obtener Diseño Gratis"}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => downloadMutation.mutate()}
                      disabled={downloadMutation.isPending}
                      data-testid="button-download"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadMutation.isPending ? "Descargando..." : "Descargar STL"}
                    </Button>
                  )}
                </div>
              ) : design.priceType === "minimum" ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Precio mínimo: €{Number(design.price).toFixed(2)} (puedes pagar más)
                  </p>
                  {canAccess ? (
                    <Button
                      className="w-full"
                      onClick={() => downloadMutation.mutate()}
                      disabled={downloadMutation.isPending}
                      data-testid="button-download"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadMutation.isPending ? "Descargando..." : "Descargar STL"}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">¿Quieres pagar el mínimo para acceso?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => stripeCheckoutMutation.mutate(String(Number(design.price).toFixed(2)))}
                          disabled={stripeCheckoutMutation.isPending || paypalOrderMutation.isPending}
                          data-testid="button-pay-minimum-stripe"
                        >
                          {stripeCheckoutMutation.isPending ? "..." : "Stripe"}
                        </Button>
                        {paypalAvailable && (
                          <Button
                            variant="outline"
                            onClick={() => paypalOrderMutation.mutate(String(Number(design.price).toFixed(2)))}
                            disabled={stripeCheckoutMutation.isPending || paypalOrderMutation.isPending}
                            data-testid="button-pay-minimum-paypal"
                          >
                            {paypalOrderMutation.isPending ? "..." : "PayPal"}
                          </Button>
                        )}
                      </div>
                      <div className="relative my-3">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">O pagar más</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min={Number(design.price) > 0 ? "0.5" : "0"}
                          placeholder={Number(design.price) > 0 ? "0.50" : "0.00"}
                          value={customAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              setCustomAmount("");
                            } else {
                              const regex = /^\d*\.?\d{0,2}$/;
                              if (regex.test(value)) {
                                setCustomAmount(value);
                              }
                            }
                          }}
                          data-testid="input-custom-amount"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => stripeCheckoutMutation.mutate(customAmount || String(design.price))}
                          disabled={stripeCheckoutMutation.isPending || paypalOrderMutation.isPending}
                          data-testid="button-checkout-stripe"
                        >
                          {stripeCheckoutMutation.isPending ? "..." : "Stripe"}
                        </Button>
                        {paypalAvailable && (
                          <Button
                            onClick={() => paypalOrderMutation.mutate(customAmount || String(design.price))}
                            disabled={stripeCheckoutMutation.isPending || paypalOrderMutation.isPending}
                            data-testid="button-checkout-paypal"
                          >
                            {paypalOrderMutation.isPending ? "..." : "PayPal"}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Fixed price */
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Precio fijo: €{Number(design.price).toFixed(2)}</p>
                  {canAccess ? (
                    <Button
                      className="w-full"
                      onClick={() => downloadMutation.mutate()}
                      disabled={downloadMutation.isPending}
                      data-testid="button-download"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadMutation.isPending ? "Descargando..." : "Descargar STL"}
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => stripeCheckoutMutation.mutate(String(design.price))}
                        disabled={stripeCheckoutMutation.isPending || paypalOrderMutation.isPending}
                        data-testid="button-checkout-fixed-stripe"
                      >
                        {stripeCheckoutMutation.isPending ? "..." : "Stripe"}
                      </Button>
                      {paypalAvailable && (
                        <Button
                          onClick={() => paypalOrderMutation.mutate(String(design.price))}
                          disabled={stripeCheckoutMutation.isPending || paypalOrderMutation.isPending}
                          data-testid="button-checkout-fixed-paypal"
                        >
                          {paypalOrderMutation.isPending ? "..." : "PayPal"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Maker Info */}
            {maker && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Diseñador</h3>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={maker.profileImageUrl} />
                    <AvatarFallback className="text-lg">{makerInitial}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold" data-testid="text-maker-name">
                      {maker.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {maker.firstName} {maker.lastName}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
