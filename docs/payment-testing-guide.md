# Paytrail Payment Testing Guide

## Overview
TehtäväMestari uses Paytrail's test environment with the following test credentials:
- **Merchant ID**: 375917
- **Secret Key**: SAIPPUAKAUPPIAS

## Test Environment Features
- ✅ Real payment flow simulation
- ✅ Webhook callback testing  
- ✅ All Finnish payment methods (test mode)
- ✅ Mobile payment simulation
- ✅ Bank payment simulation

## Manual Testing Steps

### 1. Create Test Task (Open Posting)
1. Navigate to `/book-task`
2. Select category and fill task details
3. Choose "Open Posting" option
4. Submit task (will be pending admin review)
5. As admin, approve the task in database or admin panel

### 2. Make Tasker Offer
1. Sign in as tasker account
2. Navigate to map view or task listing
3. Find the approved open task
4. Click task and make an offer
5. Verify offer appears in task details

### 3. Accept Offer and Test Payment
1. Sign in as task owner (user)
2. Go to task details page
3. View offers and click "Hyväksy ja maksa" 
4. Verify redirect to Paytrail test environment
5. Complete payment using test payment methods

### 4. Test Payment Methods Available
- **Bank payments**: All major Finnish banks (test mode)
- **Mobile payments**: MobilePay, Pivo (test mode)
- **Cards**: Visa, Mastercard test cards
- **Digital wallets**: Apple Pay, Google Pay (test mode)

### 5. Verify Payment Completion
1. After payment, verify redirect back to task page
2. Check task status changed to "paid"
3. Verify tasker assignment
4. Check initial message created in chat
5. Verify payment record in database

## Test Credit Cards
Paytrail test environment accepts these test cards:

```
Visa: 4925 0000 0000 0004
Mastercard: 5413 0000 0000 0000
Expiry: Any future date
CVC: Any 3 digits
```

## Payment Simulation (Development Only)
For faster testing during development, use the simulation endpoint:

```bash
curl -X POST http://localhost:9002/api/paytrail-callback/simulate \
  -H "Content-Type: application/json" \
  -d '{"taskId": "your-task-id-here"}'
```

## Automated Testing
Run the automated payment flow test:

```bash
npx ts-node scripts/test-payment-flow.ts
```

This script:
- Creates test users (customer + tasker)
- Creates and approves a test task
- Makes a tasker offer
- Simulates payment completion
- Verifies all status updates
- Cleans up test data

## Webhook Testing
Paytrail sends webhooks to:
- Success: `/api/paytrail-callback`
- Cancel: `/api/paytrail-callback`

Both GET and POST methods are supported for maximum compatibility.

## Common Test Scenarios

### Successful Payment Flow
1. ✅ Task created with open posting
2. ✅ Admin approves task → status becomes "open"
3. ✅ Tasker makes offer → offer status "pending"
4. ✅ User accepts offer → offer status "accepted", payment created
5. ✅ Payment completed → task status "paid", tasker assigned
6. ✅ Initial chat message created

### Payment Cancellation
1. User reaches Paytrail payment page
2. User cancels/closes payment
3. Verify redirect back to task page
4. Verify task status remains unchanged
5. Verify offer can be re-attempted

### Counter Offer Flow
1. User makes counter offer instead of accepting
2. Tasker accepts counter offer
3. Payment flow proceeds with counter offer amount
4. Verify final price matches counter offer

## Environment Configuration
Ensure these variables are set in `.env.local`:

```bash
PAYTRAIL_MERCHANT_ID=375917
PAYTRAIL_SECRET_KEY=SAIPPUAKAUPPIAS
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

## Production Notes
- ⚠️ Never use test credentials in production
- 🔒 Real Paytrail credentials must be configured for production
- 📧 Real merchant agreement required with Paytrail
- 💰 Real transaction fees apply in production

## Troubleshooting

### Payment Callback Issues
- Check webhook URL is accessible
- Verify HMAC signature validation
- Check payment ID (stamp) matches database
- Verify task ID (reference) is correct

### Status Update Issues
- Check database foreign key constraints
- Verify user permissions for updates
- Check task offer acceptance logic
- Verify tasker assignment logic

### Redirect Issues
- Check return URLs in payment creation
- Verify base URL configuration
- Check URL parameter handling