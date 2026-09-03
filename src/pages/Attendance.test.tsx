import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Attendance from "./Attendance";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TestQueryProvider } from "@/test/render-with-providers";
import { initialMembers } from "@/components/members/member-data";

const { RECORDS, HEATMAP, checkInRequest, checkOutRequest } = vi.hoisted(() => {
  const at = (hour: number, minute: number) => new Date(2026, 8, 3, hour, minute).toISOString();

  const RECORDS = [
    { id: "a1", memberId: "1", memberName: "Sarah Connor", membershipId: "GYM-0001", checkIn: at(6, 30), checkOut: at(8, 15) },
    { id: "a2", memberId: "4", memberName: "Emily Chen", membershipId: "GYM-0004", checkIn: at(7, 15), checkOut: null },
  ];

  return {
    RECORDS,
    HEATMAP: [
      { weekday: 0, hour: 6, count: 3 },
      { weekday: 2, hour: 18, count: 9 },
    ],
    checkInRequest: vi.fn(async (memberId: string) => ({
      id: "a3",
      memberId,
      memberName: "David Kim",
      membershipId: "GYM-0007",
      checkIn: at(9, 5),
      checkOut: null,
    })),
    checkOutRequest: vi.fn(async () => ({ ...RECORDS[1], checkOut: at(9, 30) })),
  };
});

vi.mock("@/components/attendance/attendance-api", () => ({
  fetchTodayAttendance: vi.fn(async () => RECORDS),
  fetchAttendanceHeatmap: vi.fn(async () => HEATMAP),
  checkInRequest,
  checkOutRequest,
}));

vi.mock("@/components/members/members-api", () => ({
  fetchMembers: vi.fn(async (search?: string) =>
    initialMembers.filter((m) => m.name.toLowerCase().includes((search ?? "").toLowerCase())),
  ),
  fetchPlanFees: vi.fn(async () => ({})),
  createMemberRequest: vi.fn(),
  updatePaymentRequest: vi.fn(),
}));

const renderPage = () =>
  render(
    <TestQueryProvider>
      <MemoryRouter>
        <AuthProvider>
          <Attendance />
        </AuthProvider>
      </MemoryRouter>
    </TestQueryProvider>,
  );

describe("Attendance", () => {
  beforeEach(() => {
    checkInRequest.mockClear();
    checkOutRequest.mockClear();
  });

  it("lists today's check-ins with formatted times and durations", async () => {
    renderPage();

    expect(await screen.findByText("Sarah Connor")).toBeInTheDocument();
    expect(screen.getByText("06:30 AM")).toBeInTheDocument();
    expect(screen.getByText("08:15 AM")).toBeInTheDocument();
    expect(screen.getByText("1h 45m")).toBeInTheDocument();
    expect(screen.getByText("In gym")).toBeInTheDocument();
    expect(screen.getByText(/2 check-ins today · 1 in the gym now/)).toBeInTheDocument();
  });

  it("offers Check Out only for members still in the gym", async () => {
    renderPage();
    await screen.findByText("Sarah Connor");

    expect(screen.getAllByRole("button", { name: "Check Out" })).toHaveLength(1);
  });

  it("checks a member out and replaces the open session with its duration", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Check Out" }));

    await waitFor(() => expect(checkOutRequest).toHaveBeenCalledWith("a2"));
    expect(await screen.findByText("2h 15m")).toBeInTheDocument();
    expect(screen.queryByText("In gym")).not.toBeInTheDocument();
  });

  it("searches for a member and checks them in", async () => {
    renderPage();
    await screen.findByText("Sarah Connor");

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.change(await screen.findByPlaceholderText(/Name, email, NIC/), { target: { value: "David" } });

    fireEvent.click(await screen.findByText("David Kim"));

    const checkInButton = screen.getByRole("button", { name: "Check In" });
    await waitFor(() => expect(checkInButton).not.toBeDisabled());
    fireEvent.click(checkInButton);

    await waitFor(() => expect(checkInRequest).toHaveBeenCalledWith("7"));
    await waitFor(() => expect(screen.getByText("GYM-0007")).toBeInTheDocument());
  });

  it("keeps the Check In button disabled until a member is picked", async () => {
    renderPage();
    await screen.findByText("Sarah Connor");

    expect(screen.getByRole("button", { name: "Check In" })).toBeDisabled();
  });
});
