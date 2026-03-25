const fs = require('fs');

const envPath = '.env';
let content = fs.readFileSync(envPath, 'utf8');

// Replace the multiline key from -----BEGIN PRIVATE KEY----- to -----END PRIVATE KEY-----
// with a single line quoted string containing \n

const keyRegex = /GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n([\s\S]*?)-----END PRIVATE KEY-----/;
const match = content.match(keyRegex);

if (match) {
    const rawKey = "-----BEGIN PRIVATE KEY-----\n" + match[1] + "-----END PRIVATE KEY-----";
    // Replace actual newlines with the string "\n"
    const singleLineKey = rawKey.replace(/\n/g, '\\n');
    
    // Replace in the file
    content = content.replace(keyRegex, `GOOGLE_PRIVATE_KEY="${singleLineKey}"`);
    fs.writeFileSync(envPath, content);
    console.log("Successfully fixed GOOGLE_PRIVATE_KEY in .env");
} else {
    console.log("Could not find multiline key pattern in .env");
}
