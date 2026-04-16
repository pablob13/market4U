const extractSize = (title) => {
    const sizeRegex = /([0-9.,]+)\s*(ml|l|lt|g|kg|oz|pack|pz|pzas|piezas|rollo|rollos|pañuelo|pañuelos|toallita|toallitas|hojas|hoja|servilletas|caja|cajas)/;
    const match = title.toLowerCase().match(sizeRegex);
    return match ? match[0].replace(/\s/g, '').replace('lt', 'l') : null;
};
const extractQuantity = (title) => {
    const match = title.toLowerCase().match(/(?:([0-9]+)\s*(?:pack|botellas|latas|piezas|pz|pzas|x))/);
    return match ? parseInt(match[1]) : 1;
};

const t1 = "Refresco Coca-Cola Original 2.75 l";
const t2 = "Refresco Coca-Cola Original 2.75L";
const t3 = "Refresco Coca-Cola Original 12 Botellas de 355ml c/u";
const t4 = "Refresco Coca-Cola Original 355ml";

const getTokens = (t) => {
    const sizeRegex = /([0-9.,]+)\s*(ml|l|lt|g|kg|oz|pack|pz|pzas|piezas|rollo|rollos|pañuelo|pañuelos|toallita|toallitas|hojas|hoja|servilletas|caja|cajas)/;
    const noSize = t.toLowerCase().replace(sizeRegex, ' ');
    const qtyRegex = /(?:([0-9]+)\s*(?:pack|botellas|latas|piezas|pz|pzas|x))/;
    const clean = noSize.replace(qtyRegex, ' ');
    return clean.replace(/[^a-z0-9]/g, ' ').split(' ').filter(x => x.length > 2);
};

console.log("Tokens 2.75L S:", getTokens(t1));
console.log("Tokens 2.75L C:", getTokens(t2));
console.log("Tokens 12Pack C:", getTokens(t3));
console.log("Tokens Single C:", getTokens(t4));

const intersection = getTokens(t1).filter(t => getTokens(t2).includes(t)).length;
const minT = Math.min(getTokens(t1).length, getTokens(t2).length);
console.log("Score 2.75:", intersection / minT);
