const fs = require('fs');
const html = fs.readFileSync('soriana_block.txt', 'utf8');
const blocks = html.split('class="product-tile ');
const block = blocks.find(b => b.includes('data-pid'));
if (block) {
    const imgMatch = block.match(/data-src="([^"]+)"/i) || block.match(/class="[^"]*tile-image[^"]*"\s+src="([^"]+)"/);
    console.log("Image found:", imgMatch ? imgMatch[1].split('?')[0] : "null");
}
