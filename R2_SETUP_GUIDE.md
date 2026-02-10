# Cloudflare R2 Setup Guide

Follow these steps to set up Cloudflare R2 for storing video clips.

## Step 1: Create Cloudflare Account (if needed)

1. Go to https://dash.cloudflare.com/sign-up
2. Sign up for free account (no credit card required for R2)

## Step 2: Enable R2

1. Log in to Cloudflare Dashboard
2. Go to **R2** in the left sidebar
3. Click **Create bucket** (you may need to enable R2 first)

## Step 3: Create R2 Bucket

1. Click **Create bucket**
2. Bucket name: `ncliper-clips` (or your preferred name)
3. Location: Choose closest region (or "Automatic")
4. Click **Create bucket**

## Step 4: Configure Public Access

1. Select your bucket
2. Go to **Settings** tab
3. Scroll to **Public access**
4. Click **Allow Access** (this enables public reads)
5. Note the **R2.dev subdomain** URL (e.g., `https://pub-xxxxx.r2.dev`)

## Step 5: Create API Token

1. Go back to R2 main page
2. Click **Manage R2 API Tokens**
3. Click **Create API token**
4. Token name: `ncliper-worker`
5. Permissions:
   - **Object Read & Write** (for uploading and reading clips)
6. TTL: Choose expiration (or "Forever" for development)
7. Click **Create API Token**

## Step 6: Copy Credentials

After creating the token, you'll see:
- **Access Key ID**: (looks like: `f12a3b4c5d6e7f8a9b0c1d2e3f4a5b6c`)
- **Secret Access Key**: (longer string)
- **Account ID**: (in the R2 dashboard header)

**⚠️ IMPORTANT**: Copy these immediately - the secret key won't be shown again!

## Step 7: Add to Environment Variables

Create or update `.env` file in project root:

```env
# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=ncliper-clips
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

Replace the values with your actual credentials from Step 6.

## Step 8: Verify Setup

Your bucket is ready when:
- ✅ Public access is enabled
- ✅ API token created
- ✅ Credentials added to `.env`
- ✅ Public URL noted

---

## Pricing (Free Tier)

Cloudflare R2 free tier includes:
- **10 GB** storage
- **No egress fees** (unlimited downloads!)
- 10 million Class A operations/month (uploads)
- 100 million Class B operations/month (reads)

Perfect for testing and early production! 🎉

---

**Next**: Once you have your credentials, we'll install boto3 and implement the upload logic.

Are you ready to proceed, or do you need help setting up R2?
