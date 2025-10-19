// Test R2 connection with the provided credentials
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const CLOUDFLARE_ACCOUNT_ID = "94a74e6ccdbf01be4ebe4ece5f19689a";
const R2_ACCESS_KEY_ID = "435ba1a526e5e790694c0c5db3241cc8";
const R2_SECRET_ACCESS_KEY = "a179522d4cfb2adcdf8eaa7d0a032d705b8cbfaaaa81a990fd385258381a0d43";
const R2_BUCKET_NAME = "sellfastnow-images";
const R2_ENDPOINT = `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

console.log("Testing R2 connection...");
console.log("Account ID:", CLOUDFLARE_ACCOUNT_ID);
console.log("Endpoint:", R2_ENDPOINT);
console.log("Bucket:", R2_BUCKET_NAME);

const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

async function testConnection() {
  try {
    console.log("\n1. Testing bucket access...");
    
    // Try to upload a test file
    const testData = Buffer.from("Test upload from SellFast.Now");
    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: "test-upload.txt",
      Body: testData,
      ContentType: "text/plain",
    });

    const result = await r2Client.send(putCommand);
    console.log("✅ Upload successful!");
    console.log("Result:", result);
    
  } catch (error) {
    console.error("❌ Upload failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
  }
}

testConnection();

