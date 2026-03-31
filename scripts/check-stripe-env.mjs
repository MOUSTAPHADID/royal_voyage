import { config } from "dotenv";
config();

const sk = process.env.STRIPE_SECRET_KEY;
const pk = process.env.STRIPE_PUBLISHABLE_KEY;

console.log("STRIPE_SECRET_KEY:", sk ? sk.substring(0, 12) + "..." : "MISSING");
console.log("STRIPE_PUBLISHABLE_KEY:", pk ? pk.substring(0, 12) + "..." : "MISSING");
