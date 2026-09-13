const url = process.env.M3U_PLAYLIST_URL;
if (!url) {
  console.log("No url");
  process.exit(0);
}

const readline = require('readline');
async function run() {
  console.log("Fetching...");
  const res = await fetch(url);
  
  if (!res.body) return;
  
  // Use Node's built-in stream handling
  const { Readable } = require('stream');
  
  // Need to convert web ReadableStream to Node stream
  const nodeStream = Readable.fromWeb(res.body);
  
  const rl = readline.createInterface({
    input: nodeStream,
    crlfDelay: Infinity
  });
  
  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (lineCount % 100000 === 0) console.log(`Read ${lineCount} lines`);
  }
  
  console.log(`Done, read ${lineCount} lines`);
}
run();
