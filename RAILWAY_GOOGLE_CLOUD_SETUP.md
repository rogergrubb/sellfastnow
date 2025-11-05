# Railway Google Cloud Vision Setup Instructions

## Step 1: Add Google Cloud Credentials to Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Navigate to your project: **zealous-contentment** → **production** environment
3. Click on the **sellfastnow** service
4. Click on the **Variables** tab
5. Click **New Variable**

## Step 2: Add the Credentials Variable

**Variable Name:**
```
GOOGLE_APPLICATION_CREDENTIALS_JSON
```

**Variable Value:**

The credentials JSON file was provided separately. Copy the entire JSON content as a single line (remove all line breaks and spaces between elements).

The JSON should look like this structure (minified):
```
{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"...","universe_domain":"..."}
```

**Important:** 
- Copy the entire JSON as a single line (no line breaks)
- Do NOT add quotes around the JSON
- Paste directly into the Railway variable value field

## Step 3: Save and Redeploy

1. Click **Add** to save the variable
2. Railway will automatically trigger a new deployment
3. Wait for the deployment to complete (~3-4 minutes)

## Step 4: Verify It's Working

After deployment completes:

1. Go to your app: https://sellfast.now
2. Upload 82 items
3. Click "Generate Now"
4. All items should get AI-generated descriptions using Google Cloud Vision!

## What This Enables

✅ **No rate limits** - Process 82+ items without hitting Gemini's 10/minute limit  
✅ **Faster processing** - No artificial delays needed  
✅ **More reliable** - Google Cloud's enterprise infrastructure  
✅ **1000 free requests/month** - Plenty for your needs

## Troubleshooting

If you see "Google Cloud credentials not configured" in logs:
1. Check the variable name is exactly: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
2. Check the JSON value is valid (no extra spaces or line breaks)
3. Redeploy the service after adding the variable

## Alternative: Fix Stripe API Key

While you're in the Variables tab, also fix the Stripe issue:

1. Find the `STRIPE_SECRET_KEY` variable
2. Replace it with your **secret key** from https://dashboard.stripe.com/account/apikeys
3. The key should start with `sk_test_` or `sk_live_` (NOT `pk_`)

This will fix the payment error you saw earlier.

## How to Minify the JSON

If you need to convert the multi-line JSON to a single line:

**Option 1: Using online tool**
1. Go to https://www.json.org/json-en.html or any JSON minifier
2. Paste your JSON
3. Click "Minify"
4. Copy the result

**Option 2: Using command line**
```bash
cat credentials.json | jq -c
```

**Option 3: Manual**
Remove all newlines and unnecessary spaces between elements.
