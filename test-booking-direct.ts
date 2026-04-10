import { searchFlights, getCachedRawOffer, priceFlightOffer, createFlightOrder } from './server/amadeus';

async function test() {
  console.log('=== Test: Search NKC → CDG ===');
  const offers = await searchFlights({
    originCode: 'NKC',
    destinationCode: 'CDG',
    departureDate: '2026-05-20',
    adults: 1,
    children: 0,
    infants: 0,
    travelClass: 'ECONOMY',
    max: 1,
  });
  console.log('Offers count:', offers.length);
  if (offers.length === 0) {
    console.log('No offers found');
    return;
  }
  
  const best = offers[0];
  console.log('Best offer ID:', best.id);
  console.log('Price:', best.price, best.currency);
  
  console.log('\n=== Test: Get Cached Offer ===');
  const cached = getCachedRawOffer(best.id);
  console.log('Cached offer:', cached ? 'FOUND' : 'NOT FOUND');
  
  if (!cached) {
    console.log('ERROR: Offer not cached!');
    return;
  }
  
  console.log('\n=== Test: Price Offer ===');
  try {
    const priced = await priceFlightOffer(cached);
    console.log('Priced offer:', priced ? 'OK' : 'FAILED');
    
    console.log('\n=== Test: Create Order (REAL BOOKING) ===');
    console.log('WARNING: This creates a real booking in Amadeus Production!');
    
    const travelers = [{
      id: '1',
      dateOfBirth: '1990-01-15',
      firstName: 'TEST',
      lastName: 'PASSENGER',
      gender: 'MALE' as const,
      email: 'royal-voyage@gmail.com',
      phone: '33700000',
      countryCallingCode: '222',
    }];
    
    const order = await createFlightOrder(priced.pricedOffer, travelers);
    console.log('\n✅ Order created successfully!');
    console.log('PNR:', order.pnr);
    console.log('Order ID:', order.orderId);
    console.log('Ticketing Deadline:', order.ticketingDeadline);
    console.log('Associated Records:', JSON.stringify(order.associatedRecords, null, 2));
    
  } catch (err: any) {
    console.error('\n❌ Error:', err?.message || err);
    if (err?.response?.result) {
      console.error('Amadeus API Error:', JSON.stringify(err.response.result, null, 2));
    }
    if (err?.errors) {
      console.error('Errors:', JSON.stringify(err.errors, null, 2));
    }
  }
}

test().catch(e => {
  console.error('Unhandled error:', e?.message || e);
  process.exit(1);
});
