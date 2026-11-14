import mongoose from "mongoose";
import User from "../src/models/User";
import Squad from "../src/models/Squad";
import TournamentMatch from "../src/models/TournamentMatch";
import { finalizeMatchWithRewards, MatchResultError } from "../src/services/tournamentResultService";

describe("atomic match result and coin rewards", () => {
  async function squad(name: string, tag: string) {
    const user = await User.create({name,email:tag+"@example.com",password:"secure-test-password",role:"PLAYER"});
    return Squad.create({name,tag,leader:user._id,members:[user._id],maxMembers:5,
      game:"Mobile Legends: Bang Bang",currentBountyCoins:100});
  }
  test("completion credits winner exactly once", async () => {
    const first=await squad("Atomic A","ATM1"),second=await squad("Atomic B","ATM2");
    const match=await TournamentMatch.create({
      tournament:new mongoose.Types.ObjectId(),matchNumber:1,round:1,
      squad1:first._id,squad2:second._id,status:"scheduled",
      bountyCoinAmount:50,matchType:"normal"
    });
    await finalizeMatchWithRewards(match.id,{
      winnerId:first.id,loserId:second.id,score:{squad1Score:2,squad2Score:0},
    });
    const done=await TournamentMatch.findById(match.id);
    expect(done?.status).toBe("completed");
    expect(done?.divisionChangesProcessed).toBe(true);
    expect((await Squad.findById(first.id))!.currentBountyCoins).toBe(150);
    await expect(finalizeMatchWithRewards(match.id,{winnerId:first.id,loserId:second.id}))
      .rejects.toMatchObject({statusCode:409});
    expect((await Squad.findById(first.id))!.currentBountyCoins).toBe(150);
  });
  test("invalid score and winner do not change match state or balances",async()=>{
    const first=await squad("Invalid A","INV1"),second=await squad("Invalid B","INV2");
    const match=await TournamentMatch.create({tournament:new mongoose.Types.ObjectId(),matchNumber:1,
      round:1,squad1:first.id,squad2:second.id,status:"scheduled"});
    await expect(finalizeMatchWithRewards(match.id,{winnerId:first.id,loserId:second.id,
      score:{squad1Score:0,squad2Score:2}})).rejects.toMatchObject({statusCode:400});
    expect((await TournamentMatch.findById(match.id))?.status).toBe("scheduled");
    expect((await Squad.findById(first.id))!.currentBountyCoins).toBe(100);
  });
  test("missing participating squad rolls back the completed match",async()=>{
    const first=await squad("Rollback A","RBK1"),second=await squad("Rollback B","RBK2");
    const match=await TournamentMatch.create({tournament:new mongoose.Types.ObjectId(),matchNumber:1,
      round:1,squad1:first.id,squad2:second.id,status:"scheduled"});
    await Squad.findByIdAndDelete(second.id);
    await expect(finalizeMatchWithRewards(match.id,{winnerId:first.id,loserId:second.id})).rejects.toThrow();
    expect((await TournamentMatch.findById(match.id))?.status).toBe("scheduled");
    expect((await Squad.findById(first.id))!.currentBountyCoins).toBe(100);
  });
});
