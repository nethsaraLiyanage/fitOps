/**
 * Ported from the frontend's Inventory.tsx. `status` is dropped here since
 * it's derived server-side (stock/minStock) rather than stored. The
 * original UI showed one global `stockHistory` array for whichever item was
 * selected — here it's duplicated into each item's own `movements` so real
 * per-item history exists from day one.
 */
const stockHistory = [
  { date: "2024-03-20", direction: "add" as const, quantity: 50, note: "Restocked" },
  { date: "2024-03-10", direction: "remove" as const, quantity: 8, note: "Used" },
  { date: "2024-02-28", direction: "add" as const, quantity: 30, note: "Restocked" },
];

export const seedInventory = [
  { name: "Protein Powder (Whey)", category: "Supplements", stock: 12, minStock: 20, supplier: "NutriFit Co.", movements: stockHistory },
  { name: "Yoga Mats", category: "Accessories", stock: 3, minStock: 15, supplier: "FitGear Ltd.", movements: stockHistory },
  { name: "Towels (Large)", category: "Amenities", stock: 85, minStock: 30, supplier: "CleanLinens Inc.", movements: stockHistory },
  { name: "Water Bottles", category: "Retail", stock: 45, minStock: 20, supplier: "HydroGear", movements: stockHistory },
  { name: "Resistance Bands", category: "Accessories", stock: 8, minStock: 15, supplier: "FitGear Ltd.", movements: stockHistory },
  { name: "Hand Sanitizer", category: "Amenities", stock: 2, minStock: 10, supplier: "CleanSupply", movements: stockHistory },
  { name: "Gym Gloves", category: "Accessories", stock: 30, minStock: 10, supplier: "FitGear Ltd.", movements: stockHistory },
  { name: "Energy Bars", category: "Supplements", stock: 60, minStock: 25, supplier: "NutriFit Co.", movements: stockHistory },
];
