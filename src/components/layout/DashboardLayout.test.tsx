import { describe, it, expect, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TestQueryProvider } from "@/test/render-with-providers";

const realMatchMedia = window.matchMedia;

/** Fake matchMedia whose `matches` can be flipped to simulate a resize. */
function stubViewport(matches: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches,
    media: "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    dispatchEvent: () => true,
  };
  Object.defineProperty(window, "matchMedia", { writable: true, value: () => mql });

  return (next: boolean) =>
    act(() => {
      mql.matches = next;
      listeners.forEach((fn) => fn());
    });
}

const renderLayout = () =>
  render(
    <TestQueryProvider>
      <MemoryRouter>
        <AuthProvider>
          <DashboardLayout>
            <p>Page content</p>
          </DashboardLayout>
        </AuthProvider>
      </MemoryRouter>
    </TestQueryProvider>,
  );

const sidebarState = () => document.querySelector('[data-side="left"]')?.getAttribute("data-state");

describe("DashboardLayout sidebar", () => {
  afterEach(() => {
    Object.defineProperty(window, "matchMedia", { writable: true, value: realMatchMedia });
  });

  it("starts collapsed on tablet-sized screens", () => {
    stubViewport(true);
    renderLayout();

    expect(sidebarState()).toBe("collapsed");
  });

  it("starts expanded on desktop screens", () => {
    stubViewport(false);
    renderLayout();

    expect(sidebarState()).toBe("expanded");
  });

  it("collapses when the viewport shrinks to tablet width", () => {
    const resizeTo = stubViewport(false);
    renderLayout();
    expect(sidebarState()).toBe("expanded");

    resizeTo(true);
    expect(sidebarState()).toBe("collapsed");
  });
});
