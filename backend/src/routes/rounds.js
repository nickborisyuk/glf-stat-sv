const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/rounds - Get all rounds
router.get('/', async (req, res) => {
  try {
    const rounds = await prisma.round.findMany({
      include: {
        roundPlayers: {
          include: {
            player: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format response
    const formattedRounds = rounds.map(round => ({
      ...round,
      players: round.roundPlayers.map(rp => rp.player)
    }));

    res.json(formattedRounds);
  } catch (error) {
    console.error('Error fetching rounds:', error);
    res.status(500).json({ error: 'Failed to fetch rounds' });
  }
});

// POST /api/rounds - Create a new round
router.post('/', [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('course').trim().isLength({ min: 1, max: 100 }).withMessage('Course name is required'),
  body('courseType').isIn(['championship', 'academic']).withMessage('Course type must be championship or academic'),
  body('playerIds').isArray({ min: 1 }).withMessage('At least one player is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, course, courseType, playerIds } = req.body;

    // Validate that all players exist
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } }
    });

    if (players.length !== playerIds.length) {
      return res.status(400).json({ error: 'One or more players not found' });
    }

    // Create round with players in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const round = await tx.round.create({
        data: {
          id: uuidv4(),
          date: new Date(date),
          course,
          courseType
        }
      });

      // Add players to round
      const roundPlayers = await Promise.all(
        playerIds.map(playerId =>
          tx.roundPlayer.create({
            data: {
              id: uuidv4(),
              roundId: round.id,
              playerId
            }
          })
        )
      );

      return { round, players };
    });

    res.status(201).json({
      ...result.round,
      players: result.players
    });
  } catch (error) {
    console.error('Error creating round:', error);
    res.status(500).json({ error: 'Failed to create round' });
  }
});

// GET /api/rounds/:id - Get a specific round
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const round = await prisma.round.findUnique({
      where: { id },
      include: {
        roundPlayers: {
          include: {
            player: true
          }
        },
        shots: {
          include: {
            player: true
          },
          orderBy: [
            { holeNumber: 'asc' },
            { shotNumber: 'asc' }
          ]
        }
      }
    });

    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    // Format response
    const formattedRound = {
      ...round,
      players: round.roundPlayers.map(rp => rp.player),
      shots: round.shots
    };

    res.json(formattedRound);
  } catch (error) {
    console.error('Error fetching round:', error);
    res.status(500).json({ error: 'Failed to fetch round' });
  }
});

// DELETE /api/rounds/:id - Delete a round
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if round exists
    const round = await prisma.round.findUnique({
      where: { id }
    });

    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    // Delete round (cascade will handle related records)
    await prisma.round.delete({
      where: { id }
    });

    res.json({ message: 'Round deleted successfully' });
  } catch (error) {
    console.error('Error deleting round:', error);
    res.status(500).json({ error: 'Failed to delete round' });
  }
});

// GET /api/rounds/:id/holes/:holeId/shots - Get shots for a specific hole
router.get('/:id/holes/:holeId/shots', async (req, res) => {
  try {
    const { id: roundId, holeId } = req.params;
    const holeNumber = parseInt(holeId);

    if (isNaN(holeNumber)) {
      return res.status(400).json({ error: 'Invalid hole number' });
    }

    const shots = await prisma.shot.findMany({
      where: {
        roundId,
        holeNumber
      },
      include: {
        player: true
      },
      orderBy: [
        { playerId: 'asc' },
        { shotNumber: 'asc' }
      ]
    });

    res.json(shots);
  } catch (error) {
    console.error('Error fetching shots:', error);
    res.status(500).json({ error: 'Failed to fetch shots' });
  }
});

module.exports = router;
