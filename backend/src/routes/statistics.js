const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/stats/rounds/:id - Get round statistics
router.get('/rounds/:id', async (req, res) => {
  try {
    const { id: roundId } = req.params;

    // Check if round exists
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        roundPlayers: {
          include: {
            player: true
          }
        }
      }
    });

    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    // Get all shots for this round
    const shots = await prisma.shot.findMany({
      where: { roundId },
      include: { player: true }
    });

    // Calculate statistics
    const playerStats = {};
    const clubStats = {};
    const locationStats = {};

    shots.forEach(shot => {
      const playerId = shot.playerId;
      const playerName = shot.player.name;
      
      // Initialize player stats if not exists
      if (!playerStats[playerId]) {
        playerStats[playerId] = {
          playerId,
          playerName,
          totalShots: 0,
          successfulShots: 0,
          failedShots: 0,
          penaltyShots: 0,
          totalDistance: 0,
          shotsByHole: {}
        };
      }

      // Update player stats
      playerStats[playerId].totalShots++;
      if (shot.result === 'success') {
        playerStats[playerId].successfulShots++;
      } else {
        playerStats[playerId].failedShots++;
      }
      if (shot.isPenalty) {
        playerStats[playerId].penaltyShots++;
      }
      playerStats[playerId].totalDistance += shot.distance;

      // Shots by hole
      if (!playerStats[playerId].shotsByHole[shot.holeNumber]) {
        playerStats[playerId].shotsByHole[shot.holeNumber] = 0;
      }
      playerStats[playerId].shotsByHole[shot.holeNumber]++;

      // Club stats
      if (!clubStats[shot.club]) {
        clubStats[shot.club] = {
          club: shot.club,
          totalShots: 0,
          successfulShots: 0,
          averageDistance: 0,
          totalDistance: 0
        };
      }
      clubStats[shot.club].totalShots++;
      if (shot.result === 'success') {
        clubStats[shot.club].successfulShots++;
      }
      clubStats[shot.club].totalDistance += shot.distance;

      // Location stats
      if (!locationStats[shot.location]) {
        locationStats[shot.location] = {
          location: shot.location,
          totalShots: 0,
          successfulShots: 0
        };
      }
      locationStats[shot.location].totalShots++;
      if (shot.result === 'success') {
        locationStats[shot.location].successfulShots++;
      }
    });

    // Calculate averages and success rates
    Object.values(playerStats).forEach(player => {
      player.successRate = player.totalShots > 0 ? (player.successfulShots / player.totalShots * 100).toFixed(1) : 0;
      player.averageDistance = player.totalShots > 0 ? Math.round(player.totalDistance / player.totalShots) : 0;
    });

    Object.values(clubStats).forEach(club => {
      club.successRate = club.totalShots > 0 ? (club.successfulShots / club.totalShots * 100).toFixed(1) : 0;
      club.averageDistance = club.totalShots > 0 ? Math.round(club.totalDistance / club.totalShots) : 0;
    });

    Object.values(locationStats).forEach(location => {
      location.successRate = location.totalShots > 0 ? (location.successfulShots / location.totalShots * 100).toFixed(1) : 0;
    });

    const statistics = {
      round: {
        id: round.id,
        date: round.date,
        course: round.course,
        courseType: round.courseType,
        players: round.roundPlayers.map(rp => rp.player)
      },
      playerStats: Object.values(playerStats),
      clubStats: Object.values(clubStats),
      locationStats: Object.values(locationStats),
      totalShots: shots.length,
      totalSuccessfulShots: shots.filter(s => s.result === 'success').length,
      totalFailedShots: shots.filter(s => s.result === 'fail').length,
      totalPenaltyShots: shots.filter(s => s.isPenalty).length
    };

    res.json(statistics);
  } catch (error) {
    console.error('Error fetching round statistics:', error);
    res.status(500).json({ error: 'Failed to fetch round statistics' });
  }
});

// GET /api/stats/rounds/:id/clubs - Get club statistics for a round
router.get('/rounds/:id/clubs', async (req, res) => {
  try {
    const { id: roundId } = req.params;

    const shots = await prisma.shot.findMany({
      where: { roundId },
      include: { player: true }
    });

    const clubStats = {};

    shots.forEach(shot => {
      if (!clubStats[shot.club]) {
        clubStats[shot.club] = {
          club: shot.club,
          totalShots: 0,
          successfulShots: 0,
          totalDistance: 0,
          shotsByPlayer: {}
        };
      }

      clubStats[shot.club].totalShots++;
      if (shot.result === 'success') {
        clubStats[shot.club].successfulShots++;
      }
      clubStats[shot.club].totalDistance += shot.distance;

      // Shots by player for this club
      const playerId = shot.playerId;
      if (!clubStats[shot.club].shotsByPlayer[playerId]) {
        clubStats[shot.club].shotsByPlayer[playerId] = {
          playerId,
          playerName: shot.player.name,
          totalShots: 0,
          successfulShots: 0
        };
      }
      clubStats[shot.club].shotsByPlayer[playerId].totalShots++;
      if (shot.result === 'success') {
        clubStats[shot.club].shotsByPlayer[playerId].successfulShots++;
      }
    });

    // Calculate averages and success rates
    Object.values(clubStats).forEach(club => {
      club.successRate = club.totalShots > 0 ? (club.successfulShots / club.totalShots * 100).toFixed(1) : 0;
      club.averageDistance = club.totalShots > 0 ? Math.round(club.totalDistance / club.totalShots) : 0;
      club.shotsByPlayer = Object.values(club.shotsByPlayer);
    });

    res.json(Object.values(clubStats));
  } catch (error) {
    console.error('Error fetching club statistics:', error);
    res.status(500).json({ error: 'Failed to fetch club statistics' });
  }
});

