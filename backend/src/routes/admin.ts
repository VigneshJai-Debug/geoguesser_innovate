import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/admin.js';
import * as bcrypt from 'bcryptjs';

export const adminRouter = Router();

// Admin authentication
adminRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Admin password is required.' });
      return;
    }
    
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      res.status(500).json({ error: 'Admin password not configured.' });
      return;
    }
    
    // Simple password comparison (in production, consider hashing)
    if (password !== adminPassword) {
      res.status(401).json({ error: 'Invalid admin password.' });
      return;
    }
    
    req.session.isAdmin = true;
    
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /admin/login]', err);
    res.status(500).json({ error: 'Internal server error during admin login.' });
  }
});

// Admin logout
adminRouter.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[POST /admin/logout]', err);
      res.status(500).json({ error: 'Failed to log out.' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Admin middleware - all routes below require admin auth
adminRouter.use(requireAdmin);

// Get admin state (dashboard overview)
adminRouter.get('/state', async (req: Request, res: Response): Promise<void> => {
  try {
    const gameState = await prisma.gameState.findUnique({ where: { id: 1 } });
    
    if (!gameState) {
      res.status(404).json({ error: 'Game state not found.' });
      return;
    }
    
    // Get counts for dashboard
    const [teamCount, teamSetCount, teamMemberCount] = await Promise.all([
      prisma.team.count(),
      prisma.teamSet.count(),
      prisma.teamMember.count(),
    ]);
    
    // Get recent event progress
    const recentProgress = await prisma.eventProgress.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: { team: true },
    });
    
    res.json({
      gameState,
      stats: {
        teamCount,
        teamSetCount,
        teamMemberCount,
      },
      recentProgress,
    });
  } catch (err) {
    console.error('[GET /admin/state]', err);
    res.status(500).json({ error: 'Failed to load admin state.' });
  }
});

// GameState control
adminRouter.post('/gamestate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { activeEventNumber, eventOpen } = req.body;
    
    const updates: any = {};
    if (activeEventNumber !== undefined) {
      if (typeof activeEventNumber !== 'number' || activeEventNumber < 1 || activeEventNumber > 7) {
        res.status(400).json({ error: 'Active event number must be between 1 and 7.' });
        return;
      }
      updates.activeEventNumber = activeEventNumber;
    }
    
    if (eventOpen !== undefined) {
      if (typeof eventOpen !== 'boolean') {
        res.status(400).json({ error: 'Event open must be a boolean.' });
        return;
      }
      updates.eventOpen = eventOpen;
    }
    
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid updates provided.' });
      return;
    }
    
    updates.updatedAt = new Date();
    
    const gameState = await prisma.gameState.update({
      where: { id: 1 },
      data: updates,
    });
    
    res.json({
      success: true,
      gameState,
    });
  } catch (err) {
    console.error('[POST /admin/gamestate]', err);
    res.status(500).json({ error: 'Failed to update game state.' });
  }
});

// TeamSet management
adminRouter.get('/sets', async (req: Request, res: Response): Promise<void> => {
  try {
    const sets = await prisma.teamSet.findMany({
      include: { teams: true },
    });
    
    res.json({ sets });
} catch (err) {
    console.error('[GET /admin/sets]', err);
    res.status(500).json({ error: 'Failed to load team sets.' });
  }
});

adminRouter.post('/sets', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Set name is required.' });
      return;
    }
    
    const set = await prisma.teamSet.create({
      data: { name: name.trim() },
    });
    
    res.json({ success: true, set });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(400).json({ error: 'A set with this name already exists.' });
      return;
    }
    console.error('[POST /admin/sets]', err);
    res.status(500).json({ error: 'Failed to create team set.' });
  }
});

adminRouter.put('/sets/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Set name is required.' });
      return;
    }
    
    const set = await prisma.teamSet.update({
      where: { id },
      data: { name: name.trim() },
    });
    
    res.json({ success: true, set });
  } catch (err: any) {
     if (err.code === 'P2025') {
       res.status(404).json({ error: 'Team set not found.' });
       return;
     }
    if (err.code === 'P2002') {
      res.status(400).json({ error: 'A set with this name already exists.' });
      return;
    }
    console.error('[PUT /admin/sets/:id]', err);
    res.status(500).json({ error: 'Failed to update team set.' });
  }
});

adminRouter.delete('/sets/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.teamSet.delete({
      where: { id },
    });
    
    res.json({ success: true });
  } catch (err: any) {
     if (err.code === 'P2025') {
       res.status(404).json({ error: 'Team set not found.' });
       return;
     }
    console.error('[DELETE /admin/sets/:id]', err);
    res.status(500).json({ error: 'Failed to delete team set.' });
  }
});

// Team management
adminRouter.get('/teams', async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        set: true,
        members: {
          orderBy: { memberOrder: 'asc' },
        },
      },
    });
    
    res.json({ teams });
  } catch (err) {
    console.error('[GET /admin/teams]', err);
    res.status(500).json({ error: 'Failed to load teams.' });
  }
});

