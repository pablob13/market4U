const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const config = fs.readFileSync('config.js', 'utf8');
const urlMatch = config.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = config.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

if(urlMatch && keyMatch) {
    const sb = createClient(urlMatch[1], keyMatch[1]);
    sb.from('products').select(`
        ml_id, title, category, image_url, brand, description,
        price_history(store_id, price, shipping)
    `).limit(2).then(({data, error}) => {
        console.log("DB DATA:", JSON.stringify(data, null, 2));
    });
}
