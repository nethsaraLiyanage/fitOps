/**
 * Ported from the frontend's AuthProvider.DEMO_ACCOUNTS.
 *
 * The defaults stay as the well-known demo pair so local dev and the test
 * suite keep working untouched. Any deployment reachable from outside
 * localhost should override these via SEED_* env vars, since the defaults are
 * public knowledge — they are printed on the login screen and live in a public
 * repo.
 */
export const seedUsers = [
  {
    name: "Admin",
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@fitops.lk",
    password: process.env.SEED_ADMIN_PASSWORD ?? "admin123",
    role: "Administrator" as const,
  },
  {
    name: "Front Desk",
    email: process.env.SEED_STAFF_EMAIL ?? "staff@fitops.lk",
    password: process.env.SEED_STAFF_PASSWORD ?? "staff123",
    role: "Staff" as const,
  },
];