// GET /api/stats/rounds/:id/locations - Get location statistics for a round
router.get('/rounds/:id/locations', async (req, res) => {
  try {
    const { id: roundId } = req.params;

    const shots = await prisma.shot.findMany({
      where: { roundId },
      include: { player: true }
    });

    const locationStats = {};

    shots.forEach(shot => {
      if (!locationStats[shot.location]) {
        locationStats[shot.location] = {
          location: shot.location,
          totalShots: 0,
          successfulShots: 0,
          shotsByPlayer: {}
        };
      }

      locationStats[shot.location].totalShots++;
      if (shot.result === 'success') {
        locationStats[shot.location].successfulShots++;
      }

      // Shots by player for this location
      const playerId = shot.playerId;
      if (!locationStats[shot.location].shotsByPlayer[playerId]) {
        locationStats[shot.location].shotsByPlayer[playerId] = {
          playerId,
          playerName: shot.player.name,
          totalShots: 0,
          successfulShots: 0
        };
      }
      locationStats[shot.location].shotsByPlayer[playerId].totalShots++;
      if (shot.result === 'success') {
        locationStats[shot.location].shotsByPlayer[playerId].successfulShots++;
      }
    });

    // Calculate success rates
    Object.values(locationStats).forEach(location => {
      location.successRate = location.totalShots > 0 ? (location.successfulShots / location.totalShots * 100).toFixed(1) : 0;
      location.shotsByPlayer = Object.values(location.shotsByPlayer);
    });

    res.json(Object.values(locationStats));
  } catch (error) {
    console.error('Error fetching location statistics:', error);
    res.status(500).json({ error: 'Failed to fetch location statistics' });
  }
});

// GET /api/stats/global - Get global statistics across all rounds
router.get('/global', async (req, res) => {
  try {
    const rounds = await prisma.round.findMany({
      include: {
        roundPlayers: {
          include: {
            player: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    const shots = await prisma.shot.findMany({
      include: { player: true }
    });

    // Calculate global stats
    const totalRounds = rounds.length;
    const totalShots = shots.length;
    const totalSuccessfulShots = shots.filter(s => s.result === 'success').length;
    const totalFailedShots = shots.filter(s => s.result === 'fail').length;
    const totalPenaltyShots = shots.filter(s => s.isPenalty).length;

    // Most used clubs
    const clubUsage = {};
    shots.forEach(shot => {
      clubUsage[shot.club] = (clubUsage[shot.club] || 0) + 1;
    });

    const mostUsedClubs = Object.entries(clubUsage)
      .map(([club, count]) => ({ club, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Best performing clubs
    const clubPerformance = {};
    shots.forEach(shot => {
      if (!clubPerformance[shot.club]) {
        clubPerformance[shot.club] = { total: 0, successful: 0 };
      }
      clubPerformance[shot.club].total++;
      if (shot.result === 'success') {
        clubPerformance[shot.club].successful++;
      }
    });

    const bestPerformingClubs = Object.entries(clubPerformance)
      .map(([club, stats]) => ({
        club,
        total: stats.total,
        successful: stats.successful,
        successRate: stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(1) : 0
      }))
      .filter(club => club.total >= 5) // Only clubs with at least 5 shots
      .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate))
      .slice(0, 5);

    const globalStats = {
      totalRounds,
      totalShots,
      totalSuccessfulShots,
      totalFailedShots,
      totalPenaltyShots,
      overallSuccessRate: totalShots > 0 ? ((totalSuccessfulShots / totalShots) * 100).toFixed(1) : 0,
      mostUsedClubs,
      bestPerformingClubs,
      recentRounds: rounds.slice(0, 5).map(round => ({
        id: round.id,
        date: round.date,
        course: round.course,
        playerCount: round.roundPlayers.length
      }))
    };

    res.json(globalStats);
  } catch (error) {
    console.error('Error fetching global statistics:', error);
    res.status(500).json({ error: 'Failed to fetch global statistics' });
  }
});

module.exports = router;
