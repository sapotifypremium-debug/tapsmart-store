# TapSmart Online Store

Next.js 14 · TypeScript · Tailwind · Supabase. Separate from your NFC management platform: it uses its own Supabase project and shares nothing with it.

## 1. Install
```bash
npm install
cp .env.example .env.local
```

## 2. Supabase (use a NEW project)
1. supabase.com → New project.
2. SQL Editor → paste `supabase/schema.sql` → Run. It creates `settings` and `orders` with RLS on and no public policies.
3. Project Settings → API: copy the Project URL and the `service_role` key into `.env.local`.
4. Set `ADMIN_PASSWORD` (long) and `ADMIN_SESSION_SECRET` (`openssl rand -hex 32`).
The service-role key is used only in server code (API routes / server components). Never add `NEXT_PUBLIC_` to it.

## 3. Run and test locally
```bash
npm run dev     # http://localhost:3000
npm run build   # production check
```
1. Open `/admin/login` → sign in → Settings. Set the **UPI ID**, **delivery charge** (0 for free) and check prices, then Save. Until delivery and UPI are set, checkout stays disabled on purpose.
2. On the home page: pick a quantity, Add to Cart, fill the form, enter a test UTR (8–22 letters/digits), Place order.
3. Confirm the order appears in `/admin`, WhatsApp opens with the prefilled message, and you can verify payment and change status.
Check: 10 → ₹2,990 · 20 → ₹5,700 · 50 → ₹12,500 · 100 → ₹20,000 (+ delivery). 51–99 and 101+ show Contact for Bulk Pricing.

## 4. Deploy to Vercel (only when you decide to)
Push to GitHub → vercel.com → Import → add the 4 env vars from `.env.example` (URL, service-role key, admin password, session secret) → Deploy.

## 5. Still needs your real details
- **UPI payment QR image**: the payment section shows a placeholder. Put your real UPI QR in `public/` and set `PAYMENT_QR` at the top of `components/Store.tsx` (e.g. `"/payment-qr.png"`).
- **UPI ID**: left blank on purpose. Enter it in Admin → Settings.
- **Delivery charge**: not invented; set in Admin → Settings.
- **Product card image**: the hero uses a labelled placeholder. Send your card artwork.
- **Videos and testimonials**: placeholders only; no fake reviews.
- **Supabase keys and admin password** (env vars).
- `public/scanner-qr.jpg` is your NFC scanner QR. It is shown only in the "Scan the QR code" panel, never in payments.
