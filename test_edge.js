const fetch = require('node-fetch');
async function run() {
    const res = await fetch("https://yiolvrhxjkozebcorqep.supabase.co/functions/v1/ml-search?q=coca", {
        headers: {
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpb2x2cmh4amtvemViY29ycWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxOTcwOTksImV4cCI6MjA5MTc3MzA5OX0.bYMXCyH4lsmHhS2Y4zNNhy5EV_otw8X4qtsu9Wxee_Q"
        }
    });
    console.log(await res.text());
}
run();
