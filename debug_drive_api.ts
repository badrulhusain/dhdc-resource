import { listFolderContents } from "./server/lib/drive.js";

async function test() {
    const folderId = "1SRn8XlmFz5PqURlLJBIzKsr3ddz3mYwh";
    console.log(`Testing access to folder: ${folderId}`);
    try {
        const result = await listFolderContents(folderId);
        if (result) {
            console.log("Success! Folder name:", result.name);
            console.log("Children count:", result.children?.length);
        } else {
            console.log("Failed: listFolderContents returned null");
        }
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

test();
