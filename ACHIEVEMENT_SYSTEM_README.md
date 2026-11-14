# Achievement & Badge System 🏆

A comprehensive gamification system for the E-Sport Connection platform that increases user engagement and retention through achievements, badges, and leaderboards.

## Features

### 🎯 Achievements
- **Multiple Categories**: Tournament, Match, Social, Progress, Special, and Seasonal achievements
- **Different Types**: Counter-based, Milestone, Conditional, and Time-based achievements
- **Rarity System**: Common, Rare, Epic, and Legendary achievements with different point values
- **Progress Tracking**: Real-time progress tracking with visual progress bars
- **Rewards**: Bounty coins, experience points, badges, and special titles

### 🏅 Badges
- **Visual Display**: Colorful badges with glow effects and animations
- **Multiple Types**: Achievement, Rank, Special, Seasonal, and Tournament badges
- **Equip System**: Users can equip badges to display on their profile
- **Rarity Levels**: Common, Rare, Epic, Legendary, and Mythic badges

### 📊 Leaderboards
- **Multiple Types**: Achievement Points, Tournament Wins, Match Wins, Bounty Coins, Level, and Seasonal
- **Time Periods**: Daily, Weekly, Monthly, Seasonal, and All-Time leaderboards
- **Podium Display**: Special podium view for top 3 players
- **Real-time Updates**: Automatic leaderboard updates when achievements are earned

## System Architecture

### Backend Models

#### Achievement Model
```typescript
interface IAchievement {
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  type: AchievementType;
  icon: string;
  points: number;
  requirements: {
    counter?: number;
    condition?: string;
    milestone?: string;
    timeFrame?: number;
    game?: string;
    rank?: string;
  };
  rewards: {
    bountyCoins?: number;
    experience?: number;
    badge?: ObjectId;
    title?: string;
  };
  isActive: boolean;
  isSeasonal: boolean;
  prerequisites?: ObjectId[];
}
```

#### UserAchievement Model
```typescript
interface IUserAchievement {
  userId: ObjectId;
  achievementId: ObjectId;
  status: "IN_PROGRESS" | "COMPLETED" | "CLAIMED";
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  completedAt?: Date;
  claimedAt?: Date;
  rewardsClaimed: {
    bountyCoins: boolean;
    experience: boolean;
    badge: boolean;
    title: boolean;
  };
  metadata?: any;
}
```

#### Badge Model
```typescript
interface IBadge {
  name: string;
  description: string;
  type: BadgeType;
  rarity: BadgeRarity;
  icon: string;
  color: string;
  borderColor?: string;
  glowEffect?: boolean;
  animation?: string;
  requirements: {
    achievementId?: ObjectId;
    rank?: string;
    level?: number;
    tournamentWins?: number;
    specialCondition?: string;
  };
  isActive: boolean;
  isSeasonal: boolean;
  displayOrder: number;
}
```

#### UserBadge Model
```typescript
interface IUserBadge {
  userId: ObjectId;
  badgeId: ObjectId;
  earnedAt: Date;
  isEquipped: boolean;
  equippedAt?: Date;
  metadata?: any;
}
```

#### LeaderboardEntry Model
```typescript
interface ILeaderboardEntry {
  userId: ObjectId;
  leaderboardType: LeaderboardType;
  period: LeaderboardPeriod;
  score: number;
  rank: number;
  metadata?: any;
  lastUpdated: Date;
}
```

### Services

#### AchievementService
The core service that handles:
- Processing achievement triggers
- Updating user progress
- Awarding rewards
- Managing leaderboards
- Calculating achievement points

### API Endpoints

#### Achievements
- `GET /api/achievements` - Get all available achievements
- `GET /api/achievements/my-achievements` - Get current user's achievements
- `POST /api/achievements/claim/:achievementId` - Claim achievement rewards
- `POST /api/achievements/trigger` - Trigger achievement check (admin)

#### Badges
- `GET /api/achievements/badges` - Get all available badges
- `GET /api/achievements/my-badges` - Get current user's badges
- `POST /api/achievements/badges/equip/:badgeId` - Equip a badge
- `POST /api/achievements/badges/unequip/:badgeId` - Unequip a badge

#### Leaderboards
- `GET /api/achievements/leaderboard` - Get leaderboard
- `GET /api/achievements/leaderboard/user/:userId` - Get user's leaderboard position

