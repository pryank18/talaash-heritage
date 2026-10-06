// Storefront configuration. Everything in this file is public by design:
// it ships to every visitor's browser. Never put a secret key here.
//
// Leave supabaseUrl empty to run in DEMO MODE: the catalogue loads from
// data/products.json, registrations stay in this browser only, and checkout
// creates a pretend order. Fill both Supabase values to go live.

export const CONFIG = {
  // --- Supabase (Project settings > API) ---------------------------------
  supabaseUrl: "https://qeaoamlowfrljkayzulq.supabase.co",          // e.g. "https://abcdefghijkl.supabase.co"
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlYW9hbWxvd2ZybGprYXl6dWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMTA3MjYsImV4cCI6MjEwNjg4NjcyNn0.0qQj3l1V_KR3Svutf2JoyMNJIjEzlRnys0YmraxiQ0w",      // the anon / publishable key, NOT the secret one

  // --- Registration gate ---------------------------------------------------
  // "hard"     every visitor must register before seeing any page
  // "soft"     the form opens on arrival but can be closed; required at checkout
  // "checkout" no prompt while browsing; required at checkout
  gateMode: "hard",
  // Pages a visitor can always read without registering. Consent is only
  // valid if people can read the privacy notice before they agree to it.
  gateExemptPages: [
    "privacy.html", "terms.html", "shipping-returns.html", "contact.html",
    "sell.html", "seller.html", "admin.html",
  ],
  // Bump this when the consent wording or privacy notice changes; it is
  // stored with every registration.
  consentVersion: "2026-10-v1",
  defaultCountry: "India",
  defaultDialCode: "+91",

  // --- Payments -----------------------------------------------------------
  // Listed in the order shown at checkout. The first one is preselected.
  //   "upi"       buyer pays your UPI ID directly. No fees, no gateway, no
  //               server. You confirm each payment yourself.
  //   "whatsapp"  order is saved and the buyer messages you to arrange payment.
  //   "razorpay"  cards, netbanking and UPI through Razorpay, confirmed
  //               automatically. About 2% per sale. Needs docs/SETUP.md part B.
  paymentMethods: ["upi", "whatsapp"],
  // Where UPI payments go. A business UPI ID works best: some apps refuse
  // link and QR payments to personal IDs.
  upiId: "7397829282@ybl",                           // e.g. "talaashheritage@okhdfcbank"
  upiName: "Talaash Heritage",         // name shown in the buyer's UPI app

  // --- Partners ------------------------------------------------------------
  // Shown on the "Sell with us" page. Set each partner's actual rate in the
  // admin page when you approve them.
  partnerCommissionPct: 20,
  partnerTermsVersion: "seller-2026-10-v1",

  // Shows a bar saying the listings are examples. Turn off once real
  // listings are in.
  sampleNotice: true,

  // --- Business details ----------------------------------------------------
  brand: "Talaash Heritage",
  contactEmail: "talaashheritage@gmail.com",
  contactPhone: "+91 7397829282",
  whatsappNumber: "917397829282",       // digits only, with country code
  instagram: "https://www.instagram.com/talaashheritage/",
  // Path to your logo file, e.g. "assets/img/logo.png". Empty shows the
  // तलाश wordmark instead.
  logo: "",

  // --- Display only. The server recalculates all money. --------------------
  currency: "INR",
  shipping: { flat_paise: 8000, free_above_paise: 150000, countries: ["India"] },
};

export const isLive = () => Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
