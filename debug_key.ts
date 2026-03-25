import dotenv from "dotenv";
dotenv.config();

const rawKey = process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

if (!rawKey) {
    console.log("No key found in env vars");
    process.exit(1);
}

let key = rawKey;
console.log("Original starts with:", key.substring(0, 30));
console.log("Original ends with:", key.substring(key.length - 30));
console.log("Contains literal \\n:", key.includes('\\n'));
console.log("Contains actual \\n:", key.includes('\n'));

if (key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1);
    console.log("Removed surrounding double quotes");
}
if (key.startsWith("'") && key.endsWith("'")) {
    key = key.substring(1, key.length - 1);
    console.log("Removed surrounding single quotes");
}

key = key.replace(/\\n/g, '\n');

console.log("Processed starts with:", key.substring(0, 30).replace(/\n/g, '\\n'));
console.log("Processed ends with:", key.substring(key.length - 30).replace(/\n/g, '\\n'));
console.log("Processed has correct header:", key.includes('-----BEGIN PRIVATE KEY-----'));
console.log("Processed has correct footer:", key.includes('-----END PRIVATE KEY-----'));

