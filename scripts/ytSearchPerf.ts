import * as ytsr from "ytsr";

const REQ_COUNT = 25;

async function main() {
  const times = [];
  for (let i = 0; i < REQ_COUNT; i++) {
    const start = performance.now();
    const result = await ytsr("business eminem explicit");
    const duration = performance.now() - start;
    console.log(`Request ${i + 1} took ${duration}ms`);
    times.push(duration);
  }

  // Results.
  let total = 0;
  times.forEach((time) => (total += time));
  const avgTime = total / REQ_COUNT;
  console.log(`AvgTime = ${avgTime}ms`);
}

main();
