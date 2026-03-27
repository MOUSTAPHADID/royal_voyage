# Amadeus Flight Create Orders API - Notes

## 3-Step Process for Real PNR:
1. **Flight Offers Search** - Already implemented in server/amadeus.ts
2. **Flight Offers Price** - Need to add (confirms/reprices the offer)
3. **Flight Create Orders** - Need to add (creates booking, returns PNR)

## Node.js SDK Methods (from types/amadeus.d.ts):
- `amadeus.shopping.flightOffers.pricing.post(body)` - Step 2: Price confirmation
- `amadeus.booking.flightOrders.post(body)` - Step 3: Create order/PNR

## Flight Offers Price Request:
```json
{
  "data": {
    "type": "flight-offers-pricing",
    "flightOffers": [rawOffer]  // The raw offer from search
  }
}
```

## Flight Create Orders Request:
```json
{
  "data": {
    "type": "flight-order",
    "flightOffers": [pricedOffer],  // From pricing step
    "travelers": [{
      "id": "1",
      "dateOfBirth": "1990-01-01",
      "name": { "firstName": "JOHN", "lastName": "DOE" },
      "gender": "MALE",
      "contact": {
        "emailAddress": "john@example.com",
        "phones": [{
          "deviceType": "MOBILE",
          "countryCallingCode": "222",
          "number": "33700000"
        }]
      }
    }],
    "remarks": {
      "general": [{
        "subType": "GENERAL_MISCELLANEOUS",
        "text": "ONLINE BOOKING FROM ROYAL VOYAGE"
      }]
    },
    "ticketingAgreement": {
      "option": "DELAY_TO_CANCEL",
      "delay": "6D"
    },
    "contacts": [{
      "addresseeName": { "firstName": "ROYAL", "lastName": "VOYAGE" },
      "purpose": "STANDARD",
      "emailAddress": "royal-voyage@gmail.com",
      "phones": [{
        "deviceType": "MOBILE",
        "countryCallingCode": "222",
        "number": "33700000"
      }],
      "address": {
        "lines": ["Tavragh Zeina"],
        "cityName": "Nouakchott",
        "countryCode": "MR"
      }
    }]
  }
}
```

## Response contains:
- `data.associatedRecords[0].reference` → This is the PNR (6-char code)
- `data.id` → Order ID
- `data.flightOffers` → Confirmed offers

## Key Notes:
- rawOffer from search must be stored and passed through pricing → booking
- In test environment, PNR is generated but not a real airline reservation
- In production, it creates a real PNR on the airline's GDS
- ticketingAgreement.delay controls how long before auto-cancel (6D = 6 days)
