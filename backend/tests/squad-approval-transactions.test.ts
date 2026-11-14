import { buildApp } from "../src/index";
import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import User from "../src/models/User";
import Squad from "../src/models/Squad";
import SquadInvitation, { InvitationStatus } from "../src/models/SquadInvitation";
import SquadApplication, { ApplicationStatus } from "../src/models/SquadApplication";

describe("transactional squad invitations and applications",()=>{
 let app:FastifyInstance;
 beforeAll(async()=>{app=await buildApp();await app.ready()});
 afterAll(async()=>{await app.close()});
 async function person(name:string){return User.create({name,email:name+"@test.com",password:"test-pass-123",role:"PLAYER"});}
 const auth=(user:any)=>({authorization:"Bearer "+jwt.sign({
  id:user.id,email:user.email,role:user.role,
 },process.env.JWT_SECRET!)});
 test("accepting invitation atomically fills only one last slot",async()=>{
  const [leader,a,b,c,invited]=await Promise.all(["lead","a","b","c","inv"].map(person));
  const squad=await Squad.create({name:"Invitations",tag:"INV5",leader:leader.id,
   members:[leader.id,a.id,b.id,c.id],maxMembers:5,game:"Mobile Legends: Bang Bang"});
  const invitation=await SquadInvitation.create({squad:squad.id,invitedUser:invited.id,invitedBy:leader.id});
  const url="/api/squads/"+squad.id+"/respond-invitation";
  const call=()=>app.inject({method:"POST",url,headers:auth(invited),
   payload:{invitationId:invitation.id,response:"ACCEPT"}});
  const replies=await Promise.all([call(),call()]);
  expect(replies.filter(x=>x.statusCode===200)).toHaveLength(1);
  expect(replies.filter(x=>x.statusCode!==200)).toHaveLength(1);
  expect((await Squad.findById(squad.id))!.members).toHaveLength(5);
  expect((await SquadInvitation.findById(invitation.id))!.status).toBe(InvitationStatus.ACCEPTED);
 });
 test("application approval with full squad leaves application pending",async()=>{
  const [leader,a,b,c,d,applicant]=await Promise.all(["lead2","a2","b2","c2","d2","app"].map(person));
  const squad=await Squad.create({name:"Applications",tag:"APP5",leader:leader.id,
   members:[leader.id,a.id,b.id,c.id,d.id],maxMembers:5,game:"Mobile Legends: Bang Bang"});
  const application=await SquadApplication.create({squad:squad.id,applicant:applicant.id});
  const res=await app.inject({method:"POST",url:"/api/squads/"+squad.id+"/respond-application",
   headers:auth(leader),payload:{applicationId:application.id,response:"APPROVE"}});
  expect(res.statusCode).toBe(409);
  expect((await SquadApplication.findById(application.id))!.status).toBe(ApplicationStatus.PENDING);
  expect((await Squad.findById(squad.id))!.members).toHaveLength(5);
 });
});
