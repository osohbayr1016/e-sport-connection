import { buildApp } from "../src/index";
import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import Squad, { SquadJoinType } from "../src/models/Squad";
import User from "../src/models/User";

describe("concurrent squad membership",()=>{
  let app: FastifyInstance;
  beforeAll(async()=>{app=await buildApp();await app.ready();});
  afterAll(async()=>{await app.close();});
  const user=async(name:string)=>User.create({name,email:name+"@example.com",password:"test-password",role:"PLAYER"});
  const token=(person:any)=>jwt.sign({id:person.id,email:person.email,role:person.role},
    process.env.JWT_SECRET!);
  test("multiple simultaneous joins cannot overfill a nearly-full squad",async()=>{
    const users=await Promise.all(["leader","m1","m2","m3","m4","m5"].map(user));
    const squad=await Squad.create({name:"Concurrency",tag:"CCUP",leader:users[0].id,
      members:users.slice(0,4).map(x=>x.id),maxMembers:5,joinType:SquadJoinType.EVERYONE_CAN_JOIN,
      game:"Mobile Legends: Bang Bang"});
    const results=await Promise.all(users.slice(4).map(person=>app.inject({
      method:"POST",url:"/api/squads/"+squad.id+"/join",
      headers:{authorization:"Bearer "+token(person)},payload:{},
    })));
    expect(results.map(x=>x.statusCode).sort()).toEqual([200,409]);
    expect((await Squad.findById(squad.id))!.members).toHaveLength(5);
  });
  test("duplicate member requests cannot insert a member twice",async()=>{
    const users=await Promise.all(["lead2","new2"].map(user));
    const squad=await Squad.create({name:"Duplicate",tag:"DUP5",leader:users[0].id,
      members:[users[0].id],maxMembers:5,joinType:SquadJoinType.EVERYONE_CAN_JOIN,
      game:"Mobile Legends: Bang Bang"});
    const calls=await Promise.all([1,2].map(()=>app.inject({
      method:"POST",url:"/api/squads/"+squad.id+"/join",
      headers:{authorization:"Bearer "+token(users[1])},payload:{},
    })));
    expect(calls.map(c=>c.statusCode).sort()).toEqual([200,409]);
    expect((await Squad.findById(squad.id))!.members).toHaveLength(2);
  });
  test("leader member addition cannot be forged by a non-leader",async()=>{
    const users=await Promise.all(["lead3","bad3","new3"].map(user));
    const squad=await Squad.create({name:"Leader Only",tag:"LDR3",leader:users[0].id,
      members:[users[0].id],maxMembers:5,game:"Mobile Legends: Bang Bang"});
    const attempt=await app.inject({method:"POST",url:"/api/squads/"+squad.id+"/members",
      headers:{authorization:"Bearer "+token(users[1])},payload:{newMemberId:users[2].id}});
    expect(attempt.statusCode).toBe(409);
    expect((await Squad.findById(squad.id))!.members).toHaveLength(1);
  });
});
