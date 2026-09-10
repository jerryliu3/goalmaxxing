import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { InteractionLab } from "./study";
afterEach(cleanup);
describe("interaction lab journeys", () => {
  it("reviews a move, cancels without changes, saves and undoes", async () => {
    const user=userEvent.setup();
    render(<InteractionLab/>);
    await user.click(screen.getByRole("button",{name:"Move Running",exact:true}));
    fireEvent.change(screen.getByLabelText("New date for Running"),{target:{value:"2026-10-03"}});
    await user.click(screen.getByRole("button",{name:"Review move",exact:true}));
    expect(screen.getByRole("dialog")).toHaveTextContent("3 Oct");
    await user.click(within(screen.getByRole("dialog")).getByRole("button",{name:"Cancel",exact:true}));
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button",{name:"Move Running",exact:true}));
    await user.click(screen.getByRole("button",{name:"Review move",exact:true}));
    await user.click(screen.getByRole("button",{name:"Save move"}));
    expect(screen.getByRole("status")).toHaveTextContent("3 Oct");
    await user.click(screen.getByRole("button",{name:"Undo"})); expect(screen.getByRole("status")).toHaveTextContent("undone");
  });
  it("creates a goal through the whole flow and keeps it across concepts", async () => {
    const user=userEvent.setup();
    render(<InteractionLab/>); await user.click(screen.getByRole("button",{name:"New goal",exact:true}));
    fireEvent.change(screen.getByLabelText("Name",{exact:true}),{target:{value:"Learn ceramics"}});
    await user.click(screen.getByRole("button",{name:"Continue",exact:true}));
    await user.click(screen.getByRole("button",{name:"Continue",exact:true}));
    await user.click(screen.getByRole("button",{name:"Continue",exact:true}));
    await user.click(screen.getByRole("button",{name:"Create in demo"}));
    expect(screen.getByRole("status")).toHaveTextContent("Learn ceramics created");
    await user.click(screen.getByRole("button",{name:/Glide/}));
    await user.click(screen.getByRole("button",{name:/Unplanned ·/}));
    expect(screen.getByRole("button",{name:"Move Learn ceramics"})).toBeInTheDocument();
  });
  it("changes analysis for any goal combination and keeps membership when switching", async () => {
    const user=userEvent.setup();
    render(<InteractionLab/>); await user.click(screen.getByRole("tab",{name:"Progress",exact:true}));
    const picker=screen.getByText("Make a lens").closest("aside")!;
    await user.click(within(picker).getByRole("button",{name:"Running",exact:true}));
    await user.click(within(picker).getByRole("button",{name:"Reading",exact:true}));
    expect(screen.getByRole("heading",{name:"Running + Reading"})).toBeInTheDocument();
    await user.click(screen.getByRole("button",{name:"Compare",exact:true})); expect(screen.getByRole("table")).toBeInTheDocument();
    await user.click(screen.getByRole("tab",{name:"People",exact:true})); await user.click(screen.getByRole("button",{name:"Challenges",exact:true})); await user.click(screen.getByRole("button",{name:"Join in demo"}));
    await user.click(screen.getByRole("button",{name:/Switchboard/})); await user.click(screen.getByRole("tab",{name:"People",exact:true})); await user.click(screen.getByRole("button",{name:"Challenges",exact:true})); expect(screen.getByRole("button",{name:"Leave challenge"})).toBeInTheDocument();
  });
});
