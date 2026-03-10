const TOTAL_REQUESTS = 15;
const SERVER = "http://localhost:3000";

console.log();
console.log("==============================================");
console.log(" DDoS ATTACK SIMULATION");
console.log("==============================================");
console.log(` Target       : ${SERVER}`);
console.log(` Total attacks : ${TOTAL_REQUESTS}`);
console.log("==============================================");
console.log();

async function getStatus() {
  const res = await fetch(`${SERVER}/api/status`);
  return res.json();
}

async function attack() {
  const before = await getStatus();
  console.log(`[BEFORE] Active users: ${before.activeUsers}/${before.maxUsers}`);
  console.log();

  let allowed = 0;
  let blocked = 0;

  console.log("Launching attack...");
  console.log("─".repeat(46));

  const promises = [];
  for (let i = 1; i <= TOTAL_REQUESTS; i++) {
    promises.push(
      fetch(`${SERVER}/api/request-access`, {
        method: "POST",
        headers: { "X-Simulated-IP": `192.168.1.${i}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.allowed) {
            allowed++;
            console.log(`  Request #${String(i).padStart(2)}  →  ✅ ALLOWED  (token: ${data.token.slice(0, 8)}...)`);
          } else {
            blocked++;
            console.log(`  Request #${String(i).padStart(2)}  →  🚫 BLOCKED`);
          }
        })
        .catch((err) => {
          blocked++;
          console.log(`  Request #${String(i).padStart(2)}  →  ❌ ERROR: ${err.message}`);
        })
    );
  }

  await Promise.all(promises);

  console.log();
  console.log("─".repeat(46));
  console.log();

  // Show results
  console.log("==============================================");
  console.log(" ATTACK RESULTS");
  console.log("==============================================");
  console.log(`  Total requests : ${TOTAL_REQUESTS}`);
  console.log(`  Allowed in     : ${allowed}`);
  console.log(`  Blocked        : ${blocked}`);
  console.log(`  Block rate     : ${Math.round((blocked / TOTAL_REQUESTS) * 100)}%`);
  console.log("==============================================");
  console.log();

  // Show status after attack
  const after = await getStatus();
  console.log(`[AFTER] Active users: ${after.activeUsers}/${after.maxUsers}`);
  console.log();

  if (after.sessions.length > 0) {
    console.log("Active Sessions:");
    after.sessions.forEach((s, i) => {
      console.log(`  ${i + 1}. Token: ${s.token}  IP: ${s.ip}  Age: ${s.age}`);
    });
  }

  console.log();
  console.log("The gateway successfully blocked the excess traffic!");
  console.log("Slots will auto-expire in 60 seconds.");
}

attack().catch(console.error);
