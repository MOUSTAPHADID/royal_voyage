/**
 * Script to verify a custom Amadeus Office ID status
 */

const TARGET_OFFICE_ID = "NKC26203";

async function checkOfficeId() {
  const clientId = process.env.AMADEUS_PROD_CLIENT_ID || process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_PROD_CLIENT_SECRET || process.env.AMADEUS_CLIENT_SECRET;
  const officeId = TARGET_OFFICE_ID;

  const isProd = !!(process.env.AMADEUS_PROD_CLIENT_ID && process.env.AMADEUS_PROD_CLIENT_SECRET);
  const baseUrl = isProd ? "https://api.amadeus.com" : "https://test.api.amadeus.com";

  console.log("=== Amadeus Office ID Verification ===");
  console.log(`Office ID: ${officeId}`);
  console.log(`Environment: ${isProd ? "PRODUCTION" : "TEST"}`);
  console.log(`API Base URL: ${baseUrl}`);
  console.log("");

  if (!clientId || !clientSecret) {
    console.error("❌ Amadeus credentials not found");
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
    console.log(`   Application: ${authData.application_name || "N/A"}`);
    console.log("");

    // Step 2: Office ID format verification
    console.log("Step 2: Office ID format verification...");
    // Standard IATA Office ID: 3 letters (city) + 5 digits + 1 letter
    const fullPattern = /^[A-Z]{3}\d{5}[A-Z]$/;
    // Some Office IDs may be shorter (3 letters + 5 digits without check char)
    const shortPattern = /^[A-Z]{3}\d{5}$/;
    
    const isFullFormat = fullPattern.test(officeId);
    const isShortFormat = shortPattern.test(officeId);
    const isValidFormat = isFullFormat || isShortFormat;
    
    console.log(`   Office ID: ${officeId}`);
    console.log(`   Length: ${officeId.length} characters`);
    
    if (isFullFormat) {
      console.log(`   Format: ✅ Standard IATA (9 chars: CCC#####X)`);
      const cityCode = officeId.substring(0, 3);
      const numericPart = officeId.substring(3, 8);
      const checkChar = officeId.substring(8, 9);
      console.log(`   City code: ${cityCode} (Nouakchott)`);
      console.log(`   Numeric ID: ${numericPart}`);
      console.log(`   Check character: ${checkChar}`);
    } else if (isShortFormat) {
      console.log(`   Format: ⚠️ Short IATA (8 chars: CCC##### — missing check character)`);
      const cityCode = officeId.substring(0, 3);
      const numericPart = officeId.substring(3, 8);
      console.log(`   City code: ${cityCode} (Nouakchott)`);
      console.log(`   Numeric ID: ${numericPart}`);
      console.log(`   Note: Standard IATA Office IDs are 9 characters (e.g., NKC26203A)`);
    } else {
      console.log(`   Format: ❌ Non-standard`);
    }
    console.log("");

    // Step 3: Test with flight search using Ama-Client-Ref header
    console.log("Step 3: Testing Office ID with flight search (Ama-Client-Ref)...");
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateStr = futureDate.toISOString().split("T")[0];

    const searchUrl = `${baseUrl}/v2/shopping/flight-offers?originLocationCode=NKC&destinationLocationCode=CDG&departureDate=${dateStr}&adults=1&max=1`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Ama-Client-Ref": officeId,
      },
    });

    const searchData = await searchRes.json();

    if (searchRes.ok) {
      console.log("✅ Flight search successful with this Office ID");
      console.log(`   Results found: ${searchData.data?.length || 0}`);
      if (searchData.data?.[0]) {
        console.log(`   Source: ${searchData.data[0].source}`);
        console.log(`   Airline: ${searchData.data[0].validatingAirlineCodes?.join(", ")}`);
      }
    } else {
      console.log(`⚠️  Flight search status: ${searchRes.status}`);
      if (searchData.errors) {
        searchData.errors.forEach((e: any, i: number) => {
          console.log(`   Error ${i + 1}: [${e.code}] ${e.title} — ${e.detail || ""}`);
        });
      }
    }
    console.log("");

    // Step 4: Test with pricing using this Office ID
    console.log("Step 4: Testing Office ID with pricing...");
    if (searchData.data?.[0]) {
      const offer = searchData.data[0];
      const priceRes = await fetch(`${baseUrl}/v1/shopping/flight-offers/pricing`, {
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
        console.log("✅ Pricing successful with this Office ID");
        const pricedOffer = priceData.data?.flightOffers?.[0];
        if (pricedOffer) {
          console.log(`   Total price: ${pricedOffer.price?.total} ${pricedOffer.price?.currency}`);
          console.log(`   Source: ${pricedOffer.source}`);
        }
      } else {
        console.log(`⚠️  Pricing status: ${priceRes.status}`);
        if (priceData.errors) {
          priceData.errors.forEach((e: any, i: number) => {
            console.log(`   Error ${i + 1}: [${e.code}] ${e.title} — ${e.detail || ""}`);
          });
        }
      }
    } else {
      console.log("⏭️  Skipped (no offers available)");
    }
    console.log("");

    // Step 5: Try creating a test order with queuingOfficeId to see if it's recognized
    console.log("Step 5: Testing Office ID as queuingOfficeId (order context)...");
    if (searchData.data?.[0]) {
      const offer = searchData.data[0];
      // We'll attempt a flight order creation with this office ID
      // This will likely fail (we don't want to actually book) but the error will tell us
      // if the Office ID is recognized
      const orderRes = await fetch(`${baseUrl}/v1/booking/flight-orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            type: "flight-order",
            flightOffers: [offer],
            travelers: [{
              id: "1",
              dateOfBirth: "1990-01-01",
              name: { firstName: "TEST", lastName: "VERIFICATION" },
              gender: "MALE",
              contact: {
                emailAddress: "test@test.com",
                phones: [{ deviceType: "MOBILE", countryCallingCode: "222", number: "33700000" }],
              },
              documents: [{
                documentType: "PASSPORT",
                birthPlace: "Nouakchott",
                issuanceLocation: "Nouakchott",
                issuanceDate: "2020-01-01",
                number: "TEST12345",
                expiryDate: "2030-01-01",
                issuanceCountry: "MR",
                validityCountry: "MR",
                nationality: "MR",
                holder: true,
              }],
            }],
            remarks: { general: [{ subType: "GENERAL_MISCELLANEOUS", text: "OFFICE ID VERIFICATION TEST" }] },
            ticketingAgreement: { option: "DELAY_TO_CANCEL", dateTime: futureDate.toISOString().split("T")[0] },
            contacts: [{
              addresseeName: { firstName: "TEST", lastName: "VERIFICATION" },
              purpose: "STANDARD",
              phones: [{ deviceType: "MOBILE", countryCallingCode: "222", number: "33700000" }],
              emailAddress: "test@test.com",
            }],
            queuingOfficeId: officeId,
          },
        }),
      });

      const orderData = await orderRes.json();

      if (orderRes.ok) {
        console.log("✅ Office ID accepted as queuingOfficeId");
        console.log(`   Order created (PNR): ${orderData.data?.associatedRecords?.[0]?.reference || "N/A"}`);
        console.log(`   ⚠️ NOTE: A test order was created — you may want to cancel it`);
        if (orderData.data?.id) {
          console.log(`   Order ID: ${orderData.data.id}`);
          // Try to cancel it
          console.log("   Attempting to cancel test order...");
          const cancelRes = await fetch(`${baseUrl}/v1/booking/flight-orders/${orderData.data.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (cancelRes.ok || cancelRes.status === 204) {
            console.log("   ✅ Test order cancelled successfully");
          } else {
            console.log(`   ⚠️ Cancel status: ${cancelRes.status} — please cancel manually`);
          }
        }
      } else {
        // Check if the error is about the Office ID specifically
        const errors = orderData.errors || [];
        const officeIdError = errors.find((e: any) =>
          (e.detail || "").toLowerCase().includes("office") ||
          (e.detail || "").toLowerCase().includes("queuing") ||
          (e.code || "") === "37"
        );

        if (officeIdError) {
          console.log("❌ Office ID NOT recognized as valid queuingOfficeId");
          console.log(`   Error: [${officeIdError.code}] ${officeIdError.title} — ${officeIdError.detail || ""}`);
        } else {
          // Other errors (e.g., pricing expired) — Office ID might still be valid
          console.log(`⚠️  Order creation failed (status ${orderRes.status}) — but not necessarily due to Office ID`);
          errors.forEach((e: any, i: number) => {
            console.log(`   Error ${i + 1}: [${e.code}] ${e.title} — ${e.detail || ""}`);
          });
        }
      }
    } else {
      console.log("⏭️  Skipped (no offers available)");
    }
    console.log("");

    // Summary
    console.log("=== SUMMARY for Office ID: " + officeId + " ===");
    console.log(`Format: ${isFullFormat ? "✅ Standard IATA (9 chars)" : isShortFormat ? "⚠️ Short format (8 chars — may need check character)" : "❌ Non-standard"}`);
    console.log(`Authentication: ✅ Working`);
    console.log(`Flight Search: ${searchRes.ok ? "✅ Working" : "⚠️ Issues detected"}`);
    console.log(`Environment: ${isProd ? "🟢 PRODUCTION" : "🟡 TEST"}`);

  } catch (err: any) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

checkOfficeId();
