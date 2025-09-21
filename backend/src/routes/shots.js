const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const prisma = new PrismaClient();

// Available clubs
const AVAILABLE_CLUBS = [
  'Driver', '3-Wood', '5-Wood', 'Hybrid', '4-Iron', '5-Iron', '6-Iron', 
  '7-Iron', '8-Iron', '9-Iron', 'PW', 'SW', 'LW', 'Putter'
];

// Available locations (From Where)
const AVAILABLE_LOCATIONS = [
  'tee', 'left_rough', 'right_rough', 'fairway', 'green', 'bunker', 'left_woods', 'right_woods', 'downgrade', 'fringe'
];

// Available target locations (Where did the ball land)
const AVAILABLE_TARGET_LOCATIONS = [
  'tee', 'left_rough', 'right_rough', 'fairway', 'green', 'bunker', 'left_woods', 'right_woods', 'downgrade', 'water', 'hole', 'fringe'
];

// Available results
const AVAILABLE_RESULTS = ['success', 'fail'];

// GET /api/shots/clubs - Get available clubs
router.get('/clubs', (req, res) => {
  res.json({ clubs: AVAILABLE_CLUBS });
});

// GET /api/shots/locations - Get available locations
router.get('/locations', (req, res) => {
  res.json({ 
    locations: AVAILABLE_LOCATIONS,
    targetLocations: AVAILABLE_TARGET_LOCATIONS 
  });
});

// POST /api/shots - Create a new shot
router.post('/', [
  body('roundId').isUUID().withMessage('Valid round ID is required'),
  body('playerId').isUUID().withMessage('Valid player ID is required'),
  body('holeNumber').isInt({ min: 1, max: 18 }).withMessage('Hole number must be between 1 and 18'),
  body('shotNumber').isInt({ min: 1 }).withMessage('Shot number must be at least 1'),
  body('club').isIn(AVAILABLE_CLUBS).withMessage('Invalid club selection'),
  body('distance').isInt({ min: 0 }).withMessage('Distance must be a non-negative number'),
  body('location').isIn(AVAILABLE_LOCATIONS).withMessage('Invalid location'),
  body('targetLocation').optional().isIn(AVAILABLE_TARGET_LOCATIONS).withMessage('Invalid target location'),
  body('result').optional().isIn(AVAILABLE_RESULTS).withMessage('Result must be success or fail'),
  body('error').optional().isString(),
  body('isPenalty').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      roundId,
      playerId,
      holeNumber,
      shotNumber,
      club,
      distance,
      location,
      targetLocation,
      result,
      error,
      isPenalty = false
    } = req.body;

    // Validate that round and player exist and player is in the round
    const roundPlayer = await prisma.roundPlayer.findFirst({
      where: {
        roundId,
        playerId
      }
    });

    if (!roundPlayer) {
      return res.status(400).json({ 
        error: 'Player is not part of this round' 
      });
    }

    // Check if shot already exists
    const existingShot = await prisma.shot.findFirst({
      where: {
        roundId,
        playerId,
        holeNumber,
        shotNumber
      }
    });

    if (existingShot) {
      return res.status(400).json({ 
        error: 'Shot already exists for this player, hole, and shot number' 
      });
    }

    const shotData = {
      id: uuidv4(),
      roundId,
      playerId,
      holeNumber,
      shotNumber,
      club,
      distance,
      location,
      isPenalty: isPenalty || false
    };

    // Only add optional fields if they are provided
    if (targetLocation) {
      shotData.targetLocation = targetLocation;
    }
    if (result) {
      shotData.result = result;
      shotData.error = result === 'fail' ? error : null;
    }

    const shot = await prisma.shot.create({
      data: shotData,
      include: {
        player: true
      }
    });

    res.status(201).json(shot);
  } catch (error) {
    console.error('Error creating shot:', error);
    res.status(500).json({ error: 'Failed to create shot' });
  }
});

// PUT /api/shots/:id - Update a shot
router.put('/:id', [
  body('club').optional().isIn(AVAILABLE_CLUBS),
  body('distance').optional().isInt({ min: 0 }),
  body('location').optional().isIn(AVAILABLE_LOCATIONS),
  body('targetLocation').optional().isIn(AVAILABLE_TARGET_LOCATIONS),
  body('result').optional().isIn(AVAILABLE_RESULTS),
  body('error').optional().isString(),
  body('isPenalty').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if shot exists
    const existingShot = await prisma.shot.findUnique({
      where: { id }
    });

    if (!existingShot) {
      return res.status(404).json({ error: 'Shot not found' });
    }

    // If result is success, clear error
    if (updateData.result === 'success') {
      updateData.error = null;
    }

    const shot = await prisma.shot.update({
      where: { id },
      data: updateData,
      include: {
        player: true
      }
    });

    res.json(shot);
  } catch (error) {
    console.error('Error updating shot:', error);
    res.status(500).json({ error: 'Failed to update shot' });
  }
});

// DELETE /api/shots/:id - Delete a shot
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if shot exists
    const shot = await prisma.shot.findUnique({
      where: { id }
    });

    if (!shot) {
      return res.status(404).json({ error: 'Shot not found' });
    }

    await prisma.shot.delete({
      where: { id }
    });

    res.json({ message: 'Shot deleted successfully' });
  } catch (error) {
    console.error('Error deleting shot:', error);
    res.status(500).json({ error: 'Failed to delete shot' });
  }
});

// POST /api/shots/penalty - Add penalty shot
router.post('/penalty', [
  body('roundId').isUUID().withMessage('Valid round ID is required'),
  body('playerId').isUUID().withMessage('Valid player ID is required'),
  body('holeNumber').isInt({ min: 1, max: 18 }).withMessage('Hole number must be between 1 and 18')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roundId, playerId, holeNumber } = req.body;

    // Validate that round and player exist and player is in the round
    const roundPlayer = await prisma.roundPlayer.findFirst({
      where: {
        roundId,
        playerId
      }
    });

    if (!roundPlayer) {
      return res.status(400).json({ 
        error: 'Player is not part of this round' 
      });
    }

    // Get the next shot number for this player on this hole
    const lastShot = await prisma.shot.findFirst({
      where: {
        roundId,
        playerId,
        holeNumber
      },
      orderBy: { shotNumber: 'desc' }
    });

    const nextShotNumber = lastShot ? lastShot.shotNumber + 1 : 1;

    const penaltyShot = await prisma.shot.create({
      data: {
        id: uuidv4(),
        roundId,
        playerId,
        holeNumber,
        shotNumber: nextShotNumber,
        club: 'Penalty',
        distance: 0,
        location: 'penalty',
        targetLocation: 'penalty',
        result: 'success',
        isPenalty: true
      },
      include: {
        player: true
      }
    });

    res.status(201).json(penaltyShot);
  } catch (error) {
    console.error('Error creating penalty shot:', error);
    res.status(500).json({ error: 'Failed to create penalty shot' });
  }
});

module.exports = router;
