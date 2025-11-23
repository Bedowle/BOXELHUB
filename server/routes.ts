import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertBidSchema, insertMakerProfileSchema, insertMessageSchema, insertReviewSchema } from "@shared/schema";
import { getAuthenticatedUserId } from "./replitAuth";

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

      // Check if maker already has a bid for this project
      const existingBid = await storage.getMakerBidForProject(userId, projectId);
      if (existingBid) {
        return res.status(400).json({ message: "You already have a bid for this project" });
      }

      // Check active bid limit (2 max)
      const activeBidCount = await storage.getActiveBidCount(userId);
      if (activeBidCount >= 2) {
        return res.status(400).json({ message: "You have reached the limit of 2 active bids" });
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
      
      // Update project status to reserved
      await storage.updateProjectStatus(bid.projectId, 'reserved');

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

  // Maker profile routes
  app.get('/api/maker-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const profile = await storage.getMakerProfile(userId);
      res.json(profile || null);
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
      const { otherUserId } = req.query;
      
      if (!otherUserId) {
        return res.status(400).json({ message: "otherUserId is required" });
      }

      const messages = await storage.getMessages(userId, otherUserId as string);
      res.json(messages);
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
      
      const message = await storage.createMessage({ ...validated, senderId: userId });
      
      // Notify receiver via WebSocket
      const receiverWs = wsClients.get(validated.receiverId);
      if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
        receiverWs.send(JSON.stringify({
          type: 'new_message',
          messageId: message.id,
          senderId: userId,
        }));
      }

      res.json(message);
    } catch (error: any) {
      console.error("Error creating message:", error);
      res.status(400).json({ message: error.message || "Failed to create message" });
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
