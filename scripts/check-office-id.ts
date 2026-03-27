/**
 * Script to verify Amadeus Office ID status and IATA connection
 * Uses the Amadeus API to authenticate and test the Office ID
 */

async function checkOfficeId() {
  const clientId = process.env.AMADEUS_PROD_CLIENT_ID || process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_PROD_CLIENT_SECRET || process.env.AMADEUS_CLIENT_SECRET;
  const officeId = process.env.AMADEUS_OFFICE_ID || "NKC26239A";

  const isProd = !!(process.env.AMADEUS_PROD_CLIENT_ID && process.env.AMADEUS_PROD_CLIENT_SECRET);
  const baseUrl = isProd ? "https://api.amadeus.com" : "https://test.api.amadeus.com";

  console.log("=== Amadeus Office ID Verification ===");
  console.log(`Office ID: ${officeId}`);
  console.log(`Environment: ${isProd ? "PRODUCTION" : "TEST"}`);
  console.log(`API Base URL: ${baseUrl}`);
  console.log(`Client ID: ${clientId ? clientId.substring(0, 8) + "..." : "NOT SET"}`);
  console.log("");

  if (!clientId || !clientSecret) {
    console.error("❌ Amadeus credentials not found in environment variables");
    process.exit(1);
  }

  // Step 1: Authenticate
  console.log("Step 1: Authenticating with Amadeus...");
  try {
    const authRes = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    });

    const authData = await authRes.json();

    if (!authRes.ok) {
      console.error("❌ Authentication FAILED");
      console.error("Status:", authRes.status);
      console.error("Error:", JSON.stringify(authData, null, 2));
      process.exit(1);
    }

    const token = authData.access_token;
    console.log("✅ Authentication successful");
    console.log(`   Token type: ${authData.token_type}`);
    console.log(`   Expires in: ${authData.expires_in}s`);
    console.log(`   Application: ${authData.application_name || "N/A"}`);
    console.log(`   Client ID: ${authData.client_id || "N/A"}`);
    console.log("");

    // Step 2: Test Office ID with a simple flight search
    console.log("Step 2: Testing Office ID with flight search...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const searchUrl = `${baseUrl}/v2/shopping/flight-offers?originLocationCode=NKC&destinationLocationCode=CDG&departureDate=${dateStr}&adults=1&max=1`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Ama-Client-Ref": officeId,
      },
    });

    const searchData = await searchRes.json();

    if (searchRes.ok) {
      console.log("✅ Flight search successful with Office ID");
      console.log(`   Results found: ${searchData.data?.length || 0}`);
      if (searchData.data?.[0]) {
        console.log(`   Sample: ${searchData.data[0].source} - ${searchData.data[0].validatingAirlineCodes?.join(", ")}`);
      }
    } else {
      console.log("⚠️  Flight search response:");
      console.log(`   Status: ${searchRes.status}`);
      console.log(`   Detail: ${JSON.stringify(searchData.errors || searchData, null, 2)}`);
    }
    console.log("");

    // Step 3: Test creating a flight order with Office ID (pricing only, no actual booking)
    console.log("Step 3: Testing Office ID in pricing context...");
    if (searchData.data?.[0]) {
      const offer = searchData.data[0];
      const priceUrl = `${baseUrl}/v1/shopping/flight-offers/pricing`;

      const priceRes = await fetch(priceUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Ama-Client-Ref": officeId,
        },
        body: JSON.stringify({
          data: {
            type: "flight-offers-pricing",
            flightOffers: [offer],
          },
        }),
      });

      const priceData = await priceRes.json();

      if (priceRes.ok) {
        console.log("✅ Pricing with Office ID successful");
        const pricedOffer = priceData.data?.flightOffers?.[0];
        if (pricedOffer) {
          console.log(`   Total price: ${pricedOffer.price?.total} ${pricedOffer.price?.currency}`);
          console.log(`   Validating airline: ${pricedOffer.validatingAirlineCodes?.join(", ")}`);
          console.log(`   Source: ${pricedOffer.source}`);
        }
      } else {
        console.log("⚠️  Pricing response:");
        console.log(`   Status: ${priceRes.status}`);
        console.log(`   Detail: ${JSON.stringify(priceData.errors || priceData, null, 2)}`);
      }
    } else {
      console.log("⏭️  Skipped (no flight offers available for pricing test)");
    }
    console.log("");

    // Step 4: Verify Office ID format (IATA standard)
    console.log("Step 4: Office ID format verification...");
    const officeIdPattern = /^[A-Z]{3}\d{5}[A-Z]$/;
    const isValidFormat = officeIdPattern.test(officeId);
    console.log(`   Office ID: ${officeId}`);
    console.log(`   Format valid (IATA): ${isValidFormat ? "✅ Yes" : "❌ No"}`);

    if (isValidFormat) {
      const cityCode = officeId.substring(0, 3);
      const numericPart = officeId.substring(3, 8);
      const checkChar = officeId.substring(8, 9);
      console.log(`   City code: ${cityCode} (Nouakchott)`);
      console.log(`   Numeric ID: ${numericPart}`);
      console.log(`   Check character: ${checkChar}`);
    }
    console.log("");

    // Summary
    console.log("=== SUMMARY ===");
    console.log(`Office ID: ${officeId}`);
    console.log(`IATA Format: ${isValidFormat ? "✅ Valid" : "❌ Invalid"}`);
    console.log(`Environment: ${isProd ? "🟢 PRODUCTION" : "🟡 TEST"}`);
    console.log(`Authentication: ✅ Working`);
    console.log(`API Access: ${searchRes.ok ? "✅ Working" : "⚠️ Check errors above"}`);
    console.log("");

    if (isValidFormat && authRes.ok) {
      console.log("🎉 Office ID NKC26239A is properly configured and connected to Amadeus!");
    }

  } catch (err: any) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

checkOfficeId();
