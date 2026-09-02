import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemberPayments } from "./MemberPayments";
import { Payment, PlanFees, feeFor, recentMonths, currentPeriod, formatPeriod } from "./payments";

const PLAN_FEES: PlanFees = { Basic: { Monthly: 3500, Annual: 38000 }, Premium: { Monthly: 6500, Annual: 70000 } };

const monthly = (): Payment[] =>
  recentMonths().map((period, i) => ({
    period,
    amount: feeFor("Basic", "Monthly", PLAN_FEES),
    status: i === 0 ? ("pending" as const) : ("paid" as const),
    verified: i !== 0,
    paidOn: i === 0 ? null : `${period}-05`,
  }));

describe("MemberPayments", () => {
  it("shows the past three months for monthly members", () => {
    render(
      <MemberPayments
        member={{ plan: "Basic", paymentMethod: "Monthly", payments: monthly() }}
        planFees={PLAN_FEES}
        onUpdate={vi.fn()}
      />,
    );

    for (const period of recentMonths()) {
      expect(screen.getByText(formatPeriod(period))).toBeInTheDocument();
    }
    expect(screen.getByText("Monthly")).toBeInTheDocument();
  });

  it("shows only the annual period for annual members", () => {
    render(
      <MemberPayments
        member={{ plan: "Basic", paymentMethod: "Annual", payments: [] }}
        planFees={PLAN_FEES}
        onUpdate={vi.fn()}
      />,
    );

    expect(screen.getByText(formatPeriod(currentPeriod("Annual")))).toBeInTheDocument();
    expect(screen.queryByText(formatPeriod(recentMonths()[1]))).not.toBeInTheDocument();
  });

  it("gives every payment its own verify toggle", () => {
    const onUpdate = vi.fn();
    const payments = monthly();
    render(
      <MemberPayments
        member={{ plan: "Basic", paymentMethod: "Monthly", payments }}
        planFees={PLAN_FEES}
        onUpdate={onUpdate}
      />,
    );

    const toggles = screen.getAllByRole("switch");
    expect(toggles).toHaveLength(3);

    fireEvent.click(toggles[0]);
    expect(onUpdate).toHaveBeenCalledWith(payments[0].period, { verified: true });
  });

  it("renders a status control for each payment", () => {
    render(
      <MemberPayments
        member={{ plan: "Basic", paymentMethod: "Monthly", payments: monthly() }}
        planFees={PLAN_FEES}
        onUpdate={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("combobox")).toHaveLength(3);
  });
});
