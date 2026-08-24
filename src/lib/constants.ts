export const REPORT_STATUSES = ["submitted", "ai_verified", "assigned", "in_progress", "resolved"] as const;
export const SEVERITY_POINTS: Record<string, number> = { small: 20, medium: 50, large: 100, extreme: 200 };
export const DEFAULT_REWARDS = [
  { name: "Plant a Tree Certificate", description: "Support a local tree-planting initiative.", cost: 150, icon: "🌱" },
  { name: "Eco Store Discount 20%", description: "20% off at participating eco stores.", cost: 200, icon: "♻️" },
  { name: "Free Bus Pass (1 Day)", description: "A one-day public transport pass.", cost: 300, icon: "🚌" },
  { name: "₹50 Grocery Coupon", description: "A community partner grocery coupon.", cost: 500, icon: "🛍️" },
];
