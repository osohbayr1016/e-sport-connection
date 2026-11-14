import { buildApp } from "../src/index";
import type { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import Tournament from "../src/models/Tournament";
import Squad from "../src/models/Squad";
import User from "../src/models/User";
import TournamentRegistration from "../src/models/TournamentRegistration";
import TournamentMatch from "../src/models/TournamentMatch";
import { generateBracketMatches, generateTournamentMatches } from "../src/services/tournamentMatchService";

describe("bracket generation", () => {
 let app: FastifyInstance;
 beforeAll(async () => { app = await buildApp(); await app.ready(); });
 afterAll(async () => { await app.close(); });
 async function team(i: number) {
   const player = await User.create({name:"P"+i,email:"bracket"+i+"@example.com",role:"PLAYER",password:"strong-password"});
   return Squad.create({name:"Squad"+i,tag:"B"+i,leader:player._id,members:[player._id],
      maxMembers:5,game:"Mobile Legends: Bang Bang"});
 }
 test("odd-sized brackets persist a valid automatic bye", async () => {
   const teams=await Promise.all([team(1),team(2),team(3)]);
   const matches=generateBracketMatches(teams,"Single Elimination",new mongoose.Types.ObjectId().toString());
   expect(matches).toHaveLength(2);
   const bye=matches.find(m=>m.matchType==="auto_win");
   expect(bye?.squad2).toBeNull();
   expect(await TournamentMatch.insertMany(matches)).toHaveLength(2);
 });
 test("pending and banned teams cannot enter a generated bracket", async () => {
   const teams=await Promise.all([team(1),team(2),team(3),team(4)]);
   const start=new Date(Date.now()+5*86400000);
   const cup=await Tournament.create({name:"Bracket Cup",description:"Test",game:"Mobile Legends: Bang Bang",
     startDate:start,endDate:new Date(start.getTime()+86400000),prizePool:0,
     prizeDistribution:{firstPlace:0,secondPlace:0,thirdPlace:0},maxSquads:8,
     status:"ongoing",location:"Online",organizer:"Tester",registrationDeadline:new Date(start.getTime()-86400000),
     entryFee:0,tournamentType:"free",format:"Single Elimination"});
   for(let i=0;i<teams.length;i++) await TournamentRegistration.create({
      tournament:cup._id,squad:teams[i]._id,squadLeader:teams[i].leader,
      squadMembers:teams[i].members,registrationFee:0,paymentStatus:"paid",
      isApproved:i!==2,approvalStatus:i===2?"pending":"approved",isBanned:i===3,status:"registered"});
   await generateTournamentMatches(cup._id.toString());
   const saved=await TournamentMatch.find({tournament:cup._id});
   expect(saved).toHaveLength(1);
   expect([saved[0].squad1.toString(),saved[0].squad2!.toString()].sort())
     .toEqual([teams[0]._id.toString(),teams[1]._id.toString()].sort());
 });
});
