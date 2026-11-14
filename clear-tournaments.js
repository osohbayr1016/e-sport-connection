const mongoose = require("mongoose");
require("dotenv").config();

async function clearAllTournaments() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error("MONGODB_URI environment variable is required");
    }

    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    // Import Tournament model
    const Tournament = require("./backend/dist/models/Tournament.js").default;

    // Clear all tournaments
    const result = await Tournament.deleteMany({});
    console.log(`🗑️ Cleared ${result.deletedCount} tournaments from database`);

    console.log("🎉 All tournaments cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing tournaments:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the script
clearAllTournaments();
