const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const prisma = new PrismaClient();

// Available colors for players
const AVAILABLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
];

// GET /api/players - Get all players
router.get('/', async (req, res) => {
  try {
    const players = await prisma.player.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// POST /api/players - Create a new player
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Name must be between 1 and 50 characters'),
  body('color').isIn(AVAILABLE_COLORS).withMessage('Invalid color selection')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, color } = req.body;

    // Check if color is already taken
    const existingPlayerWithColor = await prisma.player.findFirst({
      where: { color }
    });

    if (existingPlayerWithColor) {
      return res.status(400).json({ error: 'This color is already taken by another player' });
    }

    const player = await prisma.player.create({
      data: {
        id: uuidv4(),
        name,
        color
      }
    });

    res.status(201).json(player);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// DELETE /api/players/:id - Delete a player
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if player exists
    const player = await prisma.player.findUnique({
      where: { id }
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if player is used in any rounds
    const roundsWithPlayer = await prisma.roundPlayer.findFirst({
      where: { playerId: id }
    });

    if (roundsWithPlayer) {
      return res.status(400).json({ 
        error: 'Cannot delete player who has participated in rounds. Delete the rounds first.' 
      });
    }

    await prisma.player.delete({
      where: { id }
    });

    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

// GET /api/players/available-colors - Get available colors
router.get('/available-colors', async (req, res) => {
  try {
    const usedColors = await prisma.player.findMany({
      select: { color: true }
    });

    const usedColorSet = new Set(usedColors.map(p => p.color));
    const availableColors = AVAILABLE_COLORS.filter(color => !usedColorSet.has(color));

    res.json({ availableColors, allColors: AVAILABLE_COLORS });
  } catch (error) {
    console.error('Error fetching available colors:', error);
    res.status(500).json({ error: 'Failed to fetch available colors' });
  }
});

module.exports = router;
