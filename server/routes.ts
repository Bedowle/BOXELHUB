import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertBidSchema, updateBidSchema, insertMakerProfileSchema, insertMessageSchema, insertReviewSchema, insertMarketplaceDesignSchema } from "@shared/schema";
import { getAuthenticatedUserId } from "./replitAuth";
import { z } from "zod";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { getPayPalClient, getPayPalClientId } from "./paypalClient";

// WebSocket clients map
const wsClients = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/user/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/maker/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const makerProfile = await storage.getMakerProfile(id);
      if (!makerProfile) {
        return res.status(404).json({ message: "Maker profile not found" });
      }
      // Normalize rating to number
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

  app.put('/api/user/type', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { userType } = req.body;
      
      if (!userType || !['client', 'maker'].includes(userType)) {
        return res.status(400).json({ message: "Invalid user type. Must be 'client' or 'maker'" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.upsertUser({ 
        id: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        userType 
      });

      const updated = await storage.getUser(userId);
      res.json(updated);
    } catch (error) {
      console.error("Error updating user type:", error);
      res.status(500).json({ message: "Failed to update user type" });
    }
  });

  // Update profile data (firstName, lastName, username, location)
  app.post('/api/user/:userId/profile', isAuthenticated, async (req: any, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { userId } = req.params;
      // Only allow editing your own profile
      if (authenticatedUserId !== userId) {
        return res.status(403).json({ message: "Cannot edit another user's profile" });
      }

      const { firstName, lastName, location } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.upsertUser({
        id: userId,
        email: user.email,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        username: user.username,
        location: location || user.location,
        profileImageUrl: user.profileImageUrl,
        userType: user.userType
      });

      const updated = await storage.getUser(userId);
      res.json(updated);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Upload profile image
  app.post('/api/user/:userId/profile-image', isAuthenticated, async (req: any, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { userId } = req.params;
      // Only allow editing your own profile
      if (authenticatedUserId !== userId) {
        return res.status(403).json({ message: "Cannot edit another user's profile" });
      }

      const { profileImageUrl } = req.body;
      if (!profileImageUrl) {
        return res.status(400).json({ message: "profileImageUrl is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.upsertUser({
        id: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl,
        userType: user.userType
      });

      const updated = await storage.getUser(userId);
      res.json(updated);
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // Registration endpoint
  app.post('/api/auth/register', async (req: any, res) => {
    try {
      const { email, password, username, firstName, lastName, userType, location, makerProfile } = req.body;

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
      if (userType === 'maker' && makerProfile) {
        await storage.upsertMakerProfile({
          userId: user.id,
          ...makerProfile,
        });
      }

      // Create email verification token
      const verificationToken = await storage.createEmailToken(email, 'verification');
      const verificationLink = `${process.env.PUBLIC_URL || 'http://localhost:5000'}/verify?token=${verificationToken}`;
      
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
        verificationToken // Send token in response for testing
      });
    } catch (error: any) {
      console.error("Error with registration:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // Email verification endpoint
  app.post('/api/auth/verify-email', async (req: any, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const email = await storage.verifyEmailToken(token, 'verification');
      if (!email) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
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
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = await storage.loginUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      req.session.userId = user.id;
      req.session.userType = user.userType;

      res.json({ message: "Login successful", user });
    } catch (error) {
      console.error("Error with login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Project routes
  app.get('/api/projects/my-projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'client') {
        return res.status(403).json({ message: "Only clients can access this endpoint" });
      }

      const projects = await storage.getProjects({ userId });
      
      // Add bid count for each project
      const projectsWithBids = await Promise.all(
        projects.map(async (project) => {
          const bids = await storage.getBidsByProject(project.id);
          return { ...project, bidCount: bids.length };
        })
      );
      
      res.json(projectsWithBids);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/available', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'maker') {
        return res.status(403).json({ message: "Only makers can access this endpoint" });
      }

      const projects = await storage.getProjects({ status: 'active' });
      
      // Add bid count for each project
      const projectsWithBids = await Promise.all(
        projects.map(async (project) => {
          const bids = await storage.getBidsByProject(project.id);
          return { ...project, bidCount: bids.length };
        })
      );
      
      res.json(projectsWithBids);
    } catch (error) {
      console.error("Error fetching available projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/my-bids', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'maker') {
        return res.status(403).json({ message: "Only makers can access this endpoint" });
      }

      // Get all bids from this maker
      const bids = await storage.getBidsByMaker(userId);
      
      // Get unique project IDs
      const projectIds = [...new Set(bids.map(b => b.projectId))];
      
      // Get projects for those IDs
      const projects = await Promise.all(
        projectIds.map(projectId => storage.getProject(projectId))
      );
      
      // Filter out any null projects
      const validProjects = projects.filter(p => p !== undefined) as any[];
      
      // Add bid count for each project
      const projectsWithBids = await Promise.all(
        validProjects.map(async (project) => {
          const projectBids = await storage.getBidsByProject(project.id);
          return { ...project, bidCount: projectBids.length };
        })
      );
      
      res.json(projectsWithBids);
    } catch (error) {
      console.error("Error fetching my-bid projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'client') {
        return res.status(403).json({ message: "Only clients can access this endpoint" });
      }

      const stats = await storage.getClientStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/projects/total-unread-bids', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'client') {
        return res.status(403).json({ message: "Only clients can check unread bids" });
      }

      const totalUnread = await storage.getTotalUnreadBidsForClient(userId);
      res.json({ totalUnread });
    } catch (error) {
      console.error("Error fetching total unread bids:", error);
      res.status(500).json({ message: "Failed to fetch total unread bids" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'client') {
        return res.status(403).json({ message: "Only clients can create projects" });
      }

      // Check project limit (10 active projects max)
      const activeCount = await storage.getActiveProjectCount(userId);
      if (activeCount >= 10) {
        return res.status(400).json({ message: "You have reached the limit of 10 active projects" });
      }

      const validated = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({ ...validated, userId });
      res.json(project);
    } catch (error: any) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: error.message || "Failed to create project" });
    }
  });

  // Bid routes
  app.get('/api/projects/:id/bids', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Only project owner or makers can see bids
      if (user?.userType === 'client' && project.userId !== userId) {
        return res.status(403).json({ message: "You can only see bids for your own projects" });
      }

      // Mark bids as read if client is viewing their project
      if (user?.userType === 'client' && project.userId === userId) {
        await storage.markBidsAsRead(id);
      }

      const bids = await storage.getBidsByProject(id);
      
      // Populate maker information
      const bidsWithMakers = await Promise.all(
        bids.map(async (bid) => {
          const maker = await storage.getUser(bid.makerId);
          const makerProfile = maker ? await storage.getMakerProfile(maker.id) : null;
          return { 
            ...bid, 
            maker: maker ? { ...maker, makerProfile } : undefined 
          };
        })
      );
      
      res.json(bidsWithMakers);
    } catch (error) {
      console.error("Error fetching bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  app.get('/api/projects/:id/unread-bid-count', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Only project owner can check unread bids count
      if (user?.userType !== 'client' || project.userId !== userId) {
        return res.status(403).json({ message: "You can only check bids for your own projects" });
      }

      const unreadCount = await storage.getUnreadBidCount(id);
      res.json({ unreadCount });
    } catch (error) {
      console.error("Error fetching unread bid count:", error);
      res.status(500).json({ message: "Failed to fetch unread bid count" });
    }
  });

  app.get('/api/projects/:id/my-bid', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'maker') {
        return res.status(403).json({ message: "Only makers can access this endpoint" });
      }

      const bid = await storage.getMakerBidForProject(userId, id);
      res.json(bid || null);
    } catch (error) {
      console.error("Error fetching bid:", error);
      res.status(500).json({ message: "Failed to fetch bid" });
    }
  });

  app.get('/api/projects/:id/accepted-bid', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Only project owner can see accepted bid
      if (user?.userType === 'client' && project.userId !== userId) {
        return res.status(403).json({ message: "You can only see bids for your own projects" });
      }

      const bids = await storage.getBidsByProject(id);
      const acceptedBid = bids.find(b => b.status === 'accepted');
      
      if (!acceptedBid) {
        return res.json(null);
      }

      // Populate maker information
      const maker = await storage.getUser(acceptedBid.makerId);
      const makerProfile = maker ? await storage.getMakerProfile(maker.id) : null;
      
      res.json({ 
        ...acceptedBid, 
        maker: maker ? { ...maker, makerProfile } : undefined 
      });
    } catch (error) {
      console.error("Error fetching accepted bid:", error);
      res.status(500).json({ message: "Failed to fetch accepted bid" });
    }
  });

  app.get('/api/projects/:id/download-stl', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json({ fileName: project.stlFileName });
    } catch (error) {
      console.error("Error downloading STL:", error);
      res.status(500).json({ message: "Failed to download STL" });
    }
  });

  app.get('/api/projects/:id/stl-content', async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (!project.stlFileContent) {
        return res.status(404).json({ message: "STL file not found" });
      }

      // Convert base64 to binary
      const binaryData = Buffer.from(project.stlFileContent, 'base64');
      res.type('application/octet-stream').send(binaryData);
    } catch (error) {
      console.error("Error serving STL content:", error);
      res.status(500).json({ message: "Failed to serve STL" });
    }
  });

  app.put('/api/projects/:id/mark-bids-read', isAuthenticated, async (req: any, res) => {
    try {
      const { id: projectId } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "You can only mark bids as read for your own projects" });
      }

      await storage.markBidsAsRead(projectId);
      res.json({ message: "Bids marked as read" });
    } catch (error) {
      console.error("Error marking bids as read:", error);
      res.status(500).json({ message: "Failed to mark bids as read" });
    }
  });

  app.post('/api/projects/:id/bids', isAuthenticated, async (req: any, res) => {
    try {
      const { id: projectId } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'maker') {
        return res.status(403).json({ message: "Only makers can submit bids" });
      }

      // Check if maker has completed profile
      const profile = await storage.getMakerProfile(userId);
      if (!profile) {
        return res.status(400).json({ message: "Please complete your maker profile first" });
      }

      // Check project exists and is active
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.status !== 'active') {
        return res.status(400).json({ message: "This project is no longer accepting bids" });
      }

      // Check if maker already has an active bid for this project
      const existingBid = await storage.getMakerBidForProject(userId, projectId);
      if (existingBid && existingBid.status !== 'rejected') {
        return res.status(400).json({ message: "You already have a bid for this project" });
      }

      const validated = insertBidSchema.parse(req.body);
      const bid = await storage.createBid({ 
        ...validated, 
        projectId, 
        makerId: userId 
      });

      // Notify project owner via WebSocket
      const ownerWs = wsClients.get(project.userId);
      if (ownerWs && ownerWs.readyState === WebSocket.OPEN) {
        ownerWs.send(JSON.stringify({
          type: 'new_bid',
          projectId,
          bidId: bid.id,
        }));
      }

      res.json(bid);
    } catch (error: any) {
      console.error("Error creating bid:", error);
      res.status(400).json({ message: error.message || "Failed to create bid" });
    }
  });

  app.put('/api/bids/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'client') {
        return res.status(403).json({ message: "Only clients can accept bids" });
      }

      const bid = await storage.getBid(id);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      const project = await storage.getProject(bid.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "You can only accept bids for your own projects" });
      }

      // Update bid status
      await storage.updateBidStatus(id, 'accepted');
      
      // Update project status to completed
      await storage.updateProjectStatus(bid.projectId, 'completed');

      // Reject all other pending bids for this project
      const allBids = await storage.getBidsByProject(bid.projectId);
      for (const otherBid of allBids) {
        if (otherBid.id !== id && otherBid.status === 'pending') {
          await storage.updateBidStatus(otherBid.id, 'rejected');
          
          // Notify other makers via WebSocket
          const makerWs = wsClients.get(otherBid.makerId);
          if (makerWs && makerWs.readyState === WebSocket.OPEN) {
            makerWs.send(JSON.stringify({
              type: 'bid_rejected',
              projectId: bid.projectId,
              bidId: otherBid.id,
            }));
          }
        }
      }

      // Notify accepted maker via WebSocket
      const acceptedMakerWs = wsClients.get(bid.makerId);
      if (acceptedMakerWs && acceptedMakerWs.readyState === WebSocket.OPEN) {
        acceptedMakerWs.send(JSON.stringify({
          type: 'bid_accepted',
          projectId: bid.projectId,
          bidId: id,
        }));
      }

      res.json({ message: "Bid accepted successfully" });
    } catch (error) {
      console.error("Error accepting bid:", error);
      res.status(500).json({ message: "Failed to accept bid" });
    }
  });

  app.put('/api/bids/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'client') {
        return res.status(403).json({ message: "Only clients can reject bids" });
      }

      const bid = await storage.getBid(id);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      const project = await storage.getProject(bid.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "You can only reject bids for your own projects" });
      }

      await storage.updateBidStatus(id, 'rejected');

      // Notify maker via WebSocket
      const makerWs = wsClients.get(bid.makerId);
      if (makerWs && makerWs.readyState === WebSocket.OPEN) {
        makerWs.send(JSON.stringify({
          type: 'bid_rejected',
          projectId: bid.projectId,
          bidId: id,
        }));
      }

      res.json({ message: "Bid rejected successfully" });
    } catch (error) {
      console.error("Error rejecting bid:", error);
      res.status(500).json({ message: "Failed to reject bid" });
    }
  });

  app.patch('/api/bids/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const bid = await storage.getBid(id);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      // Only the maker who created the bid can edit it
      if (bid.makerId !== userId) {
        return res.status(403).json({ message: "Only the bid creator can edit it" });
      }

      // Can only edit if bid is pending
      if (bid.status !== 'pending') {
        return res.status(400).json({ message: "Can only edit pending bids" });
      }

      const validated = updateBidSchema.parse(req.body);
      
      await storage.updateBid(id, validated);
      
      const updatedBid = await storage.getBid(id);
      res.json(updatedBid);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating bid:", error);
      res.status(500).json({ message: "Failed to update bid" });
    }
  });

  app.put('/api/bids/:id/confirm-delivery', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'client') {
        return res.status(403).json({ message: "Only clients can confirm delivery" });
      }

      if (!rating || rating < 0.5 || rating > 5) {
        return res.status(400).json({ message: "Valid rating is required" });
      }

      const bid = await storage.getBid(id);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      if (bid.status !== 'accepted') {
        return res.status(400).json({ message: "Can only confirm delivery for accepted bids" });
      }

      const project = await storage.getProject(bid.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "You can only confirm delivery for your own projects" });
      }

      // Create review for maker by client
      await storage.createReview({
        projectId: bid.projectId,
        fromUserId: userId,
        toUserId: bid.makerId,
        rating: Number(rating),
        comment: comment || "",
      });

      await storage.confirmBidDelivery(id);
      await storage.updateProjectStatus(bid.projectId, 'completed');

      // Notify maker via WebSocket
      const makerWs = wsClients.get(bid.makerId);
      if (makerWs && makerWs.readyState === WebSocket.OPEN) {
        makerWs.send(JSON.stringify({
          type: 'delivery_confirmed',
          projectId: bid.projectId,
          bidId: id,
          clientName: user?.firstName || user?.email || "Cliente",
          projectName: project?.name || "Proyecto",
          clientId: userId,
        }));
      }

      res.json({ message: "Delivery confirmed successfully" });
    } catch (error) {
      console.error("Error confirming delivery:", error);
      res.status(500).json({ message: "Failed to confirm delivery" });
    }
  });

  app.get('/api/bids/my-bids', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'maker') {
        return res.status(403).json({ message: "Only makers can access this endpoint" });
      }

      const bids = await storage.getBidsByMaker(userId);
      console.log(`[/api/bids/my-bids] User ${userId.slice(0, 8)}... has ${bids.length} bids:`, bids.map(b => ({ projectId: b.projectId, status: b.status })));
      res.json(bids);
    } catch (error) {
      console.error("Error fetching bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  app.get('/api/bids/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'maker') {
        return res.status(403).json({ message: "Only makers can access this endpoint" });
      }

      const stats = await storage.getMakerStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.put('/api/bids/:id/rate-client', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'maker') {
        return res.status(403).json({ message: "Only makers can rate clients" });
      }

      if (!rating || rating < 0.5 || rating > 5) {
        return res.status(400).json({ message: "Valid rating is required" });
      }

      const bid = await storage.getBid(id);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      if (bid.makerId !== userId) {
        return res.status(403).json({ message: "You can only rate your own clients" });
      }

      if (!bid.deliveryConfirmedAt) {
        return res.status(400).json({ message: "Can only rate after delivery is confirmed" });
      }

      // Create review for client by maker
      const project = await storage.getProject(bid.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

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

  app.get('/api/projects/:projectId/check-rating-by-maker', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Disable caching for this endpoint to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const bid = await storage.getMakerBidForProject(userId, projectId);
      if (!bid) {
        return res.status(404).json({ message: "No bid found for this project" });
      }

      console.log("Checking bid delivery status:", { bidId: bid.id, deliveryConfirmedAt: bid.deliveryConfirmedAt, status: bid.status });

      // Check if delivery has been confirmed by looking at deliveryConfirmedAt
      const deliveryConfirmed = !!bid.deliveryConfirmedAt;
      
      if (!deliveryConfirmed) {
        return res.json({ hasRated: false, deliveryConfirmed: false });
      }

      const review = await storage.getReviewForProject(projectId, userId, project.userId);
      res.json({ hasRated: !!review, deliveryConfirmed: true });
    } catch (error) {
      console.error("Error checking rating:", error);
      res.status(500).json({ message: "Failed to check rating" });
    }
  });

  app.put('/api/projects/:projectId/rate-client-from-won-project', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const { rating, comment } = req.body;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (user?.userType !== 'maker') {
        return res.status(403).json({ message: "Only makers can rate clients" });
      }

      if (!rating || rating < 0.5 || rating > 5) {
        return res.status(400).json({ message: "Valid rating is required" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const bid = await storage.getMakerBidForProject(userId, projectId);
      if (!bid) {
        return res.status(404).json({ message: "No bid found for this project" });
      }

      if (bid.status !== 'accepted' || !bid.deliveryConfirmedAt) {
        return res.status(400).json({ message: "Can only rate after delivery is confirmed" });
      }

      const existingReview = await storage.getReviewForProject(projectId, userId, project.userId);
      if (existingReview) {
        return res.status(400).json({ message: "You have already rated this client" });
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
  app.get('/api/maker-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const profile = await storage.getMakerProfile(userId);
      if (!profile) {
        return res.json(null);
      }
      // Normalize rating to number
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

  app.post('/api/maker-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'maker') {
        return res.status(403).json({ message: "Only makers can create profiles" });
      }

      const validated = insertMakerProfileSchema.parse(req.body);
      const profile = await storage.upsertMakerProfile({ ...validated, userId });
      res.json(profile);
    } catch (error: any) {
      console.error("Error creating maker profile:", error);
      res.status(400).json({ message: error.message || "Failed to create maker profile" });
    }
  });

  app.put('/api/maker-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'maker') {
        return res.status(403).json({ message: "Only makers can update profiles" });
      }

      const validated = insertMakerProfileSchema.parse(req.body);
      const profile = await storage.upsertMakerProfile({ ...validated, userId });
      res.json(profile);
    } catch (error: any) {
      console.error("Error updating maker profile:", error);
      res.status(400).json({ message: error.message || "Failed to update maker profile" });
    }
  });

  // Message routes
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { projectId, marketplaceDesignId, otherUserId } = req.query;
      
      console.log(`[GET /api/messages] userId: ${userId.slice(0, 8)}..., otherUserId: ${otherUserId?.slice(0, 8)}..., projectId: ${projectId}, marketplaceDesignId: ${marketplaceDesignId}`);
      
      if (!otherUserId) {
        return res.status(400).json({ message: "otherUserId is required" });
      }

      // If projectId is provided, use project-based messages
      if (projectId) {
        const messages = await storage.getMessagesByContext(userId, otherUserId as string, "project", projectId as string);
        console.log(`[GET /api/messages] Returning ${messages.length} messages for project ${(projectId as string).slice(0, 8)}...`);
        return res.json(messages);
      }
      
      // If marketplaceDesignId is provided, use design-based messages
      if (marketplaceDesignId) {
        const messages = await storage.getMessagesByContext(userId, otherUserId as string, "marketplace_design", marketplaceDesignId as string);
        console.log(`[GET /api/messages] Returning ${messages.length} messages for design ${(marketplaceDesignId as string).slice(0, 8)}...`);
        return res.json(messages);
      }
      
      // Either projectId or marketplaceDesignId is required
      console.log(`[GET /api/messages] ERROR: Missing context (projectId and marketplaceDesignId both empty)`);
      return res.status(400).json({ message: "Either projectId or marketplaceDesignId is required" });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validated = insertMessageSchema.parse(req.body);
      
      // Set senderId from authenticated user
      const messageData = { ...validated, senderId: userId };
      
      const message = await storage.createMessage(messageData);
      
      // Notify receiver via WebSocket
      const receiverWs = wsClients.get(validated.receiverId);
      if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
        receiverWs.send(JSON.stringify({
          type: 'new_message',
          messageId: message.id,
          senderId: userId,
          contextType: validated.contextType,
          projectId: validated.projectId,
          marketplaceDesignId: validated.marketplaceDesignId,
        }));
      }

      res.json(message);
    } catch (error: any) {
      console.error("Error creating message:", error);
      res.status(400).json({ message: error.message || "Failed to create message" });
    }
  });

  app.put('/api/messages/mark-read/:otherUserId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { otherUserId } = req.params;
      const { projectId, marketplaceDesignId } = req.query;
      
      if (!otherUserId) {
        return res.status(400).json({ message: "otherUserId is required" });
      }

      // If projectId is provided, mark messages as read by project context
      if (projectId) {
        await storage.markMessagesAsReadByContext(userId, otherUserId, "project", projectId as string);
        return res.json({ success: true });
      }
      
      // If marketplaceDesignId is provided, mark messages as read by design context
      if (marketplaceDesignId) {
        await storage.markMessagesAsReadByContext(userId, otherUserId, "marketplace_design", marketplaceDesignId as string);
        return res.json({ success: true });
      }
      
      // Either projectId or marketplaceDesignId is required
      return res.status(400).json({ message: "Either projectId or marketplaceDesignId is required" });
    } catch (error: any) {
      console.error("Error marking messages as read:", error);
      res.status(400).json({ message: error.message || "Failed to mark messages as read" });
    }
  });

  app.get('/api/my-conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const conversations = await storage.getConversationsWithUnread(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/my-conversations-full', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const conversations = await storage.getConversationsWithUnread(userId);
      
      // Enrich with user data and project/design data
      const enriched = await Promise.all(
        conversations.map(async (conv) => {
          const user = await storage.getUser(conv.userId);
          const project = conv.projectId ? await storage.getProject(conv.projectId) : null;
          const design = conv.marketplaceDesignId ? await storage.getMarketplaceDesign(conv.marketplaceDesignId) : null;
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
  app.get('/api/makers/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const reviews = await storage.getReviewsForMaker(id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/reviews/my-reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const reviews = await storage.getReviewsForMaker(userId);
      
      // Enrich reviews with author user data
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

  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validated = insertReviewSchema.parse(req.body);
      
      // Only client can review maker
      const user = await storage.getUser(userId);
      if (user?.userType !== 'client') {
        return res.status(403).json({ message: "Only clients can leave reviews" });
      }

      // Verify the bid was accepted
      const bid = await storage.getBid(validated.projectId);
      if (!bid || bid.status !== 'accepted' || bid.makerId !== validated.toUserId) {
        return res.status(400).json({ message: "Invalid project or bid" });
      }

      const review = await storage.createReview({ ...validated, fromUserId: userId });
      res.json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: error.message || "Failed to create review" });
    }
  });

  // Marketplace design routes
  app.get('/api/marketplace/designs', async (req: any, res) => {
    try {
      const designs = await storage.getMarketplaceDesigns({ status: 'active' });
      
      // Enrich with maker data
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

  app.get('/api/marketplace/designs/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const design = await storage.getMarketplaceDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      
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

  app.get('/api/my-designs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (user?.userType !== 'maker') {
        return res.status(403).json({ message: "Only makers can upload designs" });
      }
      
      const designs = await storage.getMarketplaceDesigns({ makerId: userId });
      res.json(designs);
    } catch (error) {
      console.error("Error fetching my designs:", error);
      res.status(500).json({ message: "Failed to fetch designs" });
    }
  });

  app.post('/api/marketplace/designs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (user?.userType !== 'maker') {
        return res.status(403).json({ message: "Only makers can upload designs" });
      }
      
      const validated = insertMarketplaceDesignSchema.parse(req.body);
      
      // Validate price for minimum type
      if (validated.priceType === "minimum") {
        const price = parseFloat(String(validated.price)) || 0;
        // If minimum price > 0, it must be at least 0.5
        if (price > 0 && price < 0.5) {
          return res.status(400).json({ message: "Minimum price must be €0.00 (free) or at least €0.50" });
        }
      }
      
      const design = await storage.createMarketplaceDesign({ ...validated, makerId: userId });
      res.json(design);
    } catch (error: any) {
      console.error("Error creating design:", error);
      res.status(400).json({ message: error.message || "Failed to create design" });
    }
  });

  app.put('/api/marketplace/designs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { id } = req.params;
      const design = await storage.getMarketplaceDesign(id);
      
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      
      if (design.makerId !== userId) {
        return res.status(403).json({ message: "You can only edit your own designs" });
      }
      
      const validated = insertMarketplaceDesignSchema.partial().parse(req.body);
      
      // Validate price for minimum type
      const priceType = validated.priceType || design.priceType;
      if (priceType === "minimum") {
        const price = parseFloat(String(validated.price ?? design.price)) || 0;
        // If minimum price > 0, it must be at least 0.5
        if (price > 0 && price < 0.5) {
          return res.status(400).json({ message: "Minimum price must be €0.00 (free) or at least €0.50" });
        }
      }
      
      await storage.updateMarketplaceDesign(id, validated);
      const updated = await storage.getMarketplaceDesign(id);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating design:", error);
      res.status(400).json({ message: error.message || "Failed to update design" });
    }
  });

  app.delete('/api/marketplace/designs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { id } = req.params;
      const design = await storage.getMarketplaceDesign(id);
      
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      
      if (design.makerId !== userId) {
        return res.status(403).json({ message: "You can only delete your own designs" });
      }
      
      await storage.deleteMarketplaceDesign(id);
      res.json({ message: "Design deleted" });
    } catch (error) {
      console.error("Error deleting design:", error);
      res.status(500).json({ message: "Failed to delete design" });
    }
  });

  // Design purchase routes
  app.get('/api/marketplace/designs/:id/access', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const design = await storage.getMarketplaceDesign(id);
      
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      // Check if maker (can always access) or buyer (must have purchased or free)
      if (design.makerId === userId) {
        return res.json({ canAccess: true, reason: "maker" });
      }

      if (design.priceType === "free") {
        return res.json({ canAccess: true, reason: "free" });
      }

      const hasPurchased = await storage.userHasPurchasedDesign(userId, id);
      res.json({ canAccess: hasPurchased, reason: hasPurchased ? "purchased" : "not_purchased" });
    } catch (error) {
      console.error("Error checking access:", error);
      res.status(500).json({ message: "Failed to check access" });
    }
  });

  app.post('/api/marketplace/designs/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const design = await storage.getMarketplaceDesign(id);
      
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      // Check access
      if (design.makerId !== userId && design.priceType !== "free") {
        const hasPurchased = await storage.userHasPurchasedDesign(userId, id);
        if (!hasPurchased) {
          return res.status(403).json({ message: "Must purchase design first" });
        }
      }

      if (!design.stlFileContent) {
        return res.status(404).json({ message: "STL file not available" });
      }

      // Return STL file
      res.json({ stlFileContent: design.stlFileContent, fileName: `${design.title}.stl` });
    } catch (error) {
      console.error("Error downloading design:", error);
      res.status(500).json({ message: "Failed to download design" });
    }
  });

  app.post('/api/marketplace/designs/:id/purchase-free', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const design = await storage.getMarketplaceDesign(id);
      
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      // Can ONLY acquire truly free designs
      if (design.priceType !== "free") {
        return res.status(400).json({ message: "This design cannot be acquired for free. Please use checkout for paid designs." });
      }

      // Create purchase record (free)
      const purchase = await storage.createDesignPurchase({
        designId: id,
        buyerId: userId,
        makerId: design.makerId,
        amountPaid: "0.00",
        paymentMethod: "free",
        status: "completed",
      });

      res.json({ message: "Design acquired", purchase });
    } catch (error: any) {
      console.error("Error recording free purchase:", error);
      res.status(500).json({ message: error.message || "Failed to acquire design" });
    }
  });

  // Stripe checkout for paid designs - creates a checkout session
  app.post('/api/marketplace/designs/:id/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { amount } = req.body;

      const design = await storage.getMarketplaceDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Validate price
      let finalAmount = parseFloat(amount || String(design.price));
      
      if (design.priceType === "fixed") {
        finalAmount = parseFloat(String(design.price));
      } else if (design.priceType === "minimum") {
        const designPrice = parseFloat(String(design.price));
        // If minimum price > 0, ensure at least 0.5€ is paid
        if (designPrice > 0 && finalAmount < 0.5) {
          return res.status(400).json({ message: `Amount must be at least €0.50` });
        }
        // If minimum price is 0, can be free, otherwise must meet minimum
        if (designPrice > 0 && finalAmount < designPrice) {
          return res.status(400).json({ message: `Amount must be at least €${designPrice}` });
        }
      }

      // Convert amount to cents (Stripe uses cents)
      const amountInCents = Math.round(finalAmount * 100);

      // Create Stripe checkout session
      const stripe = await getUncachableStripeClient();
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              unit_amount: amountInCents,
              product_data: {
                name: design.name || 'Design Purchase',
                description: `Designed by ${design.makerId}`,
              },
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/marketplace-design/${id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/marketplace-design/${id}?payment=canceled`,
        metadata: {
          designId: id,
          buyerId: userId,
          makerId: design.makerId,
          designName: design.name,
          amount: finalAmount.toString(),
        },
      });

      res.json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      res.status(500).json({ message: error.message || "Failed to create checkout" });
    }
  });

  // Confirm payment from checkout session and create purchase record
  app.post('/api/marketplace/designs/:id/confirm-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      const design = await storage.getMarketplaceDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      // Verify checkout session with Stripe
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      // Check if purchase already exists
      const existing = await storage.userHasPurchasedDesign(userId, id);
      if (existing) {
        return res.json({ message: "Design already purchased" });
      }

      // Get payment intent to get the amount
      let amountPaid = "0.00";
      if (session.payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
        amountPaid = (paymentIntent.amount / 100).toFixed(2);
      }

      // Create purchase record
      const purchase = await storage.createDesignPurchase({
        designId: id,
        buyerId: userId,
        makerId: design.makerId,
        amountPaid: amountPaid,
        paymentMethod: "stripe",
        status: "completed",
      });

      // Create maker earning (with retention period)
      const earning = await storage.createMakerEarning(design.makerId, purchase.id, amountPaid);

      res.json({ message: "Purchase recorded", purchase, earning });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: error.message || "Failed to confirm payment" });
    }
  });

  // Get PayPal status endpoint
  app.get('/api/paypal/status', (req, res) => {
    const hasPayPal = !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET;
    res.json({ available: hasPayPal });
  });

  // Create PayPal order for marketplace design
  app.post('/api/marketplace/designs/:id/paypal-order', isAuthenticated, async (req: any, res) => {
    try {
      // Check if PayPal is configured
      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        return res.status(503).json({ message: "PayPal is not configured" });
      }

      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { amount } = req.body;

      const design = await storage.getMarketplaceDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      // Validate price
      let finalAmount = parseFloat(amount || String(design.price));
      
      if (design.priceType === "fixed") {
        finalAmount = parseFloat(String(design.price));
      } else if (design.priceType === "minimum") {
        const designPrice = parseFloat(String(design.price));
        if (designPrice > 0 && finalAmount < 0.5) {
          return res.status(400).json({ message: `Amount must be at least €0.50` });
        }
        if (designPrice > 0 && finalAmount < designPrice) {
          return res.status(400).json({ message: `Amount must be at least €${designPrice}` });
        }
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // Create PayPal order using REST API
      const clientId = await getPayPalClientId();
      const auth = Buffer.from(`${clientId}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
      
      const isProduction = process.env.REPLIT_DEPLOYMENT === '1' || process.env.NODE_ENV === 'production';
      const apiBase = isProduction ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
      
      // Get access token
      const tokenResponse = await fetch(`${apiBase}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials'
      });
      
      const tokenData = await tokenResponse.json() as any;
      const accessToken = tokenData.access_token;

      // Create order
      const orderResponse = await fetch(`${apiBase}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: 'EUR',
              value: finalAmount.toFixed(2),
            },
            description: design.name || 'Design Purchase',
          }],
          application_context: {
            return_url: `${baseUrl}/marketplace-design/${id}?payment=success&paypal=true`,
            cancel_url: `${baseUrl}/marketplace-design/${id}?payment=canceled`,
            brand_name: 'VoxelHub',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
          },
        })
      });

      const order = await orderResponse.json() as any;
      
      if (!order.id) {
        throw new Error('Failed to create PayPal order');
      }

      res.json({
        orderId: order.id,
        approvalUrl: order.links.find((link: any) => link.rel === 'approve')?.href,
      });
    } catch (error: any) {
      console.error("Error creating PayPal order:", error);
      res.status(500).json({ message: error.message || "Failed to create PayPal order" });
    }
  });

  // Capture PayPal order
  app.post('/api/marketplace/designs/:id/paypal-capture', isAuthenticated, async (req: any, res) => {
    try {
      // Check if PayPal is configured
      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        return res.status(503).json({ message: "PayPal is not configured" });
      }

      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { orderId } = req.body;

      if (!orderId) {
        return res.status(400).json({ message: "Order ID required" });
      }

      const design = await storage.getMarketplaceDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      // Check if purchase already exists
      const existing = await storage.userHasPurchasedDesign(userId, id);
      if (existing) {
        return res.json({ message: "Design already purchased" });
      }

      const clientId = await getPayPalClientId();
      const auth = Buffer.from(`${clientId}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
      
      const isProduction = process.env.REPLIT_DEPLOYMENT === '1' || process.env.NODE_ENV === 'production';
      const apiBase = isProduction ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
      
      // Get access token
      const tokenResponse = await fetch(`${apiBase}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials'
      });
      
      const tokenData = await tokenResponse.json() as any;
      const accessToken = tokenData.access_token;

      // Capture order
      const captureResponse = await fetch(`${apiBase}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const capture = await captureResponse.json() as any;
      
      if (capture.status !== 'COMPLETED') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      // Get amount from capture
      const amountPaid = capture.purchase_units[0].payments.captures[0].amount.value;

      // Create purchase record
      const purchase = await storage.createDesignPurchase({
        designId: id,
        buyerId: userId,
        makerId: design.makerId,
        amountPaid: amountPaid,
        paymentMethod: "paypal",
        status: "completed",
      });

      // Create maker earning
      const earning = await storage.createMakerEarning(design.makerId, purchase.id, amountPaid);

      res.json({ message: "Purchase recorded", purchase, earning });
    } catch (error: any) {
      console.error("Error capturing PayPal order:", error);
      res.status(500).json({ message: error.message || "Failed to capture PayPal order" });
    }
  });

  // Maker balance endpoints
  app.get('/api/maker/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const totalBalance = await storage.getMakerBalance(userId);
      const availableBalance = await storage.getMakerAvailableBalance(userId);

      res.json({
        totalBalance,
        availableBalance,
        message: "Balance fetched successfully"
      });
    } catch (error: any) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: error.message || "Failed to fetch balance" });
    }
  });

  // Update payout method
  app.post('/api/maker/payout-method', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { method, stripeEmail, paypalEmail, bankAccountIban, bankAccountName } = req.body;

      if (!method || !["stripe", "paypal", "bank"].includes(method)) {
        return res.status(400).json({ message: "Invalid payout method" });
      }

      const profile = await storage.updatePayoutMethod(userId, method, {
        stripeEmail,
        paypalEmail,
        bankAccountIban,
        bankAccountName,
      });

      res.json({
        message: "Payout method updated successfully",
        profile
      });
    } catch (error: any) {
      console.error("Error updating payout method:", error);
      res.status(500).json({ message: error.message || "Failed to update payout method" });
    }
  });

  // Get maker payouts
  app.get('/api/maker/payouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const payouts = await storage.getMakerPayouts(userId);

      res.json({
        payouts
      });
    } catch (error: any) {
      console.error("Error fetching payouts:", error);
      res.status(500).json({ message: error.message || "Failed to fetch payouts" });
    }
  });

  // Request payout
  app.post('/api/maker/request-payout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { amount } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const profile = await storage.getMakerProfile(userId);
      if (!profile || !profile.payoutMethod) {
        return res.status(400).json({ message: "Please configure a payout method first" });
      }

      // Check minimum for payouts
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
          message: `Insufficient balance. Available: €${availableBalance}` 
        });
      }

      // Create payout request
      const payout = await storage.createMakerPayout(userId, amount, profile.payoutMethod);

      res.json({
        message: "Payout request created successfully",
        payout
      });
    } catch (error: any) {
      console.error("Error requesting payout:", error);
      res.status(500).json({ message: error.message || "Failed to request payout" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'register' && message.userId) {
          wsClients.set(message.userId, ws);
          console.log(`User ${message.userId} registered for WebSocket notifications`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      // Remove client from map
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
