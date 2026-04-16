const fs = require('fs');
const html = fs.readFileSync('soriana_test.html', 'utf-8');

const results = [];
const blocks = html.split('class="product-tile ');

for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    
    // Extract PID
    const pidMatch = block.match(/data-pid="([^"]+)"/);
    const pid = pidMatch ? pidMatch[1] : null;
    
    // Extract Name
    const nameMatch = block.match(/class="link[^>]+>([^<]+)<\/a>/);
    const name = nameMatch ? nameMatch[1].trim() : null;
    
    // Extract Price
    const priceMatch = block.match(/class="value"\s+content="([0-9.]+)"/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : null;
    
    // Extract Img
    const imgMatch = block.match(/class="tile-image"\s+src="([^"]+)"/);
    let img = imgMatch ? imgMatch[1] : null;
    if (img && img.includes('?')) img = img.split('?')[0];
    
    // Extract URL
    const urlMatch = block.match(/href="([^"]+)"/);
    const link = urlMatch ? 'https://www.soriana.com' + urlMatch[1] : null;

    if (name && price && pid) {
        results.push({ id: 'soriana_' + pid, title: name, price, thumbnail: img, permalink: link, free_shipping: false });
    }
}
console.log(JSON.stringify(results.slice(0,2), null, 2));
