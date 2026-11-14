import mongoose from "mongoose";
import Squad from "../src/models/Squad";
import TournamentRegistration from "../src/models/TournamentRegistration";

describe("membership identity consistency", () => {
  test("squad keeps exactly one leader across saves and independently created ObjectIds", async () => {
    const leader = new mongoose.Types.ObjectId();
    const copyOfLeader = new mongoose.Types.ObjectId(leader.toString());
    const squad = new Squad({
      name: "Membership Test", tag: "MID", leader,
      members: [copyOfLeader, leader, copyOfLeader],
      game: "Mobile Legends: Bang Bang", maxMembers: 5,
    });
    await squad.save();
    await (await Squad.findById(squad.id))!.save();
    const saved = await Squad.findById(squad.id);
    expect(saved!.members.map(id => id.toString())).toEqual([leader.toString()]);
  });

  test("registration retains the leader once even after reload", async () => {
    const leader = new mongoose.Types.ObjectId();
    const registration = new TournamentRegistration({
      tournament: new mongoose.Types.ObjectId(),
      squad: new mongoose.Types.ObjectId(),
      squadLeader: leader,
      squadMembers: [new mongoose.Types.ObjectId(leader.toString()), leader],
      registrationFee: 0,
      paymentStatus: "paid", isApproved: true, approvalStatus: "approved",
    });
    await registration.save();
    const loaded = (await TournamentRegistration.findById(registration.id))!;
    await loaded.save();
    const saved = await TournamentRegistration.findById(registration.id);
    expect(saved!.squadMembers.map(id => id.toString())).toEqual([leader.toString()]);
  });
});
