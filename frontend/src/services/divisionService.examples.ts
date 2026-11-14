// Example usage of DivisionService (demonstration, not a Jest suite)
// This file demonstrates how to use the DivisionService class

import { DivisionService } from "./divisionService";
import { SquadDivision } from "../types/division";

// Example: Get division information
export function exampleDivisionServiceUsage() {
  console.log("=== Division Service Examples ===");

  // Get division display names
  console.log("Division Names:");
  console.log(
    `Silver: ${DivisionService.getDivisionDisplayName(SquadDivision.SILVER)}`
  );
  console.log(
    `Gold: ${DivisionService.getDivisionDisplayName(SquadDivision.GOLD)}`
  );
  console.log(
    `Diamond: ${DivisionService.getDivisionDisplayName(SquadDivision.DIAMOND)}`
  );

  // Get division colors
  console.log("\nDivision Colors:");
  console.log(
    `Silver: ${DivisionService.getDivisionColor(SquadDivision.SILVER)}`
  );
  console.log(`Gold: ${DivisionService.getDivisionColor(SquadDivision.GOLD)}`);
  console.log(
    `Diamond: ${DivisionService.getDivisionColor(SquadDivision.DIAMOND)}`
  );

  // Get division requirements
  console.log("\nDivision Requirements:");
  console.log(
    `Silver: ${DivisionService.getDivisionRequirements(SquadDivision.SILVER)}`
  );
  console.log(
    `Gold: ${DivisionService.getDivisionRequirements(SquadDivision.GOLD)}`
  );
  console.log(
    `Diamond: ${DivisionService.getDivisionRequirements(SquadDivision.DIAMOND)}`
  );

  // Get upgrade costs
  console.log("\nUpgrade Costs:");
  console.log(
    `Silver → Gold: ${DivisionService.getUpgradeCost(SquadDivision.SILVER)} BC`
  );
  console.log(
    `Gold → Diamond: ${DivisionService.getUpgradeCost(SquadDivision.GOLD)} BC`
  );
  console.log(
    `Diamond → Next: ${DivisionService.getUpgradeCost(
      SquadDivision.DIAMOND
    )} BC`
  );

  // Get bounty coin prices
  console.log("\nBounty Coin Prices:");
  console.log(
    `Silver: ${DivisionService.getBountyCoinPrice(SquadDivision.SILVER)} ₮`
  );
  console.log(
    `Gold: ${DivisionService.getBountyCoinPrice(SquadDivision.GOLD)} ₮`
  );
  console.log(
    `Diamond: ${DivisionService.getBountyCoinPrice(SquadDivision.DIAMOND)} ₮`
  );

  // Get division emojis
  console.log("\nDivision Emojis:");
  console.log(
    `Silver: ${DivisionService.getDivisionEmoji(SquadDivision.SILVER)}`
  );
  console.log(`Gold: ${DivisionService.getDivisionEmoji(SquadDivision.GOLD)}`);
  console.log(
    `Diamond: ${DivisionService.getDivisionEmoji(SquadDivision.DIAMOND)}`
  );

  // Get division descriptions
  console.log("\nDivision Descriptions:");
  console.log(
    `Silver: ${DivisionService.getDivisionDescription(SquadDivision.SILVER)}`
  );
  console.log(
    `Gold: ${DivisionService.getDivisionDescription(SquadDivision.GOLD)}`
  );
  console.log(
    `Diamond: ${DivisionService.getDivisionDescription(SquadDivision.DIAMOND)}`
  );

  // Check upgrade possibilities
  console.log("\nUpgrade Possibilities:");
  const silverBountyCoins = 300;
  const goldBountyCoins = 800;
  const diamondBountyCoins = 1000;

  console.log(
    `Silver (${silverBountyCoins} BC) can upgrade: ${DivisionService.canUpgradeToNextDivision(
      SquadDivision.SILVER,
      silverBountyCoins
    )}`
  );
  console.log(
    `Gold (${goldBountyCoins} BC) can upgrade: ${DivisionService.canUpgradeToNextDivision(
      SquadDivision.GOLD,
      goldBountyCoins
    )}`
  );
  console.log(
    `Diamond (${diamondBountyCoins} BC) can upgrade: ${DivisionService.canUpgradeToNextDivision(
      SquadDivision.DIAMOND,
      diamondBountyCoins
    )}`
  );

  // Get next divisions
  console.log("\nNext Divisions:");
  console.log(
    `Silver → ${DivisionService.getNextDivision(SquadDivision.SILVER)}`
  );
  console.log(`Gold → ${DivisionService.getNextDivision(SquadDivision.GOLD)}`);
  console.log(
    `Diamond → ${DivisionService.getNextDivision(SquadDivision.DIAMOND)}`
  );

  // Get previous divisions
  console.log("\nPrevious Divisions:");
  console.log(
    `Silver ← ${DivisionService.getPreviousDivision(SquadDivision.SILVER)}`
  );
  console.log(
    `Gold ← ${DivisionService.getPreviousDivision(SquadDivision.GOLD)}`
  );
  console.log(
    `Diamond ← ${DivisionService.getPreviousDivision(SquadDivision.DIAMOND)}`
  );

  // Calculate progress to next division
  console.log("\nProgress to Next Division:");
  console.log(
    `Silver (${silverBountyCoins} BC): ${DivisionService.calculateProgressToNextDivision(
      SquadDivision.SILVER,
      silverBountyCoins
    ).toFixed(1)}%`
  );
  console.log(
    `Gold (${goldBountyCoins} BC): ${DivisionService.calculateProgressToNextDivision(
      SquadDivision.GOLD,
      goldBountyCoins
    ).toFixed(1)}%`
  );
  console.log(
    `Diamond (${diamondBountyCoins} BC): ${DivisionService.calculateProgressToNextDivision(
      SquadDivision.DIAMOND,
      diamondBountyCoins
    ).toFixed(1)}%`
  );

  // Get division coin images
  console.log("\nDivision Coin Images:");
  console.log(
    `Silver: ${DivisionService.getDivisionCoinImage(SquadDivision.SILVER)}`
  );
  console.log(
    `Gold: ${DivisionService.getDivisionCoinImage(SquadDivision.GOLD)}`
  );
  console.log(
    `Diamond: ${DivisionService.getDivisionCoinImage(SquadDivision.DIAMOND)}`
  );
}

