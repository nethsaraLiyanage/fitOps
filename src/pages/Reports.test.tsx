import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Reports from "./Reports";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TestQueryProvider } from "@/test/render-with-providers";

const { downloadReport, SUMMARY } = vi.hoisted(() => ({
  downloadReport: vi.fn(async () => undefined),
  SUMMARY: {
    memberTrend: [
      { month: "Aug", new: 1, total: 7 },
      { month: "Sep", new: 2, total: 9 },
    ],
    attendanceTrend: [
      { week: "W1", avg: 9 },
      { week: "W2", avg: 12 },
    ],
    attendanceByWeekday: [{ day: "Mon", checkins: 14 }],
    equipmentByCategory: [
      { name: "Cardio", value: 4 },
      { name: "Strength", value: 4 },
      { name: "Recovery", value: 2 },
    ],
  },
}));

vi.mock("@/components/reports/reports-api", () => ({
  fetchReportsSummary: vi.fn(async () => SUMMARY),
  downloadReport,
}));

const renderPage = () =>
  render(
    <TestQueryProvider>
      <MemoryRouter>
        <AuthProvider>
          <Reports />
        </AuthProvider>
      </MemoryRouter>
    </TestQueryProvider>,
  );

describe("Reports", () => {
  beforeEach(() => downloadReport.mockClear());

  it("titles the pie chart by composition, not by usage the app does not track", async () => {
    renderPage();

    expect(await screen.findByText("Equipment by Category")).toBeInTheDocument();
    expect(screen.queryByText(/Equipment Usage/)).not.toBeInTheDocument();
  });

  it("lists each category with its count and share", async () => {
    renderPage();

    expect(await screen.findByText("Cardio")).toBeInTheDocument();
    expect(screen.getAllByText("4 · 40%")).toHaveLength(2);
    expect(screen.getByText("2 · 20%")).toBeInTheDocument();
  });

  it("downloads each export as a CSV", async () => {
    renderPage();
    await screen.findByText("Equipment by Category");

    fireEvent.click(screen.getByRole("button", { name: /Export Members/ }));
    await waitFor(() => expect(downloadReport).toHaveBeenCalledWith("members"));

    fireEvent.click(screen.getByRole("button", { name: /Export Attendance/ }));
    await waitFor(() => expect(downloadReport).toHaveBeenCalledWith("attendance"));

    fireEvent.click(screen.getByRole("button", { name: /Export Equipment/ }));
    await waitFor(() => expect(downloadReport).toHaveBeenCalledWith("equipment"));
  });

  it("says so when there is no equipment to break down", async () => {
    const { fetchReportsSummary } = await import("@/components/reports/reports-api");
    vi.mocked(fetchReportsSummary).mockResolvedValueOnce({ ...SUMMARY, equipmentByCategory: [] });

    renderPage();

    expect(await screen.findByText("No equipment recorded yet.")).toBeInTheDocument();
  });
});
