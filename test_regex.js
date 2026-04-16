const title1 = "Refresco Coca-Cola Original 12 Botellas de 355ml c/u";
const title2 = "Refresco Coca-Cola Original 355ml";
const extractQuantity = (title) => {
    // Busca patrones como "12 pack", "4 botellas", "6 latas"
    const match = title.toLowerCase().match(/(?:([0-9]+)\s*(?:pack|botellas|latas|piezas|pz|pzas|x))/);
    return match ? parseInt(match[1]) : 1; // Default a 1 si no dice cantidad
};
console.log(title1, "QTY:", extractQuantity(title1));
console.log(title2, "QTY:", extractQuantity(title2));
