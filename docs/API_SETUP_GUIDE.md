# 3rd Party API Setup Guide

This guide walks you through setting up all required and optional 3rd party services for TehtäväMestari.

## 🚀 Quick Start Priority

### ✅ Required APIs (Must Configure)
1. **Supabase** - Backend, database, authentication
2. **Google Maps** - Location services and address search

### ⚡ Works Out-of-the-Box (Optional)
3. **Paytrail** - Payment processing (test credentials included)

### 🔧 Optional APIs
4. **GitHub** - Only for AI development tools

---

## 1. Supabase Setup (Required)

**What it does:** Backend database, authentication, real-time features, file storage

### Step 1: Create Supabase Project
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Project Name**: `taskmvp` (or your choice)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to Finland (e.g., `eu-central-1`)
   - **Pricing Plan**: Free tier works for development

### Step 2: Enable PostGIS Extension
1. In your Supabase project, go to **Database** → **Extensions**
2. Search for "postgis"
3. Click **Enable** on `postgis` extension
4. This is required for location-based features

### Step 3: Get API Keys
1. Go to **Settings** → **API**
2. Copy the following values:

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# anon/public key (safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# service_role key (KEEP SECRET - server-side only!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Step 4: Get Access Token (for CLI)
1. Go to [https://app.supabase.com/account/tokens](https://app.supabase.com/account/tokens)
2. Click "Generate new token"
3. Copy the token:

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxx
```

### Step 5: Set Database URL
Use the same as your Supabase URL:

```bash
DATABASE_URL=https://xxxxxxxxxxxxx.supabase.co
```

### Step 6: Run Database Migrations
After setting up Supabase, run the database migrations:

```bash
# See sql/README.md for detailed migration instructions
# Use Supabase dashboard SQL editor to run files from sql/migrations/
```

---

## 2. Google Maps API Setup (Required)

**What it does:** Address autocomplete, location search, map display for taskers

### Step 1: Create Google Cloud Project
1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a Project** → **New Project**
3. Project name: `TehtavaMestari` (or your choice)
4. Click **Create**

### Step 2: Enable Required APIs
1. Go to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - **Maps JavaScript API** (for map display)
   - **Places API** (for address autocomplete)
   - **Geocoding API** (optional but recommended)

### Step 3: Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy your API key
4. Click **Edit API Key** to configure

### Step 4: Configure API Key Restrictions (Important!)
**For Development:**
```
Application restrictions: None
API restrictions:
  ✓ Maps JavaScript API
  ✓ Places API
  ✓ Geocoding API
```

**For Production:**
```
Application restrictions: HTTP referrers (websites)
  Add: https://yourdomain.com/*
  Add: http://localhost:9002/* (for local testing)

API restrictions:
  ✓ Maps JavaScript API
  ✓ Places API
  ✓ Geocoding API
```

### Step 5: Add to .env.local
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 💰 Cost Considerations
- **Free tier**: $200/month credit
- **Places Autocomplete**: ~$2.83 per 1,000 requests
- **Maps JavaScript API**: $2 per 1,000 map loads
- **Tip**: Enable billing alerts to monitor usage

---

## 3. Paytrail Setup (Payment Processing)

**What it does:** Finnish payment gateway (credit cards, mobile payments, bank transfers)

### For Development (Included - No Setup Needed!)
Test credentials are already in `.env.example`:

```bash
PAYTRAIL_MERCHANT_ID=375917
PAYTRAIL_SECRET_KEY=SAIPPUAKAUPPIAS
```

These work out-of-the-box for testing!

### For Production
1. Go to [https://www.paytrail.com](https://www.paytrail.com)
2. Create a merchant account (requires Finnish business registration)
3. Complete verification process
4. Get your production credentials from merchant dashboard
5. Update `.env.local`:

```bash
PAYTRAIL_MERCHANT_ID=your-production-merchant-id
PAYTRAIL_SECRET_KEY=your-production-secret-key
```

### Testing Payments
Use Paytrail test credentials:
- **Test card**: See [Paytrail test credentials](https://docs.paytrail.com/payments/testing/)
- **Webhook testing**: Use ngrok for local development

---

## 4. GitHub Integration (Optional)

**What it does:** Used by AI development tools (Claude Code, GitHub Copilot)

### Create Personal Access Token
1. Go to [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token** → **Generate new token (classic)**
3. Scopes needed:
   - `repo` (if accessing private repos)
   - `read:org` (if needed)
4. Copy token

### Add to .env.local
```bash
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GITHUB_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Note:** Only needed if using AI development tools.

---

## 📋 Complete .env.local Example

```bash
# ============================================================
# SUPABASE (Required)
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxx
DATABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# ============================================================
# APPLICATION
# ============================================================
NEXT_PUBLIC_APP_URL=http://localhost:9002

# ============================================================
# PAYTRAIL (Test credentials - works immediately)
# ============================================================
PAYTRAIL_MERCHANT_ID=375917
PAYTRAIL_SECRET_KEY=SAIPPUAKAUPPIAS

# ============================================================
# GOOGLE MAPS (Required)
# ============================================================
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ============================================================
# OPTIONAL (GitHub for AI development tools only)
# ============================================================
# GITHUB_PERSONAL_ACCESS_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# GITHUB_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## ✅ Verification Checklist

After setup, verify each service:

### Supabase
```bash
# In Supabase SQL Editor, run:
SELECT PostGIS_Version();
# Should return PostGIS version info
```

### Google Maps
```bash
# Start dev server:
npm run dev

# Visit: http://localhost:9002/signup/tasker
# Try typing an address - autocomplete should work
```

### Paytrail
```bash
# Create a test task and try to pay
# You should be redirected to Paytrail test payment page
```

---

## 🔒 Security Best Practices

### Development
- ✅ Use `.env.local` (gitignored)
- ✅ Keep test credentials separate
- ✅ Never commit secrets to git

### Production
- ✅ Use environment variables (Vercel, Railway, etc.)
- ✅ Rotate all API keys before going live
- ✅ Enable API key restrictions (Google Maps)
- ✅ Use production Paytrail credentials
- ✅ Set up domain restrictions
- ✅ Enable rate limiting
- ✅ Monitor API usage and costs

---

## 🆘 Troubleshooting

### "Supabase connection failed"
- ✅ Check project URL is correct
- ✅ Verify anon key is from API settings
- ✅ Ensure PostGIS extension is enabled
- ✅ Check database is not paused (free tier)

### "Google Maps not loading"
- ✅ Verify API key is correct
- ✅ Check Places API is enabled
- ✅ Check Maps JavaScript API is enabled
- ✅ Look for billing alerts (exceeded free tier?)

### "Paytrail payment fails"
- ✅ Using test credentials for development?
- ✅ Webhook URL accessible (use ngrok locally)
- ✅ Check Paytrail docs for test cards

### "Database migrations fail"
- ✅ PostGIS extension enabled?
- ✅ Running migrations in correct order?
- ✅ See [sql/README.md](../sql/README.md) for details

---

## 📚 Additional Resources

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Google Maps Platform**: [https://developers.google.com/maps](https://developers.google.com/maps)
- **Paytrail API Docs**: [https://docs.paytrail.com](https://docs.paytrail.com)
- **PostGIS Documentation**: [https://postgis.net/documentation/](https://postgis.net/documentation/)
- **React Google Maps**: [https://react-google-maps-api-docs.netlify.app](https://react-google-maps-api-docs.netlify.app)

---

## 💡 Pro Tips

1. **Supabase**: Use Supabase CLI for easier migrations
   ```bash
   npm install -g supabase
   supabase link --project-ref your-project-ref
   supabase db push
   ```

2. **Google Maps**: Monitor usage in Google Cloud Console to avoid surprise bills

3. **Paytrail**: Test webhooks locally with ngrok:
   ```bash
   ngrok http 9002
   # Use ngrok URL in Paytrail callback configuration
   ```

4. **Environment Variables**: Use a password manager to store API keys securely

---

**Questions?** Refer to service-specific documentation linked above or check [CLAUDE.md](../CLAUDE.md) for development patterns.
