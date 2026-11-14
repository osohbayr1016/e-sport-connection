import { buildApp } from "../src/index";
import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import User from "../src/models/User";
import Tournament from "../src/models/Tournament";
import TournamentRegistration from "../src/models/TournamentRegistration";
import Squad from "../src/models/Squad";

describe("paid tournament review and capacity",()=>{
 let app: FastifyInstance;
 beforeAll(async()=>{app=await buildApp();await app.ready();});
 afterAll(async()=>{await app.close();});
 const user=async(name:string,role="PLAYER")=>User.create({name,email:name+"@example.com",password:"long-test-password",role});
 const token=(u:any)=>jwt.sign({id:u.id,email:u.email,role:u.role},process.env.JWT_SECRET!);
 const header=(u:any)=>({authorization:"Bearer "+token(u)});
 async function fixture(){
  const [admin,leader]=await Promise.all([user("payadmin","ADMIN"),user("payleader")]);
  const start=new Date(Date.now()+5*86400000);
  const tournament=await Tournament.create({name:"Tax Cup",description:"Tax registration",game:"Mobile Legends: Bang Bang",
   startDate:start,endDate:new Date(start.getTime()+86400000),prizePool:0,
   prizeDistribution:{firstPlace:0,secondPlace:0,thirdPlace:0},maxSquads:5,currentSquads:1,
   status:"registration_open",organizer:"Test",location:"Online",registrationDeadline:start,
   entryFee:5000,tournamentType:"tax",format:"Single Elimination"});
  const squad=await Squad.create({name:"Pay Squad",tag:"PAY01",leader:leader.id,
   members:[leader.id],game:"Mobile Legends: Bang Bang",maxMembers:5});
  const registration=await TournamentRegistration.create({
   tournament:tournament.id,squad:squad.id,squadLeader:leader.id,
   squadMembers:[leader.id],registrationFee:5000,paymentProof:"some-proof",
   paymentStatus:"pending",approvalStatus:"pending",isApproved:false,status:"registered",
  });
  return {admin,leader,tournament,registration};
 }
 test("approval without manually recorded settlement is rejected",async()=>{
  const f=await fixture();
  const res=await app.inject({method:"PUT",url:"/api/tournament-registrations/"+f.registration.id+"/approve",
   headers:header(f.admin),payload:{action:"approve"}});
  expect(res.statusCode).toBe(409);
  const stored=await TournamentRegistration.findById(f.registration.id);
  expect(stored!.paymentStatus).toBe("pending");
  expect(stored!.isApproved).toBe(false);
 });
 test("requires bank reference and makes verification/approval single-use",async()=>{
  const f=await fixture();
  const p="/api/tournament-registrations/"+f.registration.id;
  const missing=await app.inject({method:"PUT",url:p+"/payment",headers:header(f.admin),payload:{paymentStatus:"paid"}});
  expect(missing.statusCode).toBe(400);
  const paid=await app.inject({method:"PUT",url:p+"/payment",headers:header(f.admin),
   payload:{paymentStatus:"paid",paymentReference:"BANK-REFERENCE-987"}});
  expect(paid.statusCode).toBe(200);
  expect((await TournamentRegistration.findById(f.registration.id))!.isApproved).toBe(false);
  const approve=()=>app.inject({method:"PUT",url:p+"/approve",headers:header(f.admin),payload:{action:"approve"}});
  expect((await approve()).statusCode).toBe(200);
  expect((await approve()).statusCode).toBe(409);
  expect((await TournamentRegistration.findById(f.registration.id))!.paymentStatus).toBe("paid");
  expect((await TournamentRegistration.findById(f.registration.id))!.isApproved).toBe(true);
 });
 test("rejecting a nonpaid registration returns the slot once",async()=>{
  const f=await fixture();
  const url="/api/tournament-registrations/"+f.registration.id+"/approve";
  const reject=()=>app.inject({method:"PUT",url,headers:header(f.admin),payload:{action:"reject",reason:"No payment"}});
  expect((await reject()).statusCode).toBe(200);
  expect((await reject()).statusCode).toBe(409);
  expect((await Tournament.findById(f.tournament.id))!.currentSquads).toBe(0);
  expect((await TournamentRegistration.findById(f.registration.id))!.approvalStatus).toBe("rejected");
 });
});
