module.exports = async function handler(req, res) {
    try {
        const u1 = await fetch("https://www.chedraui.com.mx/search?q=coca");
        const u2 = await fetch("https://www.lacomer.com.mx");
        const u3 = await fetch("https://justo.mx/search?q=coca");
        return res.status(200).json({ c: u1.status, lc: u2.status, j: u3.status });
    } catch (e) {
        return res.status(500).json({ err: e.message });
    }
}