// Example: Async operations (these would be used in real components)
export async function exampleAsyncOperations() {
  console.log("\n=== Async Operations Examples ===");

  try {
    // Get all divisions info
    console.log("Fetching divisions info...");
    // const divisionsInfo = await DivisionService.getDivisionsInfo();
    // console.log("Divisions info:", divisionsInfo);

    // Get division leaderboard
    console.log("Fetching Silver division leaderboard...");
    // const silverLeaderboard = await DivisionService.getDivisionLeaderboard(SquadDivision.SILVER, 10);
    // console.log("Silver leaderboard:", silverLeaderboard);

    // Get squad division info
    console.log("Fetching squad division info...");
    // const squadInfo = await DivisionService.getSquadDivisionInfo("squad123");
    // console.log("Squad info:", squadInfo);

    console.log("Note: Uncomment the above lines to test actual API calls");
  } catch (error) {
    console.error("Error in async operations:", error);
  }
}

// Example: Usage in React components
export function exampleReactComponentUsage() {
  console.log("\n=== React Component Usage Examples ===");

  console.log(`
// In a React component:

import { DivisionService } from '../services/divisionService';
import { SquadDivision } from '../types/division';

function SquadDivisionCard({ squadDivision, bountyCoins }) {
  const canUpgrade = DivisionService.canUpgradeToNextDivision(squadDivision, bountyCoins);
  const progress = DivisionService.calculateProgressToNextDivision(squadDivision, bountyCoins);
  const nextDivision = DivisionService.getNextDivision(squadDivision);
  const emoji = DivisionService.getDivisionEmoji(squadDivision);
  
  return (
    <div>
      <h3>{emoji} {DivisionService.getDivisionDisplayName(squadDivision)}</h3>
      <p>{DivisionService.getDivisionDescription(squadDivision)}</p>
      <div>Progress: {progress.toFixed(1)}%</div>
      {canUpgrade && (
        <button>Upgrade to {nextDivision && DivisionService.getDivisionDisplayName(nextDivision)}</button>
      )}
    </div>
  );
}
  `);
}

// Run examples if this file is executed directly
if (typeof window !== "undefined") {
  // Browser environment
  window.exampleDivisionServiceUsage = exampleDivisionServiceUsage;
  window.exampleAsyncOperations = exampleAsyncOperations;
  window.exampleReactComponentUsage = exampleReactComponentUsage;
} else {
  // Node.js environment
  exampleDivisionServiceUsage();
  exampleAsyncOperations();
  exampleReactComponentUsage();
}
