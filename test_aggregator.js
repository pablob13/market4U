const fs = require('fs');
async function test() {
    const res = await fetch('https://market4-u.vercel.app/api/search?q=coca+cola&limit=100');
    const data = await res.json();
    fs.writeFileSync('coca_data.json', JSON.stringify(data.results, null, 2));
    console.log("Fetched", data.results.length);
}
test();
