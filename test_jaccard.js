const extractSize = (title) => {
    const match = title.toLowerCase().match(/([0-9.,]+)\s*(ml|l|lt|g|kg|oz|pack|pz|pzas|piezas|rollo|rollos|pañuelo|pañuelos|toallita|toallitas|hojas|hoja|servilletas|caja|cajas)/);
    return match ? match[0].replace(/\s/g, '').replace('lt', 'l') : null;
};

const t1 = "Refresco Coca Cola Original 2.75 L";
const t2 = "Refresco Coca Cola 2.75L";

const s1 = extractSize(t1);
const s2 = extractSize(t2);
console.log("Size Match:", s1, "===", s2);

const tok1 = t1.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(x => x.length > 2);
const tok2 = t2.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(x => x.length > 2);
console.log("Tokens 1:", tok1);
console.log("Tokens 2:", tok2);

const intersection = tok1.filter(t => tok2.includes(t)).length;
const minTokens = Math.min(tok1.length, tok2.length);
console.log("Score:", intersection / minTokens);
