/**
 * Verify Amadeus API environment (Production vs Test)
 */
import "dotenv/config";

async function main() {
  console.log("=== التحقق من بيئة Amadeus API ===\n");

  // 1. Check environment variables
  const prodId = process.env.AMADEUS_PROD_CLIENT_ID;
  const prodSecret = process.env.AMADEUS_PROD_CLIENT_SECRET;
  const testId = process.env.AMADEUS_CLIENT_ID;
  const testSecret = process.env.AMADEUS_CLIENT_SECRET;
  const officeId = process.env.AMADEUS_OFFICE_ID;

  console.log("📋 المتغيرات البيئية:");
  console.log(`  AMADEUS_PROD_CLIENT_ID: ${prodId ? "✅ موجود (" + prodId.substring(0, 8) + "...)" : "❌ غير موجود"}`);
  console.log(`  AMADEUS_PROD_CLIENT_SECRET: ${prodSecret ? "✅ موجود" : "❌ غير موجود"}`);
  console.log(`  AMADEUS_CLIENT_ID (test): ${testId ? "✅ موجود (" + testId.substring(0, 8) + "...)" : "❌ غير موجود"}`);
  console.log(`  AMADEUS_CLIENT_SECRET (test): ${testSecret ? "✅ موجود" : "❌ غير موجود"}`);
  console.log(`  AMADEUS_OFFICE_ID: ${officeId ? "✅ " + officeId : "❌ غير موجود"}`);

  // 2. Determine which credentials will be used
  const isProd = !!(prodId && prodSecret);
  const clientId = isProd ? prodId : testId;
  const clientSecret = isProd ? prodSecret : testSecret;
  const baseUrl = isProd ? "https://api.amadeus.com" : "https://test.api.amadeus.com";

  console.log(`\n🌐 البيئة المستخدمة: ${isProd ? "🟢 PRODUCTION (api.amadeus.com)" : "🟡 TEST (test.api.amadeus.com)"}`);
  console.log(`  Base URL: ${baseUrl}`);

  if (!clientId || !clientSecret) {
    console.log("\n❌ لا توجد مفاتيح API صالحة!");
    return;
  }

  // 3. Authenticate
  console.log("\n🔐 محاولة المصادقة...");
  try {
    const authRes = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      console.log(`  ❌ فشل المصادقة: ${authRes.status} ${authRes.statusText}`);
      console.log(`  ${errText}`);
      return;
    }

    const authData = await authRes.json() as any;
    const token = authData.access_token;
    console.log(`  ✅ المصادقة ناجحة!`);
    console.log(`  اسم التطبيق: ${authData.application_name || "غير متوفر"}`);
    console.log(`  نوع التطبيق: ${authData.type || "غير متوفر"}`);
    console.log(`  Client ID: ${authData.client_id || clientId}`);
    console.log(`  صلاحية Token: ${authData.expires_in} ثانية`);

    // 4. Test a real API call
    console.log("\n✈️ اختبار البحث عن رحلات (NKC → CDG)...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const searchRes = await fetch(
      `${baseUrl}/v2/shopping/flight-offers?originLocationCode=NKC&destinationLocationCode=CDG&departureDate=${dateStr}&adults=1&max=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json() as any;
      const offers = searchData.data || [];
      if (offers.length > 0) {
        const offer = offers[0];
        const source = offer.source || "unknown";
        const carrier = offer.validatingAirlineCodes?.[0] || "unknown";
        const price = offer.price?.total || "unknown";
        const currency = offer.price?.currency || "unknown";
        console.log(`  ✅ نتائج البحث: ${offers.length} عرض`);
        console.log(`  المصدر: ${source}`);
        console.log(`  شركة الطيران: ${carrier}`);
        console.log(`  السعر: ${price} ${currency}`);
        
        if (source === "GDS") {
          console.log(`  ✅ المصدر GDS — يؤكد أن الاتصال عبر نظام التوزيع العالمي`);
        }
      } else {
        console.log(`  ⚠️ لا توجد نتائج (قد يكون التاريخ غير متاح)`);
      }
    } else {
      const errText = await searchRes.text();
      console.log(`  ❌ فشل البحث: ${searchRes.status}`);
      console.log(`  ${errText.substring(0, 200)}`);
    }

    // 5. Verify the URL being used
    console.log("\n📊 الخلاصة:");
    console.log("  ┌──────────────────────────────────────────┐");
    if (isProd) {
      console.log("  │  🟢 Amadeus PRODUCTION API مفعّل          │");
      console.log("  │  Base URL: api.amadeus.com               │");
      console.log("  │  ✅ هذه بيانات حقيقية وليست تجريبية       │");
    } else {
      console.log("  │  🟡 Amadeus TEST API مفعّل                │");
      console.log("  │  Base URL: test.api.amadeus.com          │");
      console.log("  │  ⚠️ هذه بيانات تجريبية وليست حقيقية       │");
    }
    console.log(`  │  Office ID: ${officeId || "غير محدد"}                  │`);
    console.log("  └──────────────────────────────────────────┘");

  } catch (err: any) {
    console.log(`  ❌ خطأ: ${err.message}`);
  }
}

main();
