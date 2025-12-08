import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { count, eq, and, avg } from "drizzle-orm";

import { storage } from "./storage";
import { db } from "./db";
import {
  insertProjectSchema,
  insertBidSchema,
  updateBidSchema,
  insertMakerProfileSchema,
  insertMessageSchema,
  insertReviewSchema,
  insertMarketplaceDesignSchema,
  users,
  projects,
  reviews,
} from "@shared/schema";
import { z } from "zod";

import { getUncachableStripeClient } from "./stripeClient";
import { getPayPalClientId } from "./paypalClient";

// WebSocket clients map
const wsClients = new Map<string, WebSocket>();

// Auth middleware and helpers (replacement for isAuthenticated/getAuthenticatedUserId)
function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}
function getAuthenticatedUserId(req: any) {
  return req.session?.userId;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Stats endpoint (public - no auth required)
  app.get("/api/stats", async (_req: any, res) => {
    try {
      // Count verified makers (makers with isEmailVerified = true)
      const verifiedMakersResult = await db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.userType, "maker"), eq(users.isEmailVerified, true)));
      const verifiedMakers = verifiedMakersResult[0]?.count || 0;

      // Count completed projects
      const completedProjectsResult = await db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.status, "completed"));
      const completedProjects = completedProjectsResult[0]?.count || 0;

      // Calculate average rating from all reviews
      const avgRatingResult = await db
        .select({ avgRating: avg(reviews.rating) })
        .from(reviews);
      const averageRating = avgRatingResult[0]?.avgRating 
        ? parseFloat(avgRatingResult[0].avgRating.toString())
        : 0;

      res.json({
        verifiedMakers: parseInt(verifiedMakers.toString()) || 0,
        completedProjects: parseInt(completedProjects.toString()) || 0,
        averageRating: Math.round(averageRating * 10) / 10 || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.json({
        verifiedMakers: 0,
        completedProjects: 0,
        averageRating: 0,
      });
    }
  });

  // Auth routes
  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/user/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Maker balance endpoints (MUST be before /api/maker/:id to avoid param matching)
  app.get("/api/maker/balance", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const totalBalance = await storage.getMakerBalance(userId);
      const availableBalance = await storage.getMakerAvailableBalance(userId);

      res.json({
        totalBalance,
        availableBalance,
        message: "Balance fetched successfully",
      });
    } catch (error: any) {
      console.error("Error fetching balance:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to fetch balance" });
    }
  });

  // Update payout method
  app.post("/api/maker/payout-method", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const {
        method,
        stripeEmail,
        paypalEmail,
        bankAccountIban,
        bankAccountName,
        stripeConnectAccountId,
        paypalAccountId,
      } = req.body;

      if (!method || !["stripe", "paypal", "bank"].includes(method)) {
        return res.status(400).json({ message: "Invalid payout method" });
      }

      const profile = await storage.updatePayoutMethod(userId, method, {
        stripeEmail,
        paypalEmail,
        bankAccountIban,
        bankAccountName,
        stripeConnectAccountId,
        paypalAccountId,
      });

      res.json({
        message: "Payout method updated successfully",
        profile,
      });
    } catch (error: any) {
      console.error("Error updating payout method:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to update payout method" });
    }
  });

  // Get maker payouts
  app.get("/api/maker/payouts", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const payouts = await storage.getMakerPayouts(userId);
      res.json(payouts);
    } catch (error: any) {
      console.error("Error fetching payouts:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to fetch payouts" });
    }
  });

  // Verify payout status against Stripe (real verification)
  app.get("/api/maker/verify-payouts", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const stripe = await getUncachableStripeClient();
      const payouts = await storage.getMakerPayouts(userId);
      const results: Array<{ id: string; oldStatus: string; newStatus: string }> = [];

      for (const payout of payouts) {
        if (payout.status === "pending" || payout.status === "processing") {
          if (payout.stripePayoutId) {
            try {
              const stripeStatus = await stripe.payouts.retrieve(
                payout.stripePayoutId
              );
              console.log(
                `[Payout Verification] ${payout.id}: Stripe status = ${stripeStatus.status}`
              );

              let newStatus = payout.status;
              if (stripeStatus.status === "paid") newStatus = "completed";
              else if (
                stripeStatus.status === "in_transit" ||
                stripeStatus.status === "pending"
              )
                newStatus = "processing";
              else if (
                stripeStatus.status === "failed" ||
                stripeStatus.status === "canceled"
              )
                newStatus = "failed";

              if (newStatus !== payout.status) {
                await storage.updatePayoutStatus(
                  payout.id,
                  newStatus,
                  payout.stripePayoutId
                );

                console.log(
                  `[Payout Update] ${payout.id}: ${payout.status} → ${newStatus}`
                );

                // Notify via WebSocket
                const wsClient = wsClients.get(userId);
                if (wsClient && wsClient.readyState === WebSocket.OPEN) {
                  wsClient.send(
                    JSON.stringify({
                      type: "payout_status_update",
                      payoutId: payout.id,
                      status: newStatus,
                    })
                  );
                }

                results.push({
                  id: payout.id,
                  oldStatus: payout.status,
                  newStatus,
                });
              }
            } catch (e) {
              console.error(
                `Error checking Stripe payout ${payout.stripePayoutId}:`,
                e
              );
            }
          }
        }
      }

      res.json({ verified: results.length > 0, updates: results });
    } catch (error: any) {
      console.error("Error verifying payouts:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to verify payouts" });
    }
  });

  // Request payout
  app.post("/api/maker/request-payout", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { amount } = req.body;
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const profile = await storage.getMakerProfile(userId);
      if (!profile || !profile.payoutMethod) {
        return res
          .status(400)
          .json({ message: "Please configure a payout method first" });
      }

      // Verify connected account for Stripe/PayPal
      const isDevelopment = process.env.NODE_ENV === "development";
      if (profile.payoutMethod === "stripe" && !profile.stripeConnectAccountId && !isDevelopment) {
        return res.status(400).json({ message: "Please connect your Stripe account first" });
      }
      if (profile.payoutMethod === "paypal" && !profile.paypalAccountId && !isDevelopment) {
        return res.status(400).json({ message: "Please connect your PayPal account first" });
      }

      // Check minimums
      if (profile.payoutMethod === "bank" && parseFloat(amount) < 20) {
        return res.status(400).json({ message: "Minimum €20.00 required for bank transfers" });
      }
      if ((profile.payoutMethod === "stripe" || profile.payoutMethod === "paypal") && parseFloat(amount) < 10) {
        return res.status(400).json({ message: "Minimum €10.00 required for Stripe/PayPal payouts" });
      }

      // Check available balance
      const availableBalance = await storage.getMakerAvailableBalance(userId);
      if (parseFloat(availableBalance) < parseFloat(amount)) {
        return res.status(400).json({
          message: `Insufficient balance. Available: €${availableBalance}`,
        });
      }

      // Create payout request
      const payout = await storage.createMakerPayout(
        userId,
        amount,
        profile.payoutMethod
      );

      // Execute payout in background based on method
      if (profile.payoutMethod === "stripe") {
        const accountId = profile.stripeConnectAccountId || "acct_test_development";
        executeStripePayout(accountId, amount, payout).catch((err) => {
          console.error("Error executing Stripe payout:", err);
        });
      } else if (profile.payoutMethod === "paypal") {
        const paypalRecipient =
          profile.paypalAccountId ||
          (profile as any)?.paypalEmail ||
          (profile as any)?.stripeEmail ||
          "test@voxelhub.dev";

        executePayPalPayout(paypalRecipient, amount, payout).catch((err) => {
          console.error("Error executing PayPal payout:", err);
        });
      }

      res.json({
        message: "Payout request created successfully. Verifying with payment provider...",
        payout,
      });
    } catch (error: any) {
      console.error("Error requesting payout:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to request payout" });
    }
  });

  // Helper functions for executing payouts
  async function executeStripePayout(
    stripeConnectAccountId: string,
    amount: string,
    payoutRecord: any
  ) {
    const isDevelopment = process.env.NODE_ENV === "development";
    const currency = isDevelopment ? "usd" : "eur";
    const makerId = payoutRecord.makerId || payoutRecord.maker_id;

    try {
      console.log("\n=== PAYOUT EXECUTION START ===");
      console.log("🔄 Initiating Stripe payout...");
      console.log(" Environment:", isDevelopment ? "DEVELOPMENT" : "PRODUCTION");
      console.log(" Amount: " + (isDevelopment ? "$" : "€") + parseFloat(amount).toFixed(2));
      console.log(" Currency:", currency.toUpperCase());
      console.log(" Payout ID:", payoutRecord.id);

      if (isDevelopment) {
        console.log(" ℹ Dev mode: Starting simulated payout workflow");
        const fakePayoutId = "py_test_" + Date.now();

        // Step 1: Already pending
        console.log(" 📍 Step 1/3: PENDING - Dinero bloqueado");
        const client1 = wsClients.get(makerId);
        if (client1 && client1.readyState === WebSocket.OPEN) {
          client1.send(
            JSON.stringify({
              type: "payout_status_update",
              payoutId: payoutRecord.id,
              status: "pending",
            })
          );
        }

        // Step 2: processing
        setTimeout(async () => {
          try {
            await storage.updatePayoutStatus(
              payoutRecord.id,
              "processing",
              fakePayoutId
            );
            console.log(" ✓ Step 2/3: PROCESSING - Enviando a banco");

            const client2 = wsClients.get(makerId);
            if (client2 && client2.readyState === WebSocket.OPEN) {
              client2.send(
                JSON.stringify({
                  type: "payout_status_update",
                  payoutId: payoutRecord.id,
                  status: "processing",
                })
              );
            }
          } catch (e) {
            console.error("Error updating to processing:", e);
          }
        }, 3000);

        // Step 3: completed
        setTimeout(async () => {
          try {
            await storage.updatePayoutStatus(
              payoutRecord.id,
              "completed",
              fakePayoutId
            );
            console.log("✅ Step 3/3: COMPLETED - Dinero enviado");

            const client3 = wsClients.get(makerId);
            if (client3 && client3.readyState === WebSocket.OPEN) {
              client3.send(
                JSON.stringify({
                  type: "payout_status_update",
                  payoutId: payoutRecord.id,
                  status: "completed",
                })
              );
            }
          } catch (e) {
            console.error("Error updating to completed:", e);
          }
        }, 6000);

        console.log(" ✓ Payout workflow initiated");
        console.log(" Fake Payout ID:", fakePayoutId);
        console.log("=== PAYOUT EXECUTION END ===\n");
        return;
      }

      // PRODUCTION: Real Stripe API
      const stripe = await getUncachableStripeClient();
      console.log(" ✓ Stripe client initialized (production)");

      const payout = await stripe.payouts.create({
        amount: Math.round(parseFloat(amount) * 100),
        currency,
        method: "standard",
        description: `VoxelHub maker payout #${payoutRecord.id.substring(0, 8)}`,
      });

      console.log("✅ Stripe payout created successfully!");
      console.log(" Payout ID:", payout.id);
      console.log(" Status:", payout.status);
      console.log(
        " Amount: " +
          (payout.amount / 100).toFixed(2) +
          " " +
          payout.currency.toUpperCase()
      );
      console.log(" Check: https://dashboard.stripe.com/payouts/" + payout.id);

      const newStatus = payout.status === "paid" ? "completed" : "processing";
      await storage.updatePayoutStatus(payoutRecord.id, newStatus, payout.id);
      console.log(" ✓ Database updated, Status: " + newStatus);

      const wsClient = wsClients.get(makerId);
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(
          JSON.stringify({
            type: "payout_status_update",
            payoutId: payoutRecord.id,
            status: newStatus,
          })
        );
      }

      console.log("=== PAYOUT EXECUTION END ===\n");
      return payout;
    } catch (error: any) {
      console.error("\n❌ PAYOUT ERROR:");
      console.error(" Message:", error.message);
      console.error(" Code:", error.code || "N/A");

      try {
        await storage.updatePayoutStatus(payoutRecord.id, "failed");
        console.log(" ✓ Marked as FAILED in database");

        const wsClientFail = wsClients.get(makerId);
        if (wsClientFail && wsClientFail.readyState === WebSocket.OPEN) {
          wsClientFail.send(
            JSON.stringify({
              type: "payout_status_update",
              payoutId: payoutRecord.id,
              status: "failed",
            })
          );
        }
      } catch (_) {
        console.error(" ⚠ Could not mark as failed");
      }

      console.error("=== PAYOUT EXECUTION END (ERROR) ===\n");
    }
  }

  async function executePayPalPayout(
    paypalAccountId: string,
    amount: string,
    payoutRecord: any
  ) {
    const isDevelopment = process.env.NODE_ENV === "development";
    const makerId = payoutRecord.makerId || payoutRecord.maker_id;

    try {
      console.log("\n=== PAYPAL PAYOUT EXECUTION START ===");
      console.log("🔄 Processing PayPal payout...");
      console.log(" Recipient:", paypalAccountId);
      console.log(" Amount: €" + parseFloat(amount).toFixed(2));
      console.log(" Environment:", isDevelopment ? "DEVELOPMENT" : "PRODUCTION");
      console.log(" Payout ID:", payoutRecord.id);

      if (isDevelopment) {
        console.log(" ℹ Dev mode: Starting simulated PayPal payout workflow");
        const fakePayoutId = "PAYID_" + Date.now();

        console.log(" 📍 Step 1/3: PENDING - Dinero bloqueado");
        const client1 = wsClients.get(makerId);
        if (client1 && client1.readyState === WebSocket.OPEN) {
          client1.send(
            JSON.stringify({
              type: "payout_status_update",
              payoutId: payoutRecord.id,
              status: "pending",
            })
          );
        }

        setTimeout(async () => {
          try {
            await storage.updatePayoutStatus(
              payoutRecord.id,
              "processing",
              fakePayoutId
            );
            console.log(" ✓ Step 2/3: PROCESSING - Enviando a PayPal");

            const client2 = wsClients.get(makerId);
            if (client2 && client2.readyState === WebSocket.OPEN) {
              client2.send(
                JSON.stringify({
                  type: "payout_status_update",
                  payoutId: payoutRecord.id,
                  status: "processing",
                })
              );
            }
          } catch (e) {
            console.error("Error updating to processing:", e);
          }
        }, 3000);

        setTimeout(async () => {
          try {
            await storage.updatePayoutStatus(
              payoutRecord.id,
              "completed",
              fakePayoutId
            );
            console.log("✅ Step 3/3: COMPLETED - Dinero enviado a PayPal");

            const client3 = wsClients.get(makerId);
            if (client3 && client3.readyState === WebSocket.OPEN) {
              client3.send(
                JSON.stringify({
                  type: "payout_status_update",
                  payoutId: payoutRecord.id,
                  status: "completed",
                })
              );
            }
          } catch (e) {
            console.error("Error updating to completed:", e);
          }
        }, 6000);

        console.log(" ✓ PayPal payout workflow initiated");
        console.log(" Fake Payout ID:", fakePayoutId);
        console.log("=== PAYPAL PAYOUT EXECUTION END ===\n");
        return;
      }

      // PRODUCTION: Real PayPal API
      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        throw new Error("PayPal credentials not configured in environment");
      }

      const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
      const apiBase = isProduction
        ? "https://api.paypal.com"
        : "https://api.sandbox.paypal.com";
      const clientId = process.env.PAYPAL_CLIENT_ID;
      const auth = Buffer.from(
        `${clientId}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString("base64");

      // Get access token
      const tokenResponse = await fetch(`${apiBase}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });
      if (!tokenResponse.ok) {
        throw new Error(`PayPal auth failed: ${tokenResponse.status}`);
      }
      const tokenData = (await tokenResponse.json()) as any;
      const accessToken = tokenData.access_token;

      // Create payout
      const payoutResponse = await fetch(`${apiBase}/v1/payments/payouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender_batch_header: {
            sender_batch_id: `payout_${Date.now()}`,
            email_subject: "VoxelHub Payout",
            email_message: "Your payout from VoxelHub",
          },
          items: [
            {
              recipient_type: "EMAIL",
              amount: {
                value: parseFloat(amount).toFixed(2),
                currency: "EUR",
              },
              receiver: paypalAccountId,
              note: "VoxelHub Marketplace Earnings",
            },
          ],
        }),
      });

      const payoutData = (await payoutResponse.json()) as any;
      if (payoutData.batch_header?.payout_batch_id) {
        console.log("✅ PayPal payout SENT");
        console.log(" Batch ID:", payoutData.batch_header.payout_batch_id);
        console.log(" Status:", payoutData.batch_header.batch_status);
        console.log(" To: " + paypalAccountId);
        console.log(" Amount: €" + parseFloat(amount).toFixed(2));

        await storage.updatePayoutStatus(
          payoutRecord.id,
          "processing",
          payoutData.batch_header.payout_batch_id
        );

        const wsClient = wsClients.get(makerId);
        if (wsClient && wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(
            JSON.stringify({
              type: "payout_status_update",
              payoutId: payoutRecord.id,
              status: "processing",
            })
          );
        }

        console.log("=== PAYPAL PAYOUT EXECUTION END ===\n");
      } else {
        console.error("❌ PayPal payout failed:", payoutData);
        await storage.updatePayoutStatus(payoutRecord.id, "failed");

        const wsClientFail = wsClients.get(makerId);
        if (wsClientFail && wsClientFail.readyState === WebSocket.OPEN) {
          wsClientFail.send(
            JSON.stringify({
              type: "payout_status_update",
              payoutId: payoutRecord.id,
              status: "failed",
            })
          );
        }
      }
    } catch (error: any) {
      console.error("❌ PayPal payout error:", error.message);
      try {
        await storage.updatePayoutStatus(payoutRecord.id, "failed");
        const wsClientFail = wsClients.get(makerId);
        if (wsClientFail && wsClientFail.readyState === WebSocket.OPEN) {
          wsClientFail.send(
            JSON.stringify({
              type: "payout_status_update",
              payoutId: payoutRecord.id,
              status: "failed",
            })
          );
        }
      } catch (_) {
        console.error(" ⚠ Could not mark as failed");
      }
    }
  }

  // Endpoint to check Stripe bank account status
  app.get("/api/maker/stripe-status", requireAuth, async (req: any, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const accounts = await (stripe.accounts as any).listExternalAccounts("self");
      const hasBankAccount = accounts.data && accounts.data.length > 0;

      res.json({
        hasBankAccount,
        setupInstructions: !hasBankAccount
          ? {
              title: "No hay cuenta bancaria vinculada",
              steps: [
                "1. Abre https://dashboard.stripe.com/test/settings/payouts",
                "2. Haz clic en 'Add external account'",
                "3. Selecciona 'Bank account'",
                "4. Ingresa estos datos de prueba:",
                " - Routing: 110000000",
                " - Account: 000111111116",
                "5. Guarda y vuelve a intentar el payout",
              ],
            }
          : null,
      });
    } catch (error: any) {
      res.json({
        hasBankAccount: false,
        error: error.message,
      });
    }
  });

  app.get("/api/maker/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const makerProfile = await storage.getMakerProfile(id);
      if (!makerProfile) {
        return res.status(404).json({ message: "Maker profile not found" });
      }

      const normalizedProfile = {
        ...makerProfile,
        rating: makerProfile.rating ? parseFloat(String(makerProfile.rating)) : 0,
      };

      res.json(normalizedProfile);
    } catch (error) {
      console.error("Error fetching maker profile:", error);
      res.status(500).json({ message: "Failed to fetch maker profile" });
    }
  });

  app.put("/api/user/type", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { userType } = req.body;
      if (!userType || !["client", "maker"].includes(userType)) {
        return res
          .status(400)
          .json({ message: "Invalid user type. Must be 'client' or 'maker'" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      await storage.upsertUser({
        id: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        userType,
      });

      const updated = await storage.getUser(userId);
      res.json(updated);
    } catch (error) {
      console.error("Error updating user type:", error);
      res.status(500).json({ message: "Failed to update user type" });
    }
  });

  // Update profile data (firstName, lastName, username, location)
  app.post("/api/user/:userId/profile", requireAuth, async (req: any, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      if (!authenticatedUserId) return res.status(401).json({ message: "Unauthorized" });

      const { userId } = req.params;

      // Only allow editing your own profile
      if (authenticatedUserId !== userId) {
        return res
          .status(403)
          .json({ message: "Cannot edit another user's profile" });
      }

      const { firstName, lastName, location, showFullName } = req.body;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      await storage.upsertUser({
        id: userId,
        email: user.email,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        username: user.username,
        location: location || user.location,
        profileImageUrl: user.profileImageUrl,
        userType: user.userType,
        showFullName: showFullName !== undefined ? showFullName : user.showFullName,
      });

      const updated = await storage.getUser(userId);
      res.json(updated);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Upload profile image
  app.post("/api/user/:userId/profile-image", requireAuth, async (req: any, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      if (!authenticatedUserId) return res.status(401).json({ message: "Unauthorized" });

      const { userId } = req.params;

      // Only allow editing your own profile
      if (authenticatedUserId !== userId) {
        return res
          .status(403)
          .json({ message: "Cannot edit another user's profile" });
      }

      const { profileImageUrl } = req.body;
      if (!profileImageUrl) {
        return res
          .status(400)
          .json({ message: "profileImageUrl is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      await storage.upsertUser({
        id: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl,
        userType: user.userType,
      });

      const updated = await storage.getUser(userId);
      res.json(updated);
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // Registration endpoint
  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const {
        email,
        password,
        username,
        firstName,
        lastName,
        userType,
        location,
        makerProfile,
      } = req.body;

      if (!email || !password || !username) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Register user
      const user = await storage.registerUser({
        email,
        password,
        username,
        firstName,
        lastName,
        userType,
        location,
      });

      // If maker, create profile
      if (userType === "maker" && makerProfile) {
        await storage.upsertMakerProfile({
          userId: user.id,
          ...makerProfile,
        });
      }

      // Create email verification token
      const verificationToken = await storage.createEmailToken(
        email,
        "verification"
      );
      const verificationLink = `${
        process.env.PUBLIC_URL || "http://localhost:5000"
      }/verify?token=${verificationToken}`;

      // Log the verification link (in production, send via email)
      console.log(`\n=== EMAIL VERIFICATION ===`);
      console.log(`To: ${email}`);
      console.log(`Verification Link: ${verificationLink}`);
      console.log(`Token: ${verificationToken}`);
      console.log(`========================\n`);

      // Create session (user can use app while waiting for email verification)
      req.session.userId = user.id;
      req.session.userType = userType;

      res.json({
        message: "Registration successful. Check your email for verification link.",
        user,
        verificationToken,
      });
    } catch (error: any) {
      console.error("Error with registration:", error);
      res
        .status(400)
        .json({ message: error.message || "Registration failed" });
    }
  });

  // Email verification endpoint
  app.post("/api/auth/verify-email", async (req: any, res) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: "Token is required" });

      const email = await storage.verifyEmailToken(token, "verification");
      if (!email) {
        return res
          .status(400)
          .json({ message: "Invalid or expired verification token" });
      }

      // Mark user as verified
      const user = await storage.getUserByEmail(email);
      if (user) {
        await storage.upsertUser({
          ...user,
          isEmailVerified: true,
        });
      }

      res.json({ message: "Email verified successfully", user });
    } catch (error: any) {
      console.error("Error verifying email:", error);
      res.status(400).json({ message: error.message || "Verification failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password required" });
      }

      const user = await storage.loginUser(email, password);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      // Create session
      req.session.userId = user.id;
      req.session.userType = user.userType;

      res.json({ message: "Login successful", user });
    } catch (error) {
      console.error("Error with login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Project routes
  app.get("/api/projects/my-projects", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res
          .status(403)
          .json({ message: "Only clients can access this endpoint" });
      }

      const projects = await storage.getProjects({ userId });
      const limitedProjects = projects.slice(0, 50);

      const projectsWithBids: any[] = [];
      for (let i = 0; i < limitedProjects.length; i += 5) {
        const chunk = limitedProjects.slice(i, i + 5);
        const chunkResults = await Promise.all(
          chunk.map(async (project) => {
            const bids = await storage.getBidsByProject(project.id);
            return { ...project, bidCount: bids.length };
          })
        );
        projectsWithBids.push(...chunkResults);
      }

      res.json(projectsWithBids);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/available", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res
          .status(403)
          .json({ message: "Only makers can access this endpoint" });
      }

      const limit = Math.min(parseInt(req.query.limit || "15"), 50);
      const offset = parseInt(req.query.offset || "0");

      const projects = await storage.getProjects({ status: "active" });
      const paginatedProjects = projects.slice(offset, offset + limit);

      const projectsWithBids: any[] = [];
      for (let i = 0; i < paginatedProjects.length; i += 3) {
        const chunk = paginatedProjects.slice(i, i + 3);
        const chunkResults = await Promise.all(
          chunk.map(async (project) => {
            const bids = await storage.getBidsByProject(project.id);
            return { ...project, bidCount: bids.length };
          })
        );
        projectsWithBids.push(...chunkResults);
      }

      res.json(projectsWithBids);
    } catch (error) {
      console.error("Error fetching available projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/my-bids", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res
          .status(403)
          .json({ message: "Only makers can access this endpoint" });
      }

      const limit = Math.min(parseInt(req.query.limit || "15"), 50);
      const offset = parseInt(req.query.offset || "0");

      const bids = await storage.getBidsByMaker(userId);
      const projectIds = [...new Set(bids.map((b) => b.projectId))].slice(
        offset,
        offset + limit
      );

      const projects: any[] = [];
      for (let i = 0; i < projectIds.length; i += 5) {
        const chunk = projectIds.slice(i, i + 5);
        const chunkResults = await Promise.all(
          chunk.map((projectId) => storage.getProject(projectId))
        );
        projects.push(...chunkResults);
      }

      const validProjects = projects.filter((p) => p !== undefined) as any[];

      const projectsWithBids: any[] = [];
      for (let i = 0; i < validProjects.length; i += 5) {
        const chunk = validProjects.slice(i, i + 5);
        const chunkResults = await Promise.all(
          chunk.map(async (project) => {
            const projectBids = await storage.getBidsByProject(project.id);
            return { ...project, bidCount: projectBids.length };
          })
        );
        projectsWithBids.push(...chunkResults);
      }

      res.json(projectsWithBids);
    } catch (error) {
      console.error("Error fetching my-bid projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res
          .status(403)
          .json({ message: "Only clients can access this endpoint" });
      }

      const stats = await storage.getClientStats(userId);
      res.set("Cache-Control", "public, max-age=30");
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/projects/total-unread-bids", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res
          .status(403)
          .json({ message: "Only clients can check unread bids" });
      }

      const totalUnread = await storage.getTotalUnreadBidsForClient(userId);
      res.json({ totalUnread });
    } catch (error) {
      console.error("Error fetching total unread bids:", error);
      res.status(500).json({ message: "Failed to fetch total unread bids" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;

      let project = await storage.getProject(id);

      if (!project) {
        const deletedProject = await storage.getProjectIncludeDeleted(id);
        if (deletedProject && deletedProject.deletedAt) {
          project = deletedProject;
        }
      }

      if (!project) return res.status(404).json({ message: "Project not found" });

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res
          .status(403)
          .json({ message: "Only clients can create projects" });
      }

      const activeCount = await storage.getActiveProjectCount(userId);
      if (activeCount >= 10) {
        return res
          .status(400)
          .json({ message: "You have reached the limit of 10 active projects" });
      }

      const validated = insertProjectSchema.parse(req.body);

      if (!validated.stlFileNames) validated.stlFileNames = [];
      if (!validated.stlFileContents) validated.stlFileContents = [];

      if (validated.stlFileName && validated.stlFileNames.length === 0) {
        validated.stlFileNames = [validated.stlFileName];
      }
      if (validated.stlFileContent && validated.stlFileContents.length === 0) {
        validated.stlFileContents = [validated.stlFileContent];
      }

      const project = await storage.createProject({ ...validated, userId });
      res.json(project);
    } catch (error: any) {
      console.error("Error creating project:", error);
      res
        .status(400)
        .json({ message: error.message || "Failed to create project" });
    }
  });

  app.delete("/api/projects/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const project = await storage.getProject(id);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only delete your own projects" });
      }

      if (project.status === "completed") {
        return res.status(400).json({
          message:
            "Completed projects cannot be deleted - they serve as proof of completion",
        });
      }

      const projectBids = await storage.getBidsByProject(id);
      for (const bid of projectBids) {
        if (bid.status === "pending") {
          await storage.updateBidStatus(bid.id, "rejected");

          const makerWs = wsClients.get(bid.makerId);
          if (makerWs && makerWs.readyState === WebSocket.OPEN) {
            makerWs.send(
              JSON.stringify({
                type: "bid_rejected",
                projectId: bid.projectId,
                bidId: bid.id,
              })
            );
          }
        }
      }

      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting project:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to delete project" });
    }
  });

  // Bid routes
  app.get("/api/projects/:id/bids", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      const project = await storage.getProject(id);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (user?.userType === "client" && project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only see bids for your own projects" });
      }

      if (user?.userType === "client" && project.userId === userId) {
        await storage.markBidsAsRead(id);
      }

      const bids = await storage.getBidsByProject(id);
      const limitedBids = bids.slice(0, 20);

      const bidsWithMakers = await Promise.all(
        limitedBids.map(async (bid) => {
          const maker = await storage.getUser(bid.makerId);
          const makerProfile = maker ? await storage.getMakerProfile(maker.id) : null;
          return {
            ...bid,
            maker: maker ? { ...maker, makerProfile } : undefined,
          };
        })
      );

      res.json(bidsWithMakers);
    } catch (error) {
      console.error("Error fetching bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  app.get("/api/projects/:id/unread-bid-count", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      const project = await storage.getProject(id);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (user?.userType !== "client" || project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only check bids for your own projects" });
      }

      const unreadCount = await storage.getUnreadBidCount(id);
      res.json({ unreadCount });
    } catch (error) {
      console.error("Error fetching unread bid count:", error);
      res.status(500).json({ message: "Failed to fetch unread bid count" });
    }
  });

  app.get("/api/projects/:id/my-bid", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res
          .status(403)
          .json({ message: "Only makers can access this endpoint" });
      }

      const bid = await storage.getMakerBidForProject(userId, id);
      res.json(bid || null);
    } catch (error) {
      console.error("Error fetching bid:", error);
      res.status(500).json({ message: "Failed to fetch bid" });
    }
  });

  app.get("/api/projects/:id/accepted-bid", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      const project = await storage.getProject(id);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (user?.userType === "client" && project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only see bids for your own projects" });
      }

      const bids = await storage.getBidsByProject(id);
      const acceptedBid = bids.find((b) => b.status === "accepted");
      if (!acceptedBid) return res.json(null);

      const maker = await storage.getUser(acceptedBid.makerId);
      const makerProfile = maker ? await storage.getMakerProfile(maker.id) : null;

      res.json({
        ...acceptedBid,
        maker: maker ? { ...maker, makerProfile } : undefined,
      });
    } catch (error) {
      console.error("Error fetching accepted bid:", error);
      res.status(500).json({ message: "Failed to fetch accepted bid" });
    }
  });

  app.get("/api/projects/:id/download-stl", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const project = await storage.getProject(id);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (project.deletedAt) {
        return res
          .status(403)
          .json({ message: "Cannot download STL from deleted projects" });
      }

      res.json({ fileName: project.stlFileName });
    } catch (error) {
      console.error("Error downloading STL:", error);
      res.status(500).json({ message: "Failed to download STL" });
    }
  });

  app.get("/api/projects/:id/stl-content", async (req: any, res) => {
    try {
      const { id } = req.params;
      const index = parseInt(req.query.index || "0");
      const project = await storage.getProject(id);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (project.deletedAt) {
        return res
          .status(403)
          .json({ message: "Cannot access STL from deleted projects" });
      }

      let stlContent: string | undefined;
      const stlFileContents = (project as any).stlFileContents;

      if (stlFileContents && Array.isArray(stlFileContents) && stlFileContents.length > 0) {
        if (index >= 0 && index < stlFileContents.length) {
          stlContent = stlFileContents[index];
        } else {
          stlContent = stlFileContents[0];
        }
      } else {
        stlContent = (project as any).stlFileContent;
      }

      if (!stlContent) return res.status(404).json({ message: "STL file not found" });

      const binaryData = Buffer.from(stlContent, "base64");
      res.type("application/octet-stream").send(binaryData);
    } catch (error) {
      console.error("Error serving STL content:", error);
      res.status(500).json({ message: "Failed to serve STL" });
    }
  });

  app.put("/api/projects/:id/mark-bids-read", requireAuth, async (req: any, res) => {
    try {
      const { id: projectId } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only mark bids as read for your own projects" });
      }

      await storage.markBidsAsRead(projectId);
      res.json({ message: "Bids marked as read" });
    } catch (error) {
      console.error("Error marking bids as read:", error);
      res.status(500).json({ message: "Failed to mark bids as read" });
    }
  });

  app.post("/api/projects/:id/bids", requireAuth, async (req: any, res) => {
    try {
      const { id: projectId } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res
          .status(403)
          .json({ message: "Only makers can submit bids" });
      }

      const profile = await storage.getMakerProfile(userId);
      if (!profile) {
        return res
          .status(400)
          .json({ message: "Please complete your maker profile first" });
      }

      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
      if (project.status !== "active") {
        return res
          .status(400)
          .json({ message: "This project is no longer accepting bids" });
      }

      const existingBid = await storage.getMakerBidForProject(userId, projectId);
      if (existingBid && existingBid.status !== "rejected") {
        return res
          .status(400)
          .json({ message: "You already have a bid for this project" });
      }

      const validated = insertBidSchema.parse(req.body);
      const bid = await storage.createBid({
        ...validated,
        projectId,
        makerId: userId,
      });

      const ownerWs = wsClients.get(project.userId);
      if (ownerWs && ownerWs.readyState === WebSocket.OPEN) {
        ownerWs.send(
          JSON.stringify({
            type: "new_bid",
            projectId,
            bidId: bid.id,
          })
        );
      }

      res.json(bid);
    } catch (error: any) {
      console.error("Error creating bid:", error);
      res.status(400).json({ message: error.message || "Failed to create bid" });
    }
  });

  app.put("/api/bids/:id/accept", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res
          .status(403)
          .json({ message: "Only clients can accept bids" });
      }

      const bid = await storage.getBid(id);
      if (!bid) return res.status(404).json({ message: "Bid not found" });

      const project = await storage.getProject(bid.projectId);
      if (!project || project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only accept bids for your own projects" });
      }

      await storage.updateBidStatus(id, "accepted");
      await storage.updateProjectStatus(bid.projectId, "completed");

      const allBids = await storage.getBidsByProject(bid.projectId);
      for (const otherBid of allBids) {
        if (otherBid.id !== id && otherBid.status === "pending") {
          await storage.updateBidStatus(otherBid.id, "rejected");

          const makerWs = wsClients.get(otherBid.makerId);
          if (makerWs && makerWs.readyState === WebSocket.OPEN) {
            makerWs.send(
              JSON.stringify({
                type: "bid_rejected",
                projectId: bid.projectId,
                bidId: otherBid.id,
              })
            );
          }
        }
      }

      const acceptedMakerWs = wsClients.get(bid.makerId);
      if (acceptedMakerWs && acceptedMakerWs.readyState === WebSocket.OPEN) {
        acceptedMakerWs.send(
          JSON.stringify({
            type: "bid_accepted",
            projectId: bid.projectId,
            bidId: id,
          })
        );
      }

      res.json({ message: "Bid accepted successfully" });
    } catch (error) {
      console.error("Error accepting bid:", error);
      res.status(500).json({ message: "Failed to accept bid" });
    }
  });

  app.put("/api/bids/:id/reject", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res
          .status(403)
          .json({ message: "Only clients can reject bids" });
      }

      const bid = await storage.getBid(id);
      if (!bid) return res.status(404).json({ message: "Bid not found" });

      const project = await storage.getProject(bid.projectId);
      if (!project || project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only reject bids for your own projects" });
      }

      await storage.updateBidStatus(id, "rejected");

      const makerWs = wsClients.get(bid.makerId);
      if (makerWs && makerWs.readyState === WebSocket.OPEN) {
        makerWs.send(
          JSON.stringify({
            type: "bid_rejected",
            projectId: bid.projectId,
            bidId: id,
          })
        );
      }

      res.json({ message: "Bid rejected successfully" });
    } catch (error) {
      console.error("Error rejecting bid:", error);
      res.status(500).json({ message: "Failed to reject bid" });
    }
  });

  app.patch("/api/bids/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const bid = await storage.getBid(id);
      if (!bid) return res.status(404).json({ message: "Bid not found" });

      if (bid.makerId !== userId) {
        return res
          .status(403)
          .json({ message: "Only the bid creator can edit it" });
      }

      if (bid.status !== "pending") {
        return res.status(400).json({ message: "Can only edit pending bids" });
      }

      const project = await storage.getProject(bid.projectId);
      if (!project || project.deletedAt) {
        return res
          .status(400)
          .json({ message: "Cannot edit bids for deleted projects" });
      }

      const validated = updateBidSchema.parse(req.body);
      await storage.updateBid(id, validated);

      const updatedBid = await storage.getBid(id);
      res.json(updatedBid);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating bid:", error);
      res.status(500).json({ message: "Failed to update bid" });
    }
  });

  app.delete("/api/bids/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const bid = await storage.getBid(id);
      if (!bid) return res.status(404).json({ message: "Bid not found" });

      if (bid.makerId !== userId) {
        return res
          .status(403)
          .json({ message: "Only the bid creator can delete it" });
      }

      if (bid.status !== "pending") {
        return res.status(400).json({ message: "Can only delete pending bids" });
      }

      const project = await storage.getProject(bid.projectId);
      if (!project || project.deletedAt) {
        return res
          .status(400)
          .json({ message: "Cannot delete bids for deleted projects" });
      }

      await storage.deleteBid(id);

      if (project) {
        const clientWs = wsClients.get(project.userId);
        if (clientWs && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: "bid_deleted",
              projectId: bid.projectId,
              bidId: id,
            })
          );
        }
      }

      res.json({ message: "Bid deleted successfully" });
    } catch (error) {
      console.error("Error deleting bid:", error);
      res.status(500).json({ message: "Failed to delete bid" });
    }
  });

  app.put("/api/bids/:id/confirm-delivery", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res
          .status(403)
          .json({ message: "Only clients can confirm delivery" });
      }

      if (!rating || rating < 0.5 || rating > 5) {
        return res.status(400).json({ message: "Valid rating is required" });
      }

      const bid = await storage.getBid(id);
      if (!bid) return res.status(404).json({ message: "Bid not found" });

      if (bid.status !== "accepted") {
        return res
          .status(400)
          .json({ message: "Can only confirm delivery for accepted bids" });
      }

      const project = await storage.getProject(bid.projectId);
      if (!project || project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only confirm delivery for your own projects" });
      }

      await storage.createReview({
        projectId: bid.projectId,
        fromUserId: userId,
        toUserId: bid.makerId,
        rating: Number(rating),
        comment: comment || "",
      });

      await storage.confirmBidDelivery(id);
      await storage.updateProjectStatus(bid.projectId, "completed");

      const allBids = await storage.getBidsByProject(bid.projectId);
      for (const otherBid of allBids) {
        if (otherBid.id !== id && otherBid.status === "pending") {
          await storage.updateBidStatus(otherBid.id, "rejected");

          const makerWs = wsClients.get(otherBid.makerId);
          if (makerWs && makerWs.readyState === WebSocket.OPEN) {
            makerWs.send(
              JSON.stringify({
                type: "bid_rejected",
                projectId: bid.projectId,
                bidId: otherBid.id,
              })
            );
          }
        }
      }

      const makerWs = wsClients.get(bid.makerId);
      if (makerWs && makerWs.readyState === WebSocket.OPEN) {
        makerWs.send(
          JSON.stringify({
            type: "delivery_confirmed",
            projectId: bid.projectId,
            bidId: id,
            clientName: user?.firstName || user?.email || "Cliente",
            projectName: project?.name || "Proyecto",
            clientId: userId,
          })
        );
      }

      res.json({ message: "Delivery confirmed successfully" });
    } catch (error) {
      console.error("Error confirming delivery:", error);
      res.status(500).json({ message: "Failed to confirm delivery" });
    }
  });

  app.get("/api/bids/my-bids", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res
          .status(403)
          .json({ message: "Only makers can access this endpoint" });
      }

      const limit = Math.min(parseInt(req.query.limit || "15"), 50);
      const offset = parseInt(req.query.offset || "0");

      const bids = await storage.getBidsByMaker(userId);
      const paginatedBids = bids.slice(offset, offset + limit);

      const enrichedBids: any[] = [];
      for (let i = 0; i < paginatedBids.length; i += 3) {
        const chunk = paginatedBids.slice(i, i + 3);
        const chunkResults = await Promise.all(
          chunk.map(async (bid) => {
            const project = await storage.getProjectIncludeDeleted(bid.projectId);
            return { ...bid, project };
          })
        );
        enrichedBids.push(...chunkResults);
      }

      console.log(
        `[/api/bids/my-bids] User ${userId.slice(0, 8)}... has ${enrichedBids.length} bids:`,
        enrichedBids.map((b) => ({
          projectId: b.projectId,
          status: b.status,
          deleted: b.project?.deletedAt ? true : false,
        }))
      );

      res.json(enrichedBids);
    } catch (error) {
      console.error("Error fetching bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  app.get("/api/bids/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res
          .status(403)
          .json({ message: "Only makers can access this endpoint" });
      }

      const stats = await storage.getMakerStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.put("/api/bids/:id/rate-client", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res
          .status(403)
          .json({ message: "Only makers can rate clients" });
      }

      if (!rating || rating < 0.5 || rating > 5) {
        return res.status(400).json({ message: "Valid rating is required" });
      }

      const bid = await storage.getBid(id);
      if (!bid) return res.status(404).json({ message: "Bid not found" });

      if (bid.makerId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only rate your own clients" });
      }

      if (!bid.deliveryConfirmedAt) {
        return res
          .status(400)
          .json({ message: "Can only rate after delivery is confirmed" });
      }

      const project = await storage.getProject(bid.projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      await storage.createReview({
        projectId: bid.projectId,
        fromUserId: userId,
        toUserId: project.userId,
        rating: Number(rating),
        comment: comment || "",
      });

      res.json({ message: "Client rated successfully" });
    } catch (error) {
      console.error("Error rating client:", error);
      res.status(500).json({ message: "Failed to rate client" });
    }
  });

  app.get("/api/projects/:projectId/check-rating-by-maker", requireAuth, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      const bid = await storage.getMakerBidForProject(userId, projectId);
      if (!bid) return res.status(404).json({ message: "No bid found for this project" });

      console.log("Checking bid delivery status:", {
        bidId: bid.id,
        deliveryConfirmedAt: bid.deliveryConfirmedAt,
        status: bid.status,
      });

      const deliveryConfirmed = !!bid.deliveryConfirmedAt;
      if (!deliveryConfirmed) {
        return res.json({ hasRated: false, deliveryConfirmed: false });
      }

      const review = await storage.getReviewForProject(
        projectId,
        userId,
        project.userId
      );
      res.json({ hasRated: !!review, deliveryConfirmed: true });
    } catch (error) {
      console.error("Error checking rating:", error);
      res.status(500).json({ message: "Failed to check rating" });
    }
  });

  app.put("/api/projects/:projectId/rate-client-from-won-project", requireAuth, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const { rating, comment } = req.body;

      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res
          .status(403)
          .json({ message: "Only makers can rate clients" });
      }

      if (!rating || rating < 0.5 || rating > 5) {
        return res.status(400).json({ message: "Valid rating is required" });
      }

      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      const bid = await storage.getMakerBidForProject(userId, projectId);
      if (!bid) return res.status(404).json({ message: "No bid found for this project" });

      if (bid.status !== "accepted" || !bid.deliveryConfirmedAt) {
        return res
          .status(400)
          .json({ message: "Can only rate after delivery is confirmed" });
      }

      const existingReview = await storage.getReviewForProject(
        projectId,
        userId,
        project.userId
      );
      if (existingReview) {
        return res
          .status(400)
          .json({ message: "You have already rated this client" });
      }

      await storage.createReview({
        projectId: projectId,
        fromUserId: userId,
        toUserId: project.userId,
        rating: Number(rating),
        comment: comment || "",
      });

      res.json({ message: "Client rated successfully" });
    } catch (error) {
      console.error("Error rating client:", error);
      res.status(500).json({ message: "Failed to rate client" });
    }
  });

  // Maker profile routes
  app.get("/api/maker-profile", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const profile = await storage.getMakerProfile(userId);
      if (!profile) return res.json(null);

      const normalizedProfile = {
        ...profile,
        rating: profile.rating ? parseFloat(String(profile.rating)) : 0,
      };

      res.json(normalizedProfile);
    } catch (error) {
      console.error("Error fetching maker profile:", error);
      res.status(500).json({ message: "Failed to fetch maker profile" });
    }
  });

  app.post("/api/maker-profile", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res
          .status(403)
          .json({ message: "Only makers can create profiles" });
      }

      const validated = insertMakerProfileSchema.parse(req.body);
      const profile = await storage.upsertMakerProfile({ ...validated, userId });
      res.json(profile);
    } catch (error: any) {
      console.error("Error creating maker profile:", error);
      res
        .status(400)
        .json({ message: error.message || "Failed to create maker profile" });
    }
  });

  app.put("/api/maker-profile", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res
          .status(403)
          .json({ message: "Only makers can update profiles" });
      }

      const { showFullName, ...makerData } = req.body;

      if (showFullName !== undefined) {
        await storage.upsertUser({
          id: userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          profileImageUrl: user.profileImageUrl,
          userType: user.userType,
          showFullName,
        });
      }

      const validated = insertMakerProfileSchema.parse(makerData);
      const profile = await storage.upsertMakerProfile({ ...validated, userId });
      res.json(profile);
    } catch (error: any) {
      console.error("Error updating maker profile:", error);
      res
        .status(400)
        .json({ message: error.message || "Failed to update maker profile" });
    }
  });

  // Message routes
  app.get("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { projectId, marketplaceDesignId, otherUserId } = req.query;
      console.log(
        `[GET /api/messages] userId: ${userId.slice(0, 8)}..., otherUserId: ${otherUserId?.slice(0, 8)}..., projectId: ${projectId}, marketplaceDesignId: ${marketplaceDesignId}`
      );

      if (!otherUserId) {
        return res.status(400).json({ message: "otherUserId is required" });
      }

      if (projectId) {
        const messages = await storage.getMessagesByContext(
          userId,
          otherUserId as string,
          "project",
          projectId as string
        );
        console.log(
          `[GET /api/messages] Returning ${messages.length} messages for project ${(projectId as string).slice(0, 8)}...`
        );
        return res.json(messages);
      }

      if (marketplaceDesignId) {
        const messages = await storage.getMessagesByContext(
          userId,
          otherUserId as string,
          "marketplace_design",
          marketplaceDesignId as string
        );
        console.log(
          `[GET /api/messages] Returning ${messages.length} messages for design ${(marketplaceDesignId as string).slice(0, 8)}...`
        );
        return res.json(messages);
      }

      console.log(
        `[GET /api/messages] ERROR: Missing context (projectId and marketplaceDesignId both empty)`
      );
      return res
        .status(400)
        .json({ message: "Either projectId or marketplaceDesignId is required" });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const validated = insertMessageSchema.parse(req.body);

      const messageData = { ...validated, senderId: userId };
      const message = await storage.createMessage(messageData);

      const receiverWs = wsClients.get(validated.receiverId);
      if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
        receiverWs.send(
          JSON.stringify({
            type: "new_message",
            messageId: message.id,
            senderId: userId,
            contextType: validated.contextType,
            projectId: validated.projectId,
            marketplaceDesignId: validated.marketplaceDesignId,
          })
        );
      }

      res.json(message);
    } catch (error: any) {
      console.error("Error creating message:", error);
      res
        .status(400)
        .json({ message: error.message || "Failed to create message" });
    }
  });

  app.put("/api/messages/mark-read/:otherUserId", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { otherUserId } = req.params;
      const { projectId, marketplaceDesignId } = req.query;

      if (!otherUserId) {
        return res.status(400).json({ message: "otherUserId is required" });
      }

      if (projectId) {
        await storage.markMessagesAsReadByContext(
          userId,
          otherUserId,
          "project",
          projectId as string
        );
        return res.json({ success: true });
      }

      if (marketplaceDesignId) {
        await storage.markMessagesAsReadByContext(
          userId,
          otherUserId,
          "marketplace_design",
          marketplaceDesignId as string
        );
        return res.json({ success: true });
      }

      return res
        .status(400)
        .json({ message: "Either projectId or marketplaceDesignId is required" });
    } catch (error: any) {
      console.error("Error marking messages as read:", error);
      res
        .status(400)
        .json({ message: error.message || "Failed to mark messages as read" });
    }
  });

  app.get("/api/my-conversations", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const conversations = await storage.getConversationsWithUnread(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/my-conversations-full", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const conversations = await storage.getConversationsWithUnread(userId);

      const enriched = await Promise.all(
        conversations.map(async (conv) => {
          const user = await storage.getUser(conv.userId);

          const project = conv.projectId
            ? await storage.getProjectIncludeDeleted(conv.projectId)
            : null;
          const design = conv.marketplaceDesignId
            ? await storage.getMarketplaceDesignIncludeDeleted(conv.marketplaceDesignId)
            : null;

          return {
            userId: conv.userId,
            projectId: conv.projectId,
            marketplaceDesignId: conv.marketplaceDesignId,
            user,
            project,
            design,
            lastMessage: conv.lastMessage,
            unreadCount: conv.unreadCount,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching conversations with user data:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Review routes
  app.get("/api/users/:id/review-count", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const reviews = await storage.getReviewsForMaker(id);
      res.json({ count: reviews.length });
    } catch (error) {
      console.error("Error fetching review count:", error);
      res.status(500).json({ message: "Failed to fetch review count" });
    }
  });

  app.get("/api/makers/:id/reviews", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const reviews = await storage.getReviewsForMaker(id);

      const enriched = await Promise.all(
        reviews.map(async (review) => {
          const fromUser = await storage.getUser(review.fromUserId);
          return {
            ...review,
            fromUser,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/reviews/my-reviews", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const reviews = await storage.getReviewsForMaker(userId);

      const enriched = await Promise.all(
        reviews.map(async (review) => {
          const fromUser = await storage.getUser(review.fromUserId);
          return {
            ...review,
            fromUser,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching maker reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/projects/:projectId/review-from-client", requireAuth, async (req: any, res) => {
    try {
      const makerId = getAuthenticatedUserId(req);
      if (!makerId) return res.status(401).json({ message: "Unauthorized" });

      const { projectId } = req.params;

      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      const review = await storage.getReviewForProject(
        projectId,
        project.userId,
        makerId
      );
      if (!review) return res.status(404).json({ message: "Review not found" });

      const fromUser = await storage.getUser(review.fromUserId);
      res.json({
        ...review,
        fromUser,
      });
    } catch (error) {
      console.error("Error fetching review from client:", error);
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });

  app.get("/api/projects/:projectId/review-from-maker", requireAuth, async (req: any, res) => {
    try {
      const clientId = getAuthenticatedUserId(req);
      if (!clientId) return res.status(401).json({ message: "Unauthorized" });

      const { projectId } = req.params;

      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      const bids = await storage.getBidsByProject(projectId);
      const acceptedBid = bids.find((b) => b.status === "accepted");
      if (!acceptedBid) {
        return res.status(404).json({ message: "No accepted bid found" });
      }

      const review = await storage.getReviewForProject(
        projectId,
        acceptedBid.makerId,
        clientId
      );
      if (!review) return res.status(404).json({ message: "Review not found" });

      const fromUser = await storage.getUser(review.fromUserId);
      res.json({
        ...review,
        fromUser,
      });
    } catch (error) {
      console.error("Error fetching review from maker:", error);
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });

  app.get("/api/projects/:projectId/check-rating-by-client", requireAuth, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (project.status !== "completed") {
        return res.json({ hasRated: false, deliveryConfirmed: false });
      }

      const bids = await storage.getBidsByProject(projectId);
      const acceptedBid = bids.find((b) => b.status === "accepted");
      if (!acceptedBid) {
        return res.json({ hasRated: false, deliveryConfirmed: false });
      }

      const review = await storage.getReviewForProject(
        projectId,
        userId,
        acceptedBid.makerId
      );
      res.json({ hasRated: !!review, deliveryConfirmed: true });
    } catch (error) {
      console.error("Error checking rating:", error);
      res.status(500).json({ message: "Failed to check rating" });
    }
  });

  app.put("/api/projects/:projectId/rate-maker-as-client", requireAuth, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const { makerId, rating, comment } = req.body;

      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res
          .status(403)
          .json({ message: "Only clients can rate makers" });
      }

      if (!rating || rating < 0.5 || rating > 5) {
        return res.status(400).json({ message: "Valid rating is required" });
      }

      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only rate makers for your own projects" });
      }

      const bids = await storage.getBidsByProject(projectId);
      const acceptedBid = bids.find(
        (b) => b.status === "accepted" && b.makerId === makerId
      );
      if (!acceptedBid) {
        return res.status(400).json({ message: "Invalid bid or maker" });
      }

      const existingReview = await storage.getReviewForProject(
        projectId,
        userId,
        makerId
      );
      if (existingReview) {
        return res
          .status(400)
          .json({ message: "You have already rated this maker" });
      }

      await storage.createReview({
        projectId: projectId,
        fromUserId: userId,
        toUserId: makerId,
        rating: Number(rating),
        comment: comment || "",
      });

      res.json({ message: "Maker rated successfully" });
    } catch (error) {
      console.error("Error rating maker:", error);
      res.status(500).json({ message: "Failed to rate maker" });
    }
  });

  app.post("/api/reviews", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const validated = insertReviewSchema.parse(req.body);

      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res
          .status(403)
          .json({ message: "Only clients can leave reviews" });
      }

      const bid = await storage.getBid(validated.projectId);
      if (!bid || bid.status !== "accepted" || bid.makerId !== validated.toUserId) {
        return res.status(400).json({ message: "Invalid project or bid" });
      }

      const review = await storage.createReview({
        ...validated,
        fromUserId: userId,
      });
      res.json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res
        .status(400)
        .json({ message: error.message || "Failed to create review" });
    }
  });

  // Marketplace design routes
  app.get("/api/marketplace/designs", async (req: any, res) => {
    try {
      const designs = await storage.getMarketplaceDesigns({ status: "active" });

      const enriched = await Promise.all(
        designs.map(async (design) => {
          const maker = await storage.getUser(design.makerId);
          const makerProfile = await storage.getMakerProfile(design.makerId);
          return {
            ...design,
            maker,
            makerProfile,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching marketplace designs:", error);
      res.status(500).json({ message: "Failed to fetch designs" });
    }
  });

  app.get("/api/marketplace/designs/:id", async (req: any, res) => {
    try {
      const { id } = req.params;

      let design = await storage.getMarketplaceDesign(id);

      if (!design) {
        const deletedDesign = await storage.getMarketplaceDesignIncludeDeleted(id);
        if (deletedDesign && deletedDesign.deletedAt) {
          design = deletedDesign;
        }
      }

      if (!design) return res.status(404).json({ message: "Design not found" });

      const maker = await storage.getUser(design.makerId);
      const makerProfile = await storage.getMakerProfile(design.makerId);

      res.json({
        ...design,
        maker,
        makerProfile,
      });
    } catch (error) {
      console.error("Error fetching design:", error);
      res.status(500).json({ message: "Failed to fetch design" });
    }
  });

  app.get("/api/my-designs", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res
          .status(403)
          .json({ message: "Only makers can upload designs" });
      }

      const designs = await storage.getMarketplaceDesigns({ makerId: userId });
      res.json(designs);
    } catch (error) {
      console.error("Error fetching my designs:", error);
      res.status(500).json({ message: "Failed to fetch designs" });
    }
  });

  app.post("/api/marketplace/designs", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res
          .status(403)
          .json({ message: "Only makers can upload designs" });
      }

      const validated = insertMarketplaceDesignSchema.parse(req.body);

      if (validated.priceType === "minimum") {
        const price = parseFloat(String(validated.price)) || 0;
        if (price > 0 && price < 0.5) {
          return res.status(400).json({
            message: "Minimum price must be €0.00 (free) or at least €0.50",
          });
        }
      }

      const design = await storage.createMarketplaceDesign({
        ...validated,
        makerId: userId,
      });

      res.json(design);
    } catch (error: any) {
      console.error("Error creating design:", error);
      res
        .status(400)
        .json({ message: error.message || "Failed to create design" });
    }
  });

  app.put("/api/marketplace/designs/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const design = await storage.getMarketplaceDesign(id);
      if (!design) return res.status(404).json({ message: "Design not found" });

      if (design.makerId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only edit your own designs" });
      }

      const validated = insertMarketplaceDesignSchema.partial().parse(req.body);

      const priceType = validated.priceType || design.priceType;
      if (priceType === "minimum") {
        const price = parseFloat(String(validated.price ?? design.price)) || 0;
        if (price > 0 && price < 0.5) {
          return res.status(400).json({
            message: "Minimum price must be €0.00 (free) or at least €0.50",
          });
        }
      }

      await storage.updateMarketplaceDesign(id, validated);
      const updated = await storage.getMarketplaceDesign(id);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating design:", error);
      res
        .status(400)
        .json({ message: error.message || "Failed to update design" });
    }
  });

  app.delete("/api/marketplace/designs/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const design = await storage.getMarketplaceDesign(id);
      if (!design) return res.status(404).json({ message: "Design not found" });

      if (design.makerId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only delete your own designs" });
      }

      await storage.deleteMarketplaceDesign(id);
      res.json({ message: "Design deleted" });
    } catch (error) {
      console.error("Error deleting design:", error);
      res.status(500).json({ message: "Failed to delete design" });
    }
  });

  // Design purchase routes
  app.get("/api/marketplace/designs/:id/access", requireAuth, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const design = await storage.getMarketplaceDesign(id);
      if (!design) return res.status(404).json({ message: "Design not found" });

      // Check if maker (can always access) or buyer (must have purchased or free)
      if (design.makerId === userId) {
        return res.json({ canAccess: true, reason: "maker" });
      }
      if (design.priceType === "free") {
        return res.json({ canAccess: true, reason: "free" });
      }

      const hasPurchased = await storage.userHasPurchasedDesign(userId, id);
      return res.json({ canAccess: hasPurchased, reason: hasPurchased ? "purchased" : "not_purchased" });
    } catch (error) {
      console.error("Error checking access:", error);
      res.status(500).json({ message: "Failed to check access" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "register" && message.userId) {
          wsClients.set(message.userId, ws);
          console.log(`User ${message.userId} registered for WebSocket notifications`);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      for (const [userId, client] of wsClients.entries()) {
        if (client === ws) {
          wsClients.delete(userId);
          console.log(`User ${userId} disconnected from WebSocket`);
          break;
        }
      }
    });
  });

  return httpServer;
}
