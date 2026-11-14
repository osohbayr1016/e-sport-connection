import mongoose from "mongoose";
import Tournament from "../src/models/Tournament";
import TournamentMatch from "../src/models/TournamentMatch";
import { advanceCompletedTournamentRound } from "../src/services/tournamentMatchService";

describe("single-elimination advancement", () => {
 async function makeCup(format = "Single Elimination") {
  const starts = new Date(Date.now()-3600000);
  return Tournament.create({
   name:"Advancement test",description:"Test",game:"Mobile Legends: Bang Bang",
   startDate:starts,endDate:new Date(Date.now()+86400000),prizePool:0,
   prizeDistribution:{firstPlace:0,secondPlace:0,thirdPlace:0},
   maxSquads:8,status:"ongoing",location:"Online",organizer:"Test",
   registrationDeadline:starts,entryFee:0,tournamentType:"free",format,
  });
 }
 test("five-team tournament generates a BYE for 3 winners and progresses once",async()=>{
  const cup=await makeCup();
  const ids=Array.from({length:5},()=>new mongoose.Types.ObjectId());
  await TournamentMatch.insertMany([
   {tournament:cup._id,round:1,matchNumber:1,squad1:ids[0],squad2:ids[1],status:"completed",winner:ids[0],loser:ids[1]},
   {tournament:cup._id,round:1,matchNumber:2,squad1:ids[2],squad2:ids[3],status:"completed",winner:ids[2],loser:ids[3]},
   {tournament:cup._id,round:1,matchNumber:3,squad1:ids[4],squad2:null,status:"completed",winner:ids[4],matchType:"auto_win"},
  ]);
  expect(await advanceCompletedTournamentRound(cup.id,1)).toBe("advanced");
  expect(await advanceCompletedTournamentRound(cup.id,1)).toBe("already_advanced");
  const round2=await TournamentMatch.find({tournament:cup._id,round:2}).sort({matchNumber:1});
  expect(round2).toHaveLength(2);
  const bye=round2.find(m=>m.matchType==="auto_win");
  expect(bye?.winner).toBeDefined();
  expect(bye?.bountyCoinAmount).toBe(0);
 });
 test("round-robin never produces elimination rounds",async()=>{
  const cup=await makeCup("Round Robin"),a=new mongoose.Types.ObjectId(),b=new mongoose.Types.ObjectId();
  await TournamentMatch.create({tournament:cup._id,round:1,matchNumber:1,squad1:a,squad2:b,
   status:"completed",winner:a,loser:b,matchType:"round_robin"});
  expect(await advanceCompletedTournamentRound(cup.id,1)).toBe("completed");
  expect(await TournamentMatch.countDocuments({tournament:cup._id,round:2})).toBe(0);
  expect((await Tournament.findById(cup.id))?.status).toBe("completed");
 });
 test("does not progress a partly finished round",async()=>{
  const cup=await makeCup(),a=new mongoose.Types.ObjectId(),b=new mongoose.Types.ObjectId();
  await TournamentMatch.create({tournament:cup.id,round:1,matchNumber:1,squad1:a,squad2:b,status:"scheduled"});
  expect(await advanceCompletedTournamentRound(cup.id,1)).toBe("not_ready");
 });
});
