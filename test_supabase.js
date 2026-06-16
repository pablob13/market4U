const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

try {
    const config = fs.readFileSync('config.js', 'utf8');
    const urlMatch = config.match(/SUPABASE_URL\s*:\s*['"]([^'"]+)['"]/);
    const keyMatch = config.match(/SUPABASE_ANON_KEY\s*:\s*['"]([^'"]+)['"]/);

    if (urlMatch && keyMatch) {
        console.log("Found Supabase credentials in config.js. Authenticating...");
        const sb = createClient(urlMatch[1], keyMatch[1]);
        
        sb.from('products').select(`
            ml_id, title, category, image_url, brand
        `).limit(1).then(({ data, error }) => {
            if (error) {
                console.error("❌ Supabase query failed:", error.message);
                process.exit(1);
            }
            console.log("✅ Supabase connection validated successfully!");
            console.log("Sample Data:", JSON.stringify(data, null, 2));
            process.exit(0);
        }).catch(err => {
            console.error("❌ Promise connection failed:", err.message);
            process.exit(1);
        });
    } else {
        console.error("❌ Error: Could not parse SUPABASE_URL or SUPABASE_ANON_KEY from config.js");
        process.exit(1);
    }
} catch (err) {
    console.error("❌ Fatal test error:", err.message);
    process.exit(1);
}
