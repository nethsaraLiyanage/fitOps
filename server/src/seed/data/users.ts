/** Ported from the frontend's AuthProvider.DEMO_ACCOUNTS. */
export const seedUsers = [
  { name: "Admin", email: "admin@fitops.lk", password: "admin123", role: "Administrator" as const },
  { name: "Front Desk", email: "staff@fitops.lk", password: "staff123", role: "Staff" as const },
];
