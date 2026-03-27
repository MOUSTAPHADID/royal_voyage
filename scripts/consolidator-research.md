# Amadeus Consolidator Research

## How it works (Self-Service API):

1. **Flight Create Orders** creates a PNR on the airline's reservation system
2. The PNR is **automatically queued** to the consolidator for ticket issuance
3. The consolidator issues the ticket on your behalf
4. You can check ticket status via **Flight Order Management API** (GET /v1/booking/flight-orders/{orderId})

## Key points:
- Self-Service users MUST work with an airline consolidator to issue tickets
- No IATA or ARC license needed when using consolidator
- Amadeus has partnered with a "world class consolidator" for Self-Service users
- The `queuingOfficeId` in Flight Create Orders determines which office receives the PNR
- The `ticketingAgreement` field controls ticketing deadline

## consolidator.aero:
- Supports Amadeus, Galileo, Sabre
- Integration with Travel Point
- 24/7 support
- Global Content Provider for Travel Facilitators

## Ticket Issuance Process:
1. Create booking via Flight Create Orders API → get PNR + orderId
2. PNR automatically sent to consolidator (via queuingOfficeId)
3. Consolidator issues e-ticket
4. Check status via Flight Order Management API
5. Ticket number appears in the order when issued

## What Royal Voyage already has:
- Office ID: NKC26239A (already configured)
- Flight Create Orders with queuingOfficeId
- Flight Order Management (get/cancel)
- checkTicketIssuance function

## What needs to be added for Consolidator integration:
- ticketingAgreement configuration in Flight Create Orders
- Queue management (queue PNR to consolidator office)
- Automatic ticket status polling
- Consolidator office ID configuration
