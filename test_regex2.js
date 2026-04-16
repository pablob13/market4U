const extractSize = (title) => {
    // Solo medidores físicos reales, quitamos pack/pz/piezas de aquí
    const sizeRegex = /([0-9.,]+)\s*(ml|l|lt|g|kg|oz|rollo|rollos|pañuelo|pañuelos|toallita|toallitas|hojas|hoja|servilletas)/i;
    const match = title.toLowerCase().match(sizeRegex);
    return match ? match[0].replace(/\s/g, '').replace('lt', 'l') : null;
};
const title1 = "Refresco Coca-Cola Original 2 Botellas De 3L c/u"; // Chedraui
const title2 = "Refresco Coca Cola Original 2 Pack 3 L"; // Soriana
console.log("Size 1:", extractSize(title1));
console.log("Size 2:", extractSize(title2));
