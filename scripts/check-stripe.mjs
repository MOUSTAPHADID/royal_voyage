const key = process.env.STRIPE_SECRET_KEY;
console.log("STRIPE_SECRET_KEY exists:", !!key);
if (key) {
  console.log("prefix:", key.substring(0, 12));
}
