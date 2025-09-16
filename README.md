# Golf Stats Tracker 🏌️‍♂️

A modern Progressive Web App for tracking golf game statistics with iOS-style interface, GPS integration, and comprehensive analytics.

## Features

### Core Functionality
- **Player Management**: Create players with custom colors and manage player roster
- **Round Tracking**: Create and manage golf rounds (18 or 9 holes)
- **Shot Tracking**: Two-stage shot creation with GPS distance measurement
- **Statistics & Analytics**: Comprehensive statistics with charts and graphs
- **PWA Support**: Install as native app on mobile devices

### Technical Features
- **GPS Integration**: Real-time distance measurement using device GPS
- **Offline Support**: Works offline with data synchronization
- **iOS-Style UI**: Modern, intuitive interface optimized for mobile
- **Real-time Updates**: Live GPS tracking and shot updates
- **Data Export**: Statistics and round data analysis

## Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **Prisma ORM** - Database management
- **SQLite** - Database storage
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection

### Frontend
- **Svelte** - Reactive UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Data visualization
- **PWA** - Progressive Web App capabilities

### Database Schema
```sql
-- Players table
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rounds table
CREATE TABLE rounds (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  course TEXT NOT NULL,
  course_type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Round-Player relationship
CREATE TABLE round_players (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  FOREIGN KEY (round_id) REFERENCES rounds(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Shots table
CREATE TABLE shots (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  hole_number INTEGER NOT NULL,
  shot_number INTEGER NOT NULL,
  club TEXT NOT NULL,
  distance INTEGER DEFAULT 0,
  location TEXT NOT NULL,
  target_location TEXT NOT NULL,
  result TEXT NOT NULL,
  error TEXT,
  is_penalty BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (round_id) REFERENCES rounds(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd golf-stats
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup environment variables**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings
   ```

4. **Setup database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   cd ..
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API on `http://localhost:3001`
   - Frontend on `http://localhost:5173`

### Quick Start

Use the setup script for easy local development:

```bash
# Setup everything for local development
./deploy.sh
```

This will:
- Install all dependencies
- Setup the database
- Build the frontend
- Prepare everything for development

## API Endpoints

### Players
- `GET /api/players` - Get all players
- `POST /api/players` - Create a new player
- `DELETE /api/players/:id` - Delete a player
- `GET /api/players/available-colors` - Get available colors

### Rounds
- `GET /api/rounds` - Get all rounds
- `POST /api/rounds` - Create a new round
- `GET /api/rounds/:id` - Get specific round
- `DELETE /api/rounds/:id` - Delete a round
- `GET /api/rounds/:id/holes/:holeId/shots` - Get shots for a hole

### Shots
- `POST /api/shots` - Create a new shot
- `PUT /api/shots/:id` - Update a shot
- `DELETE /api/shots/:id` - Delete a shot
- `POST /api/shots/penalty` - Add penalty shot
- `GET /api/shots/clubs` - Get available clubs
- `GET /api/shots/locations` - Get available locations

### Statistics
- `GET /api/stats/rounds/:id` - Get round statistics
- `GET /api/stats/rounds/:id/clubs` - Get club statistics for round
- `GET /api/stats/rounds/:id/locations` - Get location statistics for round
- `GET /api/stats/global` - Get global statistics

## Usage Guide

### Getting Started

1. **Add Players**
   - Go to Players tab
   - Click "Add Player"
   - Enter name and select color
   - Players are automatically assigned unique colors

2. **Create a Round**
   - Go to Rounds tab
   - Click "New Round"
   - Enter course name, type, and date
   - Select players for the round

3. **Play a Round**
   - Select a round from the list
   - Choose a hole (1-18)
   - Add shots for each player
   - GPS automatically tracks distance

4. **View Statistics**
   - Go to Stats tab
   - View overall performance
   - Select specific rounds for detailed analysis
   - See charts and graphs

### Shot Tracking Workflow

1. **Start Shot**
   - Select player, club, and starting location
   - GPS tracking begins automatically

2. **Complete Shot**
   - Move to ball location
   - GPS measures distance
   - Select target location and result
   - Add error description if shot failed

3. **Add Penalty Shots**
   - Use penalty button for penalty strokes
   - Automatically increments shot number

### GPS Integration

- **Automatic Distance**: GPS measures distance from shot start to current position
- **Real-time Updates**: Distance updates as you move
- **Manual Override**: Can manually adjust distance if needed
- **Accuracy Indicator**: Shows GPS accuracy status

## Configuration

### Environment Variables

Backend (`.env`):
```env
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
NODE_ENV=development
```

### Available Clubs
- Driver, 3-Wood, 5-Wood, Hybrid
- 4-Iron through 9-Iron
- Pitching Wedge, Sand Wedge, Lob Wedge
- Putter

### Available Locations
- Tee, Fairway, Rough, Bunker
- Water, Green, Off-course

### Player Colors
- Red (#FF6B6B), Teal (#4ECDC4), Blue (#45B7D1)
- Green (#96CEB4), Yellow (#FFEAA7), Purple (#DDA0DD)

## PWA Features

### Installation
- **Mobile**: Add to home screen via browser menu
- **Desktop**: Install via browser address bar
- **Standalone Mode**: Runs without browser UI

### Offline Support
- Service worker caches static assets
- App works offline for viewing data
- Syncs when connection restored

### Mobile Optimizations
- iOS-style interface
- Touch-friendly controls
- Safe area support for notched devices
- Responsive design

## Development

### Project Structure
```
golf-stats/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Express middleware
│   │   └── index.js        # Server entry point
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── frontend/               # Svelte frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── routes/         # Page components
│   │   ├── stores/         # Svelte stores
│   │   └── lib/            # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── deploy.sh               # Local development setup script
└── README.md
```

### Available Scripts

**Root level:**
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build frontend for production
- `npm run install:all` - Install all dependencies

**Backend:**
- `npm run dev` - Start with nodemon
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database

**Frontend:**
- `npm run dev` - Start Vite dev server (development mode)
- `npm run build` - Build for production
- `npm run build:production` - Build for production server
- `npm run build:staging` - Build for staging server
- `npm run preview` - Preview production build
- `npm run preview:production` - Preview production build

### Remote Server Deployment

For remote server deployment, see:
- `REMOTE_SETUP.md` - Detailed setup guide for remote servers
- `DEPLOY.md` - General deployment instructions
- `deploy_remote.sh` - Automated deployment script

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Common Issues

**GPS not working:**
- Ensure location permissions are granted
- Check if device has GPS capability
- Try refreshing the page

**Database errors:**
- Run `npx prisma db push` to sync schema
- Check database file permissions
- Verify .env configuration

**Build failures:**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all dependencies are installed

### Performance Tips

- Use production build for better performance
- Enable gzip compression in nginx
- Monitor database size and optimize queries
- Use CDN for static assets

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed description

---

**Happy Golfing! 🏌️‍♂️⛳**
