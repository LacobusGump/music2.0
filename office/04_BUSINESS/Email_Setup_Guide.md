# jim@begump.com — Setup Guide
## Free. Takes 15 minutes.

---

## Step 1: Email Forwarding (receiving mail) — FREE

You have two options depending on where begump.com's DNS lives:

### Option A: Cloudflare Email Routing (if DNS is on Cloudflare)

1. Log into Cloudflare → select begump.com
2. Go to **Email → Email Routing**
3. Click **Add records and enable** (auto-creates MX records)
4. Click **Create address**
5. Custom address: `jim`
6. Destination: `jamesmichaeldrum@gmail.com`
7. Click Save

That's it. Emails to jim@begump.com now land in your Gmail.

### Option B: ImprovMX (if DNS is elsewhere)

1. Go to improvmx.com
2. Enter `begump.com` and `jamesmichaeldrum@gmail.com`
3. It shows you 2 MX records to add to your DNS
4. Add those MX records wherever begump.com's DNS lives (GitHub, Namecheap, GoDaddy, etc.)
5. Wait 5-10 minutes for propagation

Free plan: 1 domain, 25 aliases, 500 emails/day. More than enough.

---

## Step 2: Send FROM jim@begump.com via Gmail — FREE

This lets you compose emails in Gmail that show "From: jim@begump.com" instead of your personal address.

1. In Gmail, click the **gear icon → See all settings → Accounts and Import**
2. Under "Send mail as", click **Add another email address**
3. Name: `James Drum` (or `GUMP` or whatever you want)
4. Email: `jim@begump.com`
5. Uncheck "Treat as an alias" (optional, experiment with what works)
6. Gmail will send a confirmation email to jim@begump.com
7. Since forwarding is set up, the confirmation lands in your Gmail
8. Click the confirmation link
9. Done — now when composing, click "From" to choose jim@begump.com

---

## Step 3: Gmail Labels + Filters

Set up a filter so GUMP emails are instantly organized:

1. In Gmail → Settings → Filters and Blocked Addresses → Create new filter
2. To: `jim@begump.com`
3. Click "Create filter"
4. Apply the label: `GUMP` (create it)
5. Optionally: Star it, Never send to spam

Now all GUMP email is labeled and visible at a glance.

---

## Step 4: Update Everything

Once jim@begump.com is live, update these:

- [ ] begump.com contact info → jim@begump.com
- [ ] Patreon page contact → jim@begump.com
- [ ] TikTok bio → jim@begump.com
- [ ] Press kit → jim@begump.com
- [ ] Grant applications (future) → jim@begump.com
- [ ] Email signup form → from address = jim@begump.com
- [ ] GitHub README → jim@begump.com
- [ ] Who's Who profile → jim@begump.com

---

## Also Create These Aliases

While you're in the forwarding setup, create a few more:

- `jim@begump.com` → main inbox (press, grants, public)
- `james@begump.com` → personal/direct contact
- `press@begump.com` → specifically for journalists
- `hello@begump.com` → friendly catch-all for the site

All forward to jamesmichaeldrum@gmail.com. You can filter them into separate labels later.

---

## Cost: $0/month

- Cloudflare Email Routing: free
- OR ImprovMX free plan: free
- Gmail "Send mail as": free
- Total: **$0**

---

*Set this up before publishing Patreon or starting TikTok Day 1. jim@begump.com on everything from day one looks professional and separates the project from personal email.*
