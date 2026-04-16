const stores = { walmart: {}, soriana: {}, chedraui: {} };
const p1 = {
  id: 'p1',
  bestOffer: { price: 26.50, store: 'chedraui' },
  sortedOffers: [
    { store: 'walmart', price: 29, shipping: 49, delivery: 'Hoy' },
    { store: 'soriana', price: 28, shipping: 49, delivery: 'Hoy' },
    { store: 'chedraui', price: 26.50, shipping: 39, delivery: 'Hoy' }
  ],
  category: "General",
  title: "Leche"
};
const product = p1;
const curP = product.bestOffer.price;
let vals = [curP, curP, curP, curP];
const maxV = Math.max(...vals) * 1.05;
const minV = Math.min(...vals) * 0.90;
const getY = (v) => (maxV === minV) ? 85 : 85 - ((v - minV) / (maxV - minV)) * 65;
const xCoords = [25, 108, 191, 275];
const yCoords = vals.map(getY);
console.log(yCoords);
