import { render, screen } from "@testing-library/react";
import DivisionCoinImage from "../../components/DivisionCoinImage";
import { SquadDivision } from "../../types/division";

describe("DivisionCoinImage", () => {
  it.each([
    [SquadDivision.SILVER, "Silver Division Coin", 32],
    [SquadDivision.GOLD, "Gold Division Coin", 40],
    [SquadDivision.DIAMOND, "Diamond Division Coin", 48],
  ] as const)("renders supported %s with correct alt text and dimensions", (division, alt, size) => {
    render(<DivisionCoinImage division={division} size={size} />);
    const image = screen.getByRole("img", { name: alt });
    expect(image).toHaveAttribute("width", String(size));
    expect(image).toHaveAttribute("height", String(size));
  });

  it("supports custom image size", () => {
    render(<DivisionCoinImage division={SquadDivision.GOLD} size={100} />);
    expect(screen.getByRole("img", { name: "Gold Division Coin" })).toHaveAttribute("width", "100");
  });
});
