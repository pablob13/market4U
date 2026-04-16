const getTokens = (title) => {
    const sizeRegex = /([0-9.,]+)\s*(ml|l|lt|g|kg|oz|rollo|rollos|pañuelo|pañuelos|toallita|toallitas|hojas|hoja|servilletas)/i;
    const qtyRegex = /(?:([0-9]+)\s*(?:pack|botellas|latas|piezas|pz|pzas|x))/i;
    let clean = title.toLowerCase().replace(sizeRegex, ' ').replace(qtyRegex, ' ');
    return clean.replace(/[^a-z0-9]/g, ' ').split(' ').filter(x => x.length > 2);
};
const t1 = "Refresco Coca-Cola Sin Azúcar 12 Piezas de 355ml c/u"; // Chedraui
const t2 = "Refresco Coca Cola Zero 12 pack de 355 ml"; // Soriana
console.log("Chedraui:", getTokens(t1));
console.log("Soriana :", getTokens(t2));
const intersection = getTokens(t1).filter(t => getTokens(t2).includes(t)).length;
const minT = Math.min(getTokens(t1).length, getTokens(t2).length);
console.log("Score:", intersection / minT);
