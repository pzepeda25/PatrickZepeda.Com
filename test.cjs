async function runTests() {
  const engine = await import('./netlify/functions/engine.js');
  const listSubmissions = await import('./netlify/functions/list-submissions.js');
  const saveLead = await import('./netlify/functions/save-lead.js');
  const submitForm = await import('./netlify/functions/submit-form.js');

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
