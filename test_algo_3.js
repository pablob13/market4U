const getTokens = (title) => {
    const sizeRegex = /([0-9.,]+)\s*(ml|l|lt|g|kg|oz|rollo|rollos|pañuelo|pañuelos|toallita|toallitas|hojas|hoja|servilletas)/i;
    const qtyRegex = /(?:([0-9]+)\s*(?:pack|botellas|latas|piezas|pz|pzas|x))/i;
    let clean = title.toLowerCase().replace(sizeRegex, ' ').replace(qtyRegex, ' ');
    // Notar el reemplazo de acentos ANTES del regex
    clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return clean.replace(/[^a-z0-9]/g, ' ').split(' ').filter(x => x.length > 2);
};
const t1 = "Refresco Coca-Cola sin Azúcar 355ml";
const t2 = "Refresco Coca-Cola Sin Azúcar Lata de 355ml";
console.log("T1:", getTokens(t1));
console.log("T2:", getTokens(t2));
