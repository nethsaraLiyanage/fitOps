import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Settings from "./Settings";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TestQueryProvider } from "@/test/render-with-providers";
import { ApiError } from "@/lib/api-client";

const { PROFILE, ME, updateGymProfileRequest, updateAccountRequest, updatePasswordRequest } = vi.hoisted(() => ({
  PROFILE: {
    name: "FitZone Gym",
    phone: "+94 11 555 0100",
    address: "123 Fitness Avenue, Colombo",
    hours: "5:00 AM - 10:00 PM",
    maxCapacity: 150,
  },
  ME: { id: "u1", name: "Admin User", email: "admin@fitops.lk", role: "Administrator" },
  updateGymProfileRequest: vi.fn(),
  updateAccountRequest: vi.fn(),
  updatePasswordRequest: vi.fn(),
}));

vi.mock("@/components/settings/settings-api", () => ({
  fetchGymProfile: vi.fn(async () => PROFILE),
  updateGymProfileRequest,
  updateAccountRequest,
  updatePasswordRequest,
}));

vi.mock("@/components/auth/auth-api", () => ({
  fetchMe: vi.fn(async () => ME),
  loginRequest: vi.fn(),
}));

const renderPage = () =>
  render(
    <TestQueryProvider>
      <MemoryRouter>
        <AuthProvider>
          <Settings />
        </AuthProvider>
      </MemoryRouter>
    </TestQueryProvider>,
  );

const accountTab = async () => {
  const tab = screen.getByRole("tab", { name: "Account" });
  // Radix tabs activate on focus, so a bare click is not enough in jsdom.
  fireEvent.mouseDown(tab);
  fireEvent.focus(tab);
  fireEvent.click(tab);
  await screen.findByText("Admin Account");
};

describe("Settings gym profile", () => {
  beforeEach(() => {
    updateGymProfileRequest.mockReset().mockImplementation(async (values) => values);
    updateAccountRequest.mockReset().mockImplementation(async (values) => ({ ...ME, ...values }));
    updatePasswordRequest.mockReset().mockResolvedValue(undefined);
    // Another test file may have left a session behind; AuthProvider reads it on mount.
    window.localStorage.clear();
    window.localStorage.setItem("fitops.token", "test-token");
  });

  it("fills the form from the saved profile instead of hardcoded defaults", async () => {
    renderPage();

    expect(await screen.findByDisplayValue("FitZone Gym")).toBeInTheDocument();
    expect(screen.getByDisplayValue("123 Fitness Avenue, Colombo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("150")).toBeInTheDocument();
  });

  it("saves an edited profile", async () => {
    renderPage();
    const capacity = await screen.findByDisplayValue("150");

    fireEvent.change(capacity, { target: { value: "220" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(updateGymProfileRequest).toHaveBeenCalledTimes(1));
    expect(updateGymProfileRequest.mock.calls[0][0]).toMatchObject({ name: "FitZone Gym", maxCapacity: 220 });
  });

  it("blocks a save with an empty required field", async () => {
    renderPage();
    const name = await screen.findByDisplayValue("FitZone Gym");

    fireEvent.change(name, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(await screen.findByText("Gym name is required")).toBeInTheDocument();
    expect(updateGymProfileRequest).not.toHaveBeenCalled();
  });
});

describe("Settings account", () => {
  beforeEach(() => {
    updateGymProfileRequest.mockReset().mockImplementation(async (values) => values);
    updateAccountRequest.mockReset().mockImplementation(async (values) => ({ ...ME, ...values }));
    updatePasswordRequest.mockReset().mockResolvedValue(undefined);
    // Another test file may have left a session behind; AuthProvider reads it on mount.
    window.localStorage.clear();
    window.localStorage.setItem("fitops.token", "test-token");
  });

  it("fills the account form from the signed-in user", async () => {
    renderPage();
    await accountTab();

    expect(await screen.findByDisplayValue("Admin User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("admin@fitops.lk")).toBeInTheDocument();
  });

  it("saves the account separately from the password", async () => {
    renderPage();
    await accountTab();

    fireEvent.change(await screen.findByDisplayValue("Admin User"), { target: { value: "Nimesha" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Account" }));

    await waitFor(() => expect(updateAccountRequest).toHaveBeenCalledTimes(1));
    expect(updateAccountRequest.mock.calls[0][0]).toMatchObject({ name: "Nimesha", email: "admin@fitops.lk" });
    expect(updatePasswordRequest).not.toHaveBeenCalled();
  });

  it("does not let a background auth refresh wipe an in-progress edit", async () => {
    renderPage();
    await accountTab();

    const name = await screen.findByDisplayValue("Admin User");
    fireEvent.change(name, { target: { value: "Half-typed edit" } });

    // AuthProvider revalidates ['auth','me'] and hands down a fresh user object.
    const { fetchMe } = await import("@/components/auth/auth-api");
    await vi.mocked(fetchMe)();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByDisplayValue("Half-typed edit")).toBeInTheDocument();
  });

  it("requires a new password of at least eight characters", async () => {
    renderPage();
    await accountTab();

    fireEvent.change(screen.getByPlaceholderText("Current password"), { target: { value: "admin123" } });
    fireEvent.change(screen.getByPlaceholderText("New password"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

    expect(await screen.findByText("Use at least 8 characters")).toBeInTheDocument();
    expect(updatePasswordRequest).not.toHaveBeenCalled();
  });

  it("clears the password fields after a successful change", async () => {
    renderPage();
    await accountTab();

    const current = screen.getByPlaceholderText("Current password");
    fireEvent.change(current, { target: { value: "admin123" } });
    fireEvent.change(screen.getByPlaceholderText("New password"), { target: { value: "brand-new-secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

    await waitFor(() => expect(updatePasswordRequest).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(current).toHaveValue(""));
  });

  it("keeps the typed values when the server rejects the current password", async () => {
    updatePasswordRequest.mockRejectedValueOnce(new ApiError(400, "Your current password is incorrect."));

    renderPage();
    await accountTab();

    fireEvent.change(screen.getByPlaceholderText("Current password"), { target: { value: "wrong" } });
    fireEvent.change(screen.getByPlaceholderText("New password"), { target: { value: "brand-new-secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

    await waitFor(() => expect(updatePasswordRequest).toHaveBeenCalledTimes(1));
    expect(screen.getByPlaceholderText("Current password")).toHaveValue("wrong");
  });
});
