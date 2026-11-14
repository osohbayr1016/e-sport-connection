import { buildApp } from "../src/index";
import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import User from "../src/models/User";
import Tournament from "../src/models/Tournament";
import TournamentRegistration from "../src/models/TournamentRegistration";

describe("tournament organizer guardrails", () => {
 let app: FastifyInstance;
 beforeAll(async()=>{app=await buildApp();await app.ready();});
 afterAll(async()=>{await app.close();});
 async function setup() {
   const admin=await User.create({name:"Tournament Organizer",email:"tadmin@example.com",role:"ADMIN",password:"long-test-password"});
   const token=jwt.sign({id:admin.id,email:admin.email,role:admin.role},process.env.JWT_SECRET!);
   const start=new Date(Date.now()+5*86400000);
   const payload={
     name:"Safety Cup",description:"Test",game:"Mobile Legends: Bang Bang",
     startDate:start,endDate:new Date(start.getTime()+86400000),
     prizePool:0,prizeDistribution:{firstPlace:0,secondPlace:0,thirdPlace:0},
     maxSquads:4,location:"Online",organizer:"Test",
     registrationDeadline:new Date(start.getTime()-86400000),
     entryFee:0,tournamentType:"free",format:"Single Elimination",
   };
   return {token,payload};
 }
 const headers=(token:string)=>({authorization:"Bearer "+token});
 test("organizers cannot forge completed tournaments or nonzero capacity at creation",async()=>{
   const {token,payload}=await setup();
   const response=await app.inject({method:"POST",url:"/api/tournaments",headers:headers(token),
     payload:{...payload,status:"completed",currentSquads:500,brackets:{winner:"fake"}}});
   expect(response.statusCode).toBe(201);
   expect(response.json().tournament.status).toBe("upcoming");
   expect(response.json().tournament.currentSquads).toBe(0);
   expect(response.json().tournament.brackets).toBeUndefined();
 });
 test("cannot inject capacity, change lifecycle or erase a tournament with participants",async()=>{
   const {token,payload}=await setup();
   const tournament=await Tournament.create(payload);
   const path="/api/tournaments/"+tournament.id;
   const attempt=await app.inject({method:"PUT",url:path,headers:headers(token),
     payload:{currentSquads:999,status:"completed"}});
   expect(attempt.statusCode).toBe(400);
   expect((await Tournament.findById(tournament.id))!.status).toBe("upcoming");
   const protectedRegistration=await TournamentRegistration.create({
     tournament:tournament._id,squad:new (await import("mongoose")).default.Types.ObjectId(),
     squadLeader:new (await import("mongoose")).default.Types.ObjectId(),
     squadMembers:[],registrationFee:0,paymentStatus:"paid",
     isApproved:true,approvalStatus:"approved",status:"registered",
   });
   const result=await app.inject({method:"DELETE",url:path,headers:headers(token)});
   expect(result.statusCode).toBe(409);
   expect(await Tournament.findById(tournament.id)).not.toBeNull();
 });
 test("double-elimination competitions refuse to start without a completed format engine",async()=>{
   const {token,payload}=await setup();
   const tournament=await Tournament.create({...payload,format:"Double Elimination"});
   const result=await app.inject({method:"POST",url:"/api/tournaments/"+tournament.id+"/start",
     headers:headers(token)});
   expect(result.statusCode).toBe(409);
   expect(result.json().message).toMatch(/Double-elimination progression is not implemented/);
   expect((await Tournament.findById(tournament.id))?.status).toBe("upcoming");
 });
});
