const engine = require('./netlify/functions/engine.js');
const listSubmissions = require('./netlify/functions/list-submissions.js');
const saveLead = require('./netlify/functions/save-lead.js');
const submitForm = require('./netlify/functions/submit-form.js');

async function runTests() {
  console.log("--- Testing engine.js (GET) ---");
  const engineGet = await engine.handler({ httpMethod: 'GET' });
  console.log("Engine GET result:", engineGet);

  console.log("\n--- Testing engine.js (POST without secret) ---");
  const enginePostNoSecret = await engine.handler({ httpMethod: 'POST', headers: {} });
  console.log("Engine POST (no secret) result:", enginePostNoSecret);

  console.log("\n--- Testing submit-form.js (POST) ---");
  try {
    const submitResult = await submitForm.handler({ 
      httpMethod: 'POST', 
      body: JSON.stringify({ name: "Test Lead", email: "test@example.com" }) 
    });
    console.log("Submit Form result:", submitResult);
  } catch (e) {
    console.log("Submit Form error (expected if Blobs not configured locally):", e.message);
  }
}

runTests();
