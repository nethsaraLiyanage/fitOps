import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Members from "./Members";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { recentMonths, formatPeriod } from "@/components/members/payments";
import { TestQueryProvider } from "@/test/render-with-providers";
import { initialMembers, TEST_PLAN_FEES } from "@/components/members/member-data";

vi.mock("@/components/members/members-api", () => ({
  fetchMembers: vi.fn(async () => initialMembers),
  fetchPlanFees: vi.fn(async () => TEST_PLAN_FEES),
  createMemberRequest: vi.fn(async () => initialMembers[0]),
  updatePaymentRequest: vi.fn(async (memberId: string, period: string, patch: Record<string, unknown>) => {
    const member = initialMembers.find((m) => m.id === memberId);
    if (!member) throw new Error("member not found");
    return {
      ...member,
      payments: member.payments.map((p) => (p.period === period ? { ...p, ...patch } : p)),
    };
  }),
}));

const openProfile = async (name: string) => {
  render(
    <TestQueryProvider>
      <MemoryRouter>
        <AuthProvider>
          <Members />
        </AuthProvider>
      </MemoryRouter>
    </TestQueryProvider>,
  );
  fireEvent.click(await screen.findByText(name));
  // Radix tabs activate on focus, so a bare click is not enough in jsdom.
  const tab = screen.getByRole("tab", { name: "Payments" });
  fireEvent.mouseDown(tab);
  fireEvent.focus(tab);
  fireEvent.click(tab);
  return within(screen.getByRole("dialog"));
};

describe("Members payments", () => {
  it("lists the past three months for a monthly member", async () => {
    const dialog = await openProfile("Sarah Connor");

    for (const period of recentMonths()) {
      expect(dialog.getByText(formatPeriod(period))).toBeInTheDocument();
    }
    expect(dialog.getAllByRole("switch")).toHaveLength(3);
  });

  it("lists a single period for an annual member", async () => {
    const dialog = await openProfile("Emily Chen");

    expect(dialog.getAllByRole("switch")).toHaveLength(1);
    expect(dialog.queryByText(formatPeriod(recentMonths()[1]))).not.toBeInTheDocument();
    expect(dialog.getByText(/Billed once a year/)).toBeInTheDocument();
  });

  it("persists a manual verification toggle", async () => {
    const dialog = await openProfile("Sarah Connor");
    const toggle = dialog.getAllByRole("switch")[0];

    expect(toggle).toHaveAttribute("data-state", "unchecked");
    fireEvent.click(toggle);
    await waitFor(() => expect(dialog.getAllByRole("switch")[0]).toHaveAttribute("data-state", "checked"));
    expect(dialog.getAllByText("Verified").length).toBeGreaterThan(0);
  });
});
