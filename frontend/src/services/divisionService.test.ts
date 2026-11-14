import { SquadDivision } from "../types/division";
import { DivisionService } from "./divisionService";

describe("DivisionService supported divisions", () => {
  it("exposes Silver, Gold and Diamond with stable names", () => {
    expect(DivisionService.getDivisionDisplayName(SquadDivision.SILVER)).toBe("Silver Division");
    expect(DivisionService.getDivisionDisplayName(SquadDivision.GOLD)).toBe("Gold Division");
    expect(DivisionService.getDivisionDisplayName(SquadDivision.DIAMOND)).toBe("Diamond Division");
  });
});