adminRouter.post('/teams', async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamName, members, setId } = req.body;
    
    if (!teamName || typeof teamName !== 'string' || !teamName.trim()) {
      res.status(400).json({ error: 'Team name is required.' });
      return;
    }
    
    if (!Array.isArray(members) || members.length === 0) {
      res.status(400).json({ error: 'At least one member is required.' });
      return;
    }
    
    // Limit to 4 members as per requirements
    if (members.length > 4) {
      res.status(400).json({ error: 'Maximum of 4 members allowed.' });
      return;
    }
    
    // Validate members
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member.name || typeof member.name !== 'string' || !member.name.trim()) {
        res.status(400).json({ error: `Member ${i + 1} name is required.` });
        return;
      }
      if (!member.registrationNumber || typeof member.registrationNumber !== 'string' || !member.registrationNumber.trim()) {
        res.status(400).json({ error: `Member ${i + 1} registration number is required.` });
        return;
      }
    }
    
    // Generate password: team_name_last4digits of lead member's registration number
    const cleanTeamName = teamName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    
    const leadRegistrationNumber = members[0].registrationNumber.trim();
    const lastFour = leadRegistrationNumber.slice(-4);
    const password = `${cleanTeamName}_${lastFour}`;
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create team and members in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create team
      const team = await tx.team.create({
        data: {
          teamName: teamName.trim(),
          passwordHash,
          setId: setId || null,
        },
      });
      
      // Create members
       // Create members
       const memberPromises = members.map((memberData, index) => 
         tx.teamMember.create({
           data: {
             teamId: team.id,
             name: memberData.name.trim(),
             registrationNumber: memberData.registrationNumber.trim(),
             memberOrder: index + 1,
           }
         })
       );

      await Promise.all(memberPromises);

      return { team, password };
    });
    
    res.json({
      success: true,
      team: result.team,
      generatedPassword: result.password, // Return plaintext password only once for admin to copy
    });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(400).json({ error: 'A team with this name already exists.' });
      return;
    }
    console.error('[POST /admin/teams]', err);
    res.status(500).json({ error: 'Failed to create team.' });
  }
});

adminRouter.put('/teams/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { teamName, setId } = req.body;
    
    const updates: any = {};
    if (teamName !== undefined) {
      if (typeof teamName !== 'string' || !teamName.trim()) {
        res.status(400).json({ error: 'Team name is required.' });
        return;
      }
      updates.teamName = teamName.trim();
    }
    
    if (setId !== undefined) {
      if (setId === null) {
        updates.setId = null;
      } else {
        const setExists = await prisma.teamSet.findUnique({ where: { id: setId } });
        if (!setExists) {
          res.status(400).json({ error: 'Team set not found.' });
          return;
        }
        updates.setId = setId;
      }
    }
    
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid updates provided.' });
      return;
    }
    
    const team = await prisma.team.update({
      where: { id },
      data: updates,
    });
    
    res.json({ success: true, team });
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Team not found.' });
      return;
    }
    if (err.code === 'P2002') {
      res.status(400).json({ error: 'A team with this name already exists.' });
      return;
    }
    console.error('[PUT /admin/teams/:id]', err);
    res.status(500).json({ error: 'Failed to update team.' });
  }
});

adminRouter.delete('/teams/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.team.delete({
      where: { id },
    });
    
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Team not found.' });
      return;
    }
    console.error('[DELETE /admin/teams/:id]', err);
    res.status(500).json({ error: 'Failed to delete team.' });
  }
});

// Team progress viewing
adminRouter.get('/progress', async (req: Request, res: Response): Promise<void> => {
  try {
    const progress = await prisma.eventProgress.findMany({
      include: {
        team: {
          include: { set: true },
        },
      },
      orderBy: [
        { eventNumber: 'asc' },
        { team: { teamName: 'asc' } },
      ],
    });
    
    res.json({ progress });
  } catch (err) {
    console.error('[GET /admin/progress]', err);
    res.status(500).json({ error: 'Failed to load event progress.' });
  }
});

// Submissions viewing (focus on Event 1 screenshots and verification)
adminRouter.get('/submissions', async (req: Request, res: Response): Promise<void> => {
  try {
    const submissions = await prisma.eventProgress.findMany({
      where: {
        submissionBlobUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        teamId: true,
        eventNumber: true,
        submissionBlobUrl: true,
        verificationStatus: true,
        submittedAt: true,
        team: {
          select: {
            id: true,
            teamName: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
    
    res.json({ submissions });
  } catch (err) {
    console.error('[GET /admin/submissions]', err);
    res.status(500).json({ error: 'Failed to load submissions.' });
  }
});

// Event 1 verification update
adminRouter.patch('/submissions/:id/verification', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;
    
    if (!verificationStatus || !['PENDING', 'VERIFIED', 'REJECTED'].includes(verificationStatus)) {
      res.status(400).json({ error: 'Valid verification status is required (PENDING, VERIFIED, REJECTED).' });
      return;
    }
    
    const progress = await prisma.eventProgress.update({
      where: { id },
      data: { verificationStatus },
    });
    
    res.json({ success: true, progress });
   } catch (err: any) {
     if (err.code === 'P2025') {
       res.status(404).json({ error: 'Team set not found.' });
       return;
     }
    console.error('[PATCH /admin/submissions/:id/verification]', err);
    res.status(500).json({ error: 'Failed to update verification status.'} );
  }
});