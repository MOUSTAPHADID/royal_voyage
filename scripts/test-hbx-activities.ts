import { searchActivities } from "../server/hbx";

async function main() {
  console.log("[Test] HBX Activities API Key:", process.env.HBX_ACTIVITIES_API_KEY?.slice(0, 8) + "...");
  
  const today = new Date();
  const fromDate = "2026-04-10";
  const toDate = "2026-04-17";
  
  console.log(`[Test] Searching activities in BCN from ${fromDate} to ${toDate}...`);
  
  const activities = await searchActivities({
    destinationCode: "BCN",
    fromDate,
    toDate,
  });
  
  console.log(`[Test] Found ${activities.length} activities`);
  if (activities.length > 0) {
    console.log("[Test] First activity:", JSON.stringify(activities[0], null, 2));
  }
}

main().catch(console.error);
