# Connecting Razorpay

The website side is finished: checkout opens Razorpay, and three server
functions in `supabase/functions` create the payment, verify it and receive
Razorpay's confirmation. What is left is accounts and keys, done once.

The Key Secret and the webhook secret go only into Supabase secrets. Never put
them in `site/assets/js/config.js`, which anyone can read.

## 1. Razorpay account

1. Sign up at https://dashboard.razorpay.com as a **Proprietorship**, in the name
   the GST registration uses (NiiblingNuts).
2. KYC needs: the proprietor's PAN, the GSTIN (or another business proof), a
   bank account for settlements, and the website address
   `https://talaash-heritage.pages.dev`.
3. Razorpay checks that the site shows Terms, Privacy, Cancellation and refund,
   and Contact pages, and that the business name on them matches KYC. The pages
   exist; the seller line on Terms and Contact must name the proprietorship
   (legal name, GSTIN, address) before you submit.
4. Test mode works before KYC is approved. Use it first.

## 2. Keys

In Razorpay: Account & Settings > API Keys > Generate key (test mode first).
You get a **Key ID** (`rzp_test_...`) and a **Key Secret**, shown once.

## 3. Database (once)

Supabase > SQL Editor > New query: paste `supabase/migrations/20261015_razorpay.sql`
and Run. The last table it prints should say OK on every line.

## 4. The three functions

Supabase > Edge Functions > Deploy a new function > Via editor. Do this three
times, with these exact names, pasting the matching file from `supabase/paste/`:

| Name               | File                               |
|--------------------|------------------------------------|
| `create-order`     | `supabase/paste/create-order.ts`     |
| `verify-payment`   | `supabase/paste/verify-payment.ts`   |
| `razorpay-webhook` | `supabase/paste/razorpay-webhook.ts` |

For each, open its settings and turn **off** "Verify JWT" (Enforce JWT
verification). The site sends no login, and Razorpay sends none either. Each
function checks Razorpay's signature itself.

(With the Supabase CLI instead: `supabase functions deploy --project-ref qeaoamlowfrljkayzulq`
from the repo root; `supabase/config.toml` already turns the JWT check off.)

## 5. Secrets

Supabase > Edge Functions > Secrets, add:

| Name                      | Value                                     |
|---------------------------|-------------------------------------------|
| `RAZORPAY_KEY_ID`         | the Key ID                                |
| `RAZORPAY_KEY_SECRET`     | the Key Secret                            |
| `RAZORPAY_WEBHOOK_SECRET` | any long random text you choose (step 6)  |
| `SITE_ORIGIN`             | `https://talaash-heritage.pages.dev`      |

## 6. Webhook

Razorpay > Account & Settings > Webhooks > Add new webhook:

- URL: `https://qeaoamlowfrljkayzulq.supabase.co/functions/v1/razorpay-webhook`
- Secret: the same text as `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured` and `order.paid`

This confirms the order even if the buyer closes the tab right after paying.

## 7. Switch it on

In `site/assets/js/config.js` set
`paymentMethods: ["razorpay", "upi", "whatsapp"]` (the first is preselected)
and push. Then, in test mode, put a dated listing in the cart, pay with
Razorpay's test card or test UPI ID, and check that the order page turns to paid
and the order shows as paid in Admin.

## 8. Going live

When KYC is approved, generate **live** keys, replace `RAZORPAY_KEY_ID` and
`RAZORPAY_KEY_SECRET` in Supabase secrets, and add the same webhook in live mode
(test and live webhooks are separate). Nothing on the site changes.

## How it works

1. Checkout calls `create-order`. It creates the order through the same
   `create_order` database function as UPI orders (so prices, seats and the rate
   limit are checked by the database), then opens a Razorpay order for the
   database's total.
2. The buyer pays in Razorpay's window.
3. `verify-payment` (from the browser) and `razorpay-webhook` (from Razorpay)
   each check the signature, fetch the payment from Razorpay, compare the amount
   with the order, and mark it paid. Whichever arrives second does nothing.

After editing anything in `supabase/functions`, run
`python3 tools/bundle_functions.py` to refresh `supabase/paste/`.
