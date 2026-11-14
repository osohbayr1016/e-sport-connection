import { selectTournamentSquad } from "../../utils/tournamentEligibility";
const squad = (members: string[], leader: string, game = "Mobile Legends: Bang Bang") => ({
  _id: "a", name: "Our Squad", leader, game, members,
});
describe("tournament registration eligibility", () => {
  test("does not count a leader already in members twice", () => {
    expect(selectTournamentSquad([squad(["u1","u2","u3","u4"],"u1")],"u1","Mobile Legends: Bang Bang").squad).toBeNull();
  });
  test("chooses the actual leader's matching full team", () => {
    const candidates=[squad(["z","u2","u3","u4","u5"],"z"), squad(["u1","u2","u3","u4","u5"],"u1")];
    expect(selectTournamentSquad(candidates,"u1","Mobile Legends: Bang Bang").squad?.leader).toBe("u1");
  });
  test("rejects mismatched games", () => {
    expect(selectTournamentSquad([squad(["u1","u2","u3","u4","u5"],"u1","CS2")],"u1","Mobile Legends: Bang Bang").squad).toBeNull();
  });
});
