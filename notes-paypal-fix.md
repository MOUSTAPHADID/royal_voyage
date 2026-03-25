# PayPal Fix Notes

## Problem from screenshot:
- The PayPal hosted button renders with an empty EUR amount field
- Customer sees "Preencha quanto pretende pagar" (Fill in how much you want to pay) - meaning the amount is NOT pre-filled
- The amount box shows "USD 475.32" but the PayPal button below shows EUR with empty field
- The hosted button (HS2AES3UYJHQA) doesn't support pre-filling amounts programmatically

## Solution:
- Replace PayPal Hosted Buttons with PayPal JavaScript SDK (Orders API) which allows setting amount programmatically
- Use `paypal.Buttons()` with `createOrder` callback to set exact amount
- This way the customer clicks "Pay" and the amount is already set - no manual entry needed
