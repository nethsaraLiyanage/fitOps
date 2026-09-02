import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Index from "./Index";
import Members from "./Members";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { initialMembers, TEST_PLAN_FEES } from "@/components/members/member-data";
import { currentMonthLabel, unverifiedThisMonth } from "@/components/members/payments";
import { initialClasses, initialSessions, sessionsToday } from "@/components/classes/class-data";
import { TestQueryProvider } from "@/test/render-with-providers";

vi.mock("@/components/members/members-api", () => ({
  fetchMembers: vi.fn(async () => initialMembers),
  fetchPlanFees: vi.fn(async () => TEST_PLAN_FEES),
  createMemberRequest: vi.fn(async () => initialMembers[0]),
  updatePaymentRequest: vi.fn(async (memberId: string, period: string, patch: Record<string, unknown>) => {
    const member = initialMembers.find((m) => m.id === memberId);
    if (!member) throw new Error("member not found");
    return { ...member, payments: member.payments.map((p) => (p.period === period ? { ...p, ...patch } : p)) };
  }),
}));

vi.mock("@/components/classes/classes-api", () => ({
  fetchClasses: vi.fn(async () => initialClasses),
  fetchSessions: vi.fn(async () => initialSessions),
  createClassRequest: vi.fn(),
  completeSessionRequest: vi.fn(),
}));

const renderApp = () =>
  render(
    <TestQueryProvider>
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/members" element={<Members />} />
            <Route path="/classes" element={<p>Classes page</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </TestQueryProvider>,
  );

const expected = unverifiedThisMonth(initialMembers, TEST_PLAN_FEES);
const todaysSessions = sessionsToday(initialClasses, initialSessions);

const classesCard = async () =>
  (await screen.findByText("Today's Classes", { selector: "h3" })).closest("div.glass-card") as HTMLElement;

describe("Dashboard Classes card", () => {
  it("shows today's sessions across disciplines with their times", async () => {
    renderApp();
    const card = within(await classesCard());

    if (todaysSessions.length === 0) {
      expect(card.getByText(/No classes on the schedule today/)).toBeInTheDocument();
      return;
    }

    for (const session of todaysSessions.slice(0, 4)) {
      expect(card.getAllByText(session.title).length).toBeGreaterThan(0);
    }
    expect(card.getByText(new RegExp(`${todaysSessions.length} session`))).toBeInTheDocument();
  });

  it("links through to the full schedule", async () => {
    renderApp();
    fireEvent.click(within(await classesCard()).getByRole("button", { name: /schedule/i }));

    expect(screen.getByText("Classes page")).toBeInTheDocument();
  });
});

describe("Dashboard unverified payments", () => {
  it("counts this month's unverified payments in a KPI card", async () => {
    renderApp();

    const kpi = (await screen.findByText("Unverified Payments", { selector: "p" })).closest(
      "div.kpi-card",
    ) as HTMLElement;
    expect(within(kpi).getByText(String(expected.length))).toBeInTheDocument();
    expect(within(kpi).getByText(new RegExp(currentMonthLabel()))).toBeInTheDocument();
  });

  it("lists each member whose payment is unverified", async () => {
    renderApp();

    const panel = (await screen.findByText("Unverified Payments", { selector: "h3" })).closest(
      "div.glass-card",
    ) as HTMLElement;
    for (const { member } of expected) {
      expect(within(panel).getByText(member.name)).toBeInTheDocument();
    }
    expect(within(panel).getAllByRole("button")).toHaveLength(expected.length);
  });

  it("opens the member's profile when a row is clicked", async () => {
    renderApp();

    const panel = (await screen.findByText("Unverified Payments", { selector: "h3" })).closest(
      "div.glass-card",
    ) as HTMLElement;
    fireEvent.click(within(panel).getAllByRole("button")[0]);

    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText("Member Profile")).toBeInTheDocument();
    expect(dialog.getByText(expected[0].member.email)).toBeInTheDocument();
  });
});
