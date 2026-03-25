import fetch from "node-fetch"; // need to use node-fetch or global fetch
import dotenv from "dotenv";

dotenv.config();

async function testApi() {
  try {
    const adminCredentials = { email: "admin2@example.com", password: "password123", name: "Admin Test", role: "admin" };
    
    // Create admin
    await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminCredentials)
    });

    // Login
    const loginRes = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin2@example.com", password: "password123", loginType: "admin" })
    });
    const loginData = await loginRes.json();
    console.log("Login Token:", !!loginData.token);

    // Create Resource
    const createRes = await fetch("http://localhost:8080/api/resources", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        title: "Test folder upload",
        description: "",
        link: "https://drive.google.com/drive/folders/test12345",
        class: "GENERAL",
        category: "Academic",
        type: "GDRIVE_FOLDER",
        driveFolderId: "",
        embedType: "external",
        embedUrl: ""
      })
    });

    const createData = await createRes.json();
    console.log("Create Response Status:", createRes.status);
    console.log("Create Response Body:", createData);

  } catch (err) {
    console.error(err);
  }
}

testApi();
