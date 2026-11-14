# Live Streams Page Guide

## Overview
The Live Streams page displays external streams from platforms like YouTube, Facebook, Kick, and Twitch. Users can promote their streams by adding them to the database.

## How Streams Work

### Current System
- **No Create Stream UI**: The "Create Stream" functionality has been removed from the frontend
- **Database-Driven**: Streams are added directly to the database
- **External Platforms**: Streams link to YouTube, Facebook, Kick, or Twitch

### Stream Data Structure

Each stream needs the following information:

```json
{
  "title": "Stream Title",
  "description": "Stream description",
  "organizerId": "User ObjectId",
  "status": "live",
  "isPublic": true,
  "allowChat": true,
  "allowReactions": true,
  "quality": "1080p",
  "externalStreamUrl": "https://www.youtube.com/watch?v=...",
  "externalPlatform": "youtube",
  "externalThumbnail": "https://...",
  "isLiveStatus": "live",
  "tags": ["Gaming", "MLBB"],
  "currentViewers": 1000,
  "peakViewers": 1000,
  "totalViewers": 1000
}
```

## How to Add Streams

### Method 1: Using MongoDB Directly

1. Connect to your MongoDB database
2. Insert stream documents into the `streamsessions` collection

Example:
```javascript
db.streamsessions.insertOne({
  title: "My Gaming Stream",
  description: "Live gaming session",
  organizerId: ObjectId("user_id_here"),
  status: "live",
  isPublic: true,
  allowChat: true,
  allowReactions: true,
  quality: "1080p",
  platforms: [],
  externalStreamUrl: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
  externalPlatform: "youtube",
  externalThumbnail: "https://i.ytimg.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg",
  isLiveStatus: "live",
  tags: ["Gaming"],
  currentViewers: 100,
  peakViewers: 100,
  totalViewers: 100,
  streamKey: "stream_key_" + Date.now(),
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Method 2: Using Backend API (Manual)

Create a POST request to add streams:

```bash
POST /api/admin/streams
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "title": "Stream Title",
  "description": "Description",
  "externalStreamUrl": "https://www.youtube.com/watch?v=...",
  "externalPlatform": "youtube",
  "externalThumbnail": "https://...",
  "isLiveStatus": "live",
  "tags": ["Gaming"]
}
```

### Method 3: Using Test Script

Run the test script to create sample streams:

```bash
cd backend
npx ts-node src/scripts/createTestStreams.ts
```

## Supported Platforms

### YouTube
- **Platform**: `youtube`
- **URL Format**: `https://www.youtube.com/watch?v=VIDEO_ID`
- **Embed**: Automatically extracts video ID and creates embed URL
- **Thumbnail**: `https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg`

### Twitch
- **Platform**: `twitch`
- **URL Format**: `https://www.twitch.tv/CHANNEL_NAME`
- **Embed**: Uses Twitch player with channel name
- **Thumbnail**: Twitch API thumbnail

### Kick
- **Platform**: `kick`
- **URL Format**: `https://kick.com/CHANNEL_NAME`
- **Embed**: Direct URL
- **Thumbnail**: Custom thumbnail

### Facebook
- **Platform**: `facebook`
- **URL Format**: `https://www.facebook.com/gaming/CHANNEL`
- **Embed**: Facebook embed API
- **Thumbnail**: Custom thumbnail

## Stream Status

- **live**: Stream is currently live (green indicator)
- **offline**: Stream is not live (gray indicator)
- **scheduled**: Stream is scheduled for future
- **ended**: Stream has ended

## Display on Frontend

Streams automatically appear on `/live-streams` page if they have:
- `status: "live"`
- `isPublic: true`
- Valid `externalStreamUrl` and `externalPlatform`

## Features

1. **Search**: Search streams by title or streamer name
2. **Filter**: Filter by platform (YouTube, Twitch, Kick, Facebook)
3. **Live Indicator**: Shows "LIVE" badge with pulsing animation
4. **Thumbnail Display**: Shows stream thumbnail with platform badge
5. **Embed Player**: Click to view stream in embedded player
6. **External Link**: Direct link to watch on original platform
7. **Viewer Count**: Shows current viewer count

## API Endpoints

### Get Live Streams
```
GET /api/streams/live
```

### Get Specific Stream
```
GET /api/streams/:streamId
```

### Check External Stream Status
```
POST /api/streams/check-external
Body: {
  "streamUrl": "https://...",
  "platform": "youtube"
}
```

## Notes

- The "Create Stream" UI has been removed from the navigation
- Streams must be added manually to the database
- External platform URLs must be valid
- Thumbnails are optional but recommended for better UX
- Viewer counts can be updated manually or via webhook integration

## Future Enhancements

Potential improvements:
- Add a simple admin UI to manage streams
- Integrate with platform APIs to fetch live status automatically
- Add webhook support for real-time updates
- Support for more platforms (Instagram Live, LinkedIn Live, etc.)
- Stream scheduling and notifications
