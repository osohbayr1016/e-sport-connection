import { buildApp } from "../src/index";
import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../src/models/User";
import Message from "../src/models/Message";
import { sameConversationReply } from "../src/services/directMessagePolicy";

describe("direct messaging privacy", () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });

  const person = async (name: string) => User.create({
    name, email: name + "@example.com", password: "test-password-123", role: "PLAYER",
  });
  const bearer = (user: any) => "Bearer " + jwt.sign({
    id: user.id, email: user.email, role: user.role,
  }, process.env.JWT_SECRET!);
  test("replyToId cannot access someone else's private message", async () => {
    const [alice, bob, carol] = await Promise.all(["alice","bob","carol"].map(person));
    const privateMessage = await Message.create({
      senderId: bob.id, receiverId: carol.id, content: "private other conversation",
    });
    const forged = await app.inject({
      method: "POST", url: "/api/messages",
      headers: { authorization: bearer(alice) },
      payload: { receiverId: bob.id, content: "Trying to quote a secret", replyToId: privateMessage.id },
    });
    expect(forged.statusCode).toBe(400);
    expect(await Message.countDocuments({ senderId: alice.id })).toBe(0);
    const correct = await Message.create({ senderId: bob.id, receiverId: alice.id, content: "hello Alice" });
    const allowed = await app.inject({
      method: "POST", url: "/api/messages",
      headers: { authorization: bearer(alice) },
      payload: { receiverId: bob.id, content: "Reply", replyToId: correct.id },
    });
    expect(allowed.statusCode).toBe(201);
  });

  test("legacy forged reply references do not expose message preview on GET", async () => {
    const [alice, bob, carol] = await Promise.all(["a2","b2","c2"].map(person));
    const secret = await Message.create({senderId:bob.id,receiverId:carol.id,content:"HIDDEN"});
    await Message.create({senderId:alice.id,receiverId:bob.id,content:"historical malicious reply",replyToId:secret.id});
    const response = await app.inject({method:"GET",url:"/api/messages/"+bob.id,
      headers:{authorization:bearer(alice)}});
    expect(response.statusCode).toBe(200);
    const item = response.json().messages.find((x:any)=>x.content==="historical malicious reply");
    expect(item.replyTo).toBeUndefined();
    expect(item.replyToId).toBeUndefined();
    expect(JSON.stringify(response.json())).not.toContain("HIDDEN");
  });

  test("reply participant match is order-independent", async()=>{
    const a=new mongoose.Types.ObjectId(), b=new mongoose.Types.ObjectId(), c=new mongoose.Types.ObjectId();
    expect(sameConversationReply({senderId:a,receiverId:b},b,a)).toBe(true);
    expect(sameConversationReply({senderId:a,receiverId:c},b,a)).toBe(false);
  });
});
