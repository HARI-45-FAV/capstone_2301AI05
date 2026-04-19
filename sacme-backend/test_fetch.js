

async function test() {
    console.log("Logging in...");
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bala_2301ai05@iitp.ac.in', password: 'password123' })
    });
    
    const loginData = await loginRes.json();
    console.log("Login OK:", loginRes.status);
    const token = loginData.token;

    // We don't have courseId natively in script, just use '' to test
    console.log("Fetching attendance...");
    const attRes = await fetch('http://localhost:5000/api/attendance/student/me', {
       headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log("Att Status:", attRes.status);
    const attData = await attRes.text();
    console.log("Att Body:", attData);
}

test();
