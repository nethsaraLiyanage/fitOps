import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "./Login";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { TestQueryProvider } from "@/test/render-with-providers";
import { ApiError, getToken } from "@/lib/api-client";

/** Mirrors server/src/seed/data/users.ts so tests exercise the same demo accounts as the real API. */
const { ACCOUNTS } = vi.hoisted(() => ({
  ACCOUNTS: [
    { id: "1", email: "admin@fitops.lk", password: "admin123", role: "Administrator", name: "Admin" },
    { id: "2", email: "staff@fitops.lk", password: "staff123", role: "Staff", name: "Front Desk" },
  ],
}));

vi.mock("@/components/auth/auth-api", () => ({
  loginRequest: vi.fn(async (email: string, password: string) => {
    const account = ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password,
    );
    if (!account) throw new ApiError(401, "Those credentials do not match any account.");
    const { password: _password, ...user } = account;
    return { token: `test-token-${account.id}`, user };
  }),
  fetchMe: vi.fn(async () => {
    const token = getToken();
    const account = ACCOUNTS.find((a) => `test-token-${a.id}` === token);
    if (!account) throw new ApiError(401, "Unauthorized");
    const { password: _password, ...user } = account;
    return user;
  }),
}));

const Protected = () => <p>Secret dashboard</p>;

const renderApp = (path = "/login") =>
  render(
    <TestQueryProvider>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Protected />
                </RequireAuth>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </TestQueryProvider>,
  );

const signIn = (email: string, password: string) => {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
};

describe("Login", () => {
  beforeEach(() => window.localStorage.clear());

  it("redirects signed-out visitors from a protected page to the login screen", () => {
    renderApp("/");

    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByText("Secret dashboard")).not.toBeInTheDocument();
  });

  it("rejects wrong credentials", async () => {
    renderApp();
    signIn(ACCOUNTS[0].email, "nope");

    expect(await screen.findByRole("alert")).toHaveTextContent(/do not match/i);
    expect(screen.queryByText("Secret dashboard")).not.toBeInTheDocument();
  });

  it("validates the email field", async () => {
    renderApp();
    signIn("not-an-email", "admin123");

    expect(await screen.findByText("Invalid email address")).toBeInTheDocument();
  });

  it("signs in with a demo account and lands on the protected page", async () => {
    const account = ACCOUNTS[0];
    renderApp("/");
    signIn(account.email, account.password);

    expect(await screen.findByText("Secret dashboard")).toBeInTheDocument();
  });

  it("keeps the session so a reload stays signed in", async () => {
    const account = ACCOUNTS[0];
    renderApp();
    signIn(account.email, account.password);
    await screen.findByText("Secret dashboard");

    renderApp("/");
    expect(screen.getAllByText("Secret dashboard").length).toBeGreaterThan(0);
  });

  it("toggles password visibility", () => {
    renderApp();

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  });
});