### Frontend Components

#### AchievementCard
Displays individual achievements with:
- Progress bars
- Rarity indicators
- Reward information
- Claim buttons

#### BadgeCard
Displays individual badges with:
- Visual effects
- Equip/unequip functionality
- Rarity indicators

#### Leaderboard
Shows leaderboards with:
- Podium display
- User avatars
- Score information
- Time period filters

## Achievement Triggers

The system automatically triggers achievement checks for:

### Tournament Actions
- **Tournament Participation**: When a squad registers for a tournament
- **Match Win**: When a squad wins a tournament match
- **Match Loss**: When a squad loses a tournament match

### Profile Actions
- **Profile Creation**: When a user creates their player profile
- **Rank Updates**: When a user updates their rank

### Social Actions
- **Squad Joining**: When a user joins a squad
- **Squad Creation**: When a user creates a squad

## Sample Achievements

### Tournament Achievements
- **First Tournament**: Participate in your first tournament (25 points)
- **Tournament Veteran**: Participate in 10 tournaments (100 points)
- **Tournament Champion**: Win 5 tournaments (500 points)

### Match Achievements
- **First Victory**: Win your first match (10 points)
- **Match Winner**: Win 25 matches (150 points)
- **Match Master**: Win 100 matches (300 points)

### Progress Achievements
- **Rising Star**: Reach Epic rank (100 points)
- **Legendary Player**: Reach Legend rank (400 points)
- **Profile Creator**: Create your player profile (15 points)

### Social Achievements
- **Team Player**: Join your first squad (20 points)
- **Squad Leader**: Create your own squad (75 points)

### Special Achievements
- **Early Bird**: Be among the first 100 users to join (200 points)

## Sample Badges

### Achievement Badges
- **First Steps**: Earned your first achievement (Common)
- **Tournament Hero**: Tournament champion (Legendary)
- **Match Master**: Won 100 matches (Epic)

### Rank Badges
- **Epic Player**: Reached Epic rank (Rare)
- **Legendary Player**: Reached Legend rank (Legendary)

### Special Badges
- **Founder**: Early platform supporter (Mythic)
- **Squad Leader**: Created a squad (Rare)

### Tournament Badges
- **Tournament Participant**: Participated in tournaments (Common)
- **Tournament Winner**: Won multiple tournaments (Epic)

## Setup and Installation

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Initialize Achievements and Badges**
   ```bash
   npm run init:achievements
   ```

3. **Start the Server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```

## Usage

### For Users

1. **View Achievements**: Navigate to `/achievements` to see all available achievements
2. **Track Progress**: Monitor your progress on various achievements
3. **Claim Rewards**: Claim rewards when achievements are completed
4. **Equip Badges**: Equip earned badges to display on your profile
5. **Check Leaderboards**: See how you rank against other players

### For Developers

1. **Add New Achievements**: Create new achievement definitions in the initialization script
2. **Add Achievement Triggers**: Integrate achievement checks into existing user actions
3. **Customize Rewards**: Modify reward types and amounts
4. **Create Seasonal Content**: Add seasonal achievements and badges

## Customization

### Adding New Achievement Types

1. **Define the Achievement**: Add to `sampleAchievements` array in `initializeAchievements.ts`
2. **Add Trigger Logic**: Implement trigger logic in `AchievementService`
3. **Update Frontend**: Add UI components if needed

### Adding New Badge Types

1. **Define the Badge**: Add to `sampleBadges` array in `initializeAchievements.ts`
2. **Set Requirements**: Define badge requirements
3. **Update Display**: Modify badge display components

### Customizing Rewards

1. **Modify Reward Types**: Update the `rewards` interface in the Achievement model
2. **Implement Reward Logic**: Add reward processing in `AchievementService`
3. **Update UI**: Modify frontend components to display new reward types

## Performance Considerations

- **Indexing**: Proper database indexes for efficient queries
- **Caching**: Leaderboard caching for better performance
- **Batch Processing**: Achievement triggers are processed asynchronously
- **Error Handling**: Graceful error handling to prevent system failures

## Future Enhancements

- **Seasonal Events**: Time-limited achievements and badges
- **Achievement Sets**: Grouped achievements with set bonuses
- **Social Features**: Achievement sharing and comparison
- **Mobile Notifications**: Push notifications for achievement unlocks
- **Analytics**: Achievement completion statistics and insights

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

