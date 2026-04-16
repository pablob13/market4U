const getTokens = (title) => {
    const sizeRegex = /([0-9.,]+)\s*(ml|l|lt|g|kg|oz|pack|pz|pzas|piezas|rollo|rollos|pañuelo|pañuelos|toallita|toallitas|hojas|hoja|servilletas|caja|cajas)/i;
    const qtyRegex = /(?:([0-9]+)\s*(?:pack|botellas|latas|piezas|pz|pzas|x))/i;
    let clean = title.toLowerCase().replace(sizeRegex, ' ').replace(qtyRegex, ' ');
    return clean.replace(/[^a-z0-9]/g, ' ').split(' ').filter(x => x.length > 2);
};
const t1 = "Refresco Coca-Cola Original 2 Botellas De 3L c/u"; // Chedraui
const t2 = "Refresco Coca Cola Original 2 Pack 3 L"; // Soriana
const t3 = "Refresco Coca-Cola Original 355ml"; // Chedraui
const t4 = "Refresco Coca-Cola Original 355ml"; // Chedraui 2

console.log("Tokens 1:", getTokens(t1));
console.log("Tokens 2:", getTokens(t2));

const intersection = getTokens(t1).filter(t => getTokens(t2).includes(t)).length;
const minTokens = Math.min(getTokens(t1).length, getTokens(t2).length);
console.log("Score 1-2:", intersection / minTokens);
