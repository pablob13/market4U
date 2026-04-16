const mergeProducts = (products) => {
    const merged = [];
    const extractSize = (title) => {
        const match = title.toLowerCase().match(/([0-9.,]+)\s*(ml|l|lt|g|kg|oz|pack|pz|pzas|piezas|rollo|rollos|pañuelo|pañuelos|toallita|toallitas|hojas|hoja|servilletas|caja|cajas)/);
        return match ? match[0].replace(/\s/g, '').replace('lt', 'l') : null;
    };
    for (const p of products) {
        const pSize = extractSize(p.title);
        const pTokens = p.title.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(x => x.length > 2);
        let foundMatch = null;
        for (const existing of merged) {
            const exSize = extractSize(existing.title);
            if (pSize && exSize && pSize !== exSize) continue;
            const exTokens = existing.title.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(x => x.length > 2);
            const intersection = pTokens.filter(t => exTokens.includes(t)).length;
            const union = new Set([...pTokens, ...exTokens]).size;
            const threshold = (p.seller === existing.seller) ? 0.85 : 0.55;
            if (union > 0 && (intersection / union >= threshold)) {
                foundMatch = existing;
                break;
            }
        }
        if (foundMatch) {
            foundMatch.offers.push(...p.offers);
        } else {
            merged.push({ ...p, offers: [...p.offers] });
        }
    }
    return merged;
};

const input = [
    { title: "Refresco Coca-Cola Original 3 L", seller: "Soriana", offers: [1] },
    { title: "Refresco Coca-Cola Original 3L", seller: "Chedraui", offers: [2] }
];

console.log(JSON.stringify(mergeProducts(input), null, 2));
