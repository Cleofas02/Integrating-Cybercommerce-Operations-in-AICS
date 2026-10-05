// Mock data. The menu moves to the database next.
export const CATEGORIES = ["All", "Meals", "Snacks", "Drinks", "Events & Fees"];

export const ITEMS = [
  { id: 1, name: "Chicken Adobo Rice", category: "Meals", price: 55, emoji: "🍛" },
  { id: 2, name: "Pork Sinigang Bowl", category: "Meals", price: 60, emoji: "🍲" },
  { id: 3, name: "Egg Sandwich", category: "Snacks", price: 25, emoji: "🥪" },
  { id: 4, name: "Banana Cue", category: "Snacks", price: 15, emoji: "🍌" },
  { id: 5, name: "Iced Tea", category: "Drinks", price: 20, emoji: "🧋" },
  { id: 6, name: "Buko Juice", category: "Drinks", price: 25, emoji: "🥥" },
  { id: 7, name: "Intramurals Ticket", category: "Events & Fees", price: 50, emoji: "🎟️" },
  { id: 8, name: "Class T-shirt Fee", category: "Events & Fees", price: 250, emoji: "👕" },
];

// ref = the reference number printed on the student's ticket (second check at the counter)
export const MOCK_ORDERS = [
  { id: "ORD-1001", ref: "482915", buyer: "Ana R.", total: 80, status: "Preparing" },
  { id: "ORD-1002", ref: "730164", buyer: "Miguel T.", total: 115, status: "Ready" },
  { id: "ORD-1003", ref: "259048", buyer: "Joy S.", total: 30, status: "Claimed" },
];

export const MOCK_SALES = [
  { day: "Mon", total: 420 },
  { day: "Tue", total: 380 },
  { day: "Wed", total: 560 },
  { day: "Thu", total: 510 },
];
