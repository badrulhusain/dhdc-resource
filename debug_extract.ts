import { extractFolderId, extractFileId } from "./server/lib/drive.js";

const links = [
    "https://drive.google.com/drive/folders/1SRn8XlmFz5PqURlLJBIzKsr3ddz3mYwh",
    "https://drive.google.com/drive/folders/1rYkOAdfyJosHw9kqcozpqwHJ8wzT9kcb",
    "https://drive.google.com/open?id=1gxkvtyakDIt-UdLhlgscdlca0z03osmH",
    "1gxkvtyakDIt-UdLhlgscdlca0z03osmH"
];

for (const link of links) {
    console.log(`Link: ${link}`);
    console.log(`  Folder ID: ${extractFolderId(link)}`);
    console.log(`  File ID:   ${extractFileId(link)}`);
}
