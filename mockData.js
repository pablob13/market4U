const stores = {
    walmart: { name: 'Walmart', logo: 'W', color: '#ffffff', bgColor: '#0071ce' },
    soriana: { name: 'Soriana', logo: 'S', color: '#ffffff', bgColor: '#e32726' },
    chedraui: { name: 'Chedraui', logo: 'C', color: '#ffffff', bgColor: '#f37021' },
    heb: { name: 'H-E-B', logo: 'H', color: '#ffffff', bgColor: '#cc0000' },
    amazon: { name: 'Amazon Súper', logo: 'A', color: '#000000', bgColor: '#ff9900' },
    mercadolibre: { name: 'Mercado Libre', logo: 'ML', color: '#2d3277', bgColor: '#ffe600' }
};

const products = [
    {
        id: 'p1',
        title: 'Leche Entera Lala Pasteurizada 1L',
        category: 'Lácteos',
        description: 'Leche 100% pura de vaca entera, ultrapasteurizada y adicionada con vitaminas A y D. Un elemento indispensable en tu mesa para brindar el mejor sabor y nutrición a toda la familia en el desayuno. Empaque Tetra Pak reciclable.',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=600&auto=format&fit=crop',
        offers: [
            { store: 'walmart', price: 29, shipping: 49, delivery: 'Hoy' },
            { store: 'soriana', price: 28, shipping: 49, delivery: 'Hoy' },
            { store: 'chedraui', price: 26.50, shipping: 39, delivery: 'Hoy' }
        ]
    },
    {
        id: 'p2',
        title: 'Huevo San Juan Blanco 30 piezas',
        category: 'Despensa',
        description: 'Cartera con 30 piezas de huevo blanco seleccionado. San Juan certifica la frescura con su sello impreso en cada cascarón. Alto nivel de proteína, ideal para comenzar la mañana o complementar tus recetas de repostería.',
        image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?q=80&w=600&auto=format&fit=crop',
        offers: [
            { store: 'walmart', price: 89, shipping: 49, delivery: 'Hoy' },
            { store: 'soriana', price: 92, shipping: 49, delivery: 'Hoy' },
            { store: 'chedraui', price: 85, shipping: 39, delivery: 'Hoy' },
            { store: 'amazon', price: 95, shipping: 0, delivery: 'Mañana' }
        ]
    },
    {
        id: 'p3',
        title: 'Detergente Líquido Ariel Doble Poder 4L',
        category: 'Limpieza',
        description: 'Fórmula especializada que penetra profundamente en las fibras para remover manchas difíciles incluso en la primera lavada. Rinde hasta 40 cargas. Ayuda a preservar el color de tu ropa mientras le otorga un aroma fresco y duradero.',
        image: 'https://images.unsplash.com/photo-1582963050720-d3b255476a6b?q=80&w=600&auto=format&fit=crop',
        offers: [
            { store: 'walmart', price: 185, shipping: 49, delivery: 'Hoy' },
            { store: 'soriana', price: 195, shipping: 49, delivery: 'Hoy' },
            { store: 'chedraui', price: 179, shipping: 39, delivery: 'Hoy' },
            { store: 'amazon', price: 199, shipping: 0, delivery: 'Mañana' }
        ]
    },
    {
        id: 'p4',
        title: 'Papel Higiénico Pétalo Rendimax 12 Rollos',
        category: 'Limpieza',
        description: 'Papel higiénico con la suavidad ideal y máxima resistencia. Sus hojas dobles están diseñadas con tecnología acolchonada para asegurar mayor absorción. Paquete familiar perfecto para optimizar tus gastos de supermercado.',
        image: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?q=80&w=600&auto=format&fit=crop',
        offers: [
            { store: 'walmart', price: 85, shipping: 49, delivery: 'Hoy' },
            { store: 'soriana', price: 82, shipping: 49, delivery: 'Hoy' },
            { store: 'amazon', price: 95, shipping: 0, delivery: 'Mañana' },
            { store: 'mercadolibre', price: 90, shipping: 99, delivery: 'Mañana' }
        ]
    },
    {
        id: 'p5',
        title: 'Café Soluble Nescafé Clásico 225g',
        category: 'Despensa',
        description: 'La tradición de tu marca favorita en un frasco de 225g. Elaborado con una mezcla de granos de café robusta secados bajo el sol que proporcionan un sabor y aroma inconfundibles. Disfrútalo solo o preparado con leche.',
        image: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=600&auto=format&fit=crop',
        offers: [
            { store: 'walmart', price: 115, shipping: 49, delivery: 'Hoy' },
            { store: 'soriana', price: 120, shipping: 49, delivery: 'Hoy' },
            { store: 'chedraui', price: 110, shipping: 39, delivery: 'Hoy' },
            { store: 'amazon', price: 105, shipping: 0, delivery: 'Mañana' },
            { store: 'mercadolibre', price: 108, shipping: 0, delivery: 'Mañana' }
        ]
    },
    {
        id: 'p6',
        title: 'Leche Entera Alpura Clásica 1L',
        category: 'Lácteos',
        description: 'Leche pura de vaca ultra pasteurizada. Su sabor clásico y cremosa textura la hacen la competencia ideal en la mesa mexicana. Rica en calcio y proteínas.',
        image: 'https://images.unsplash.com/photo-1570197781417-0c7f0baddbc4?q=80&w=600&auto=format&fit=crop',
        offers: [
            { store: 'walmart', price: 29.50, shipping: 49, delivery: 'Hoy' },
            { store: 'soriana', price: 28.50, shipping: 49, delivery: 'Hoy' },
            { store: 'chedraui', price: 27.00, shipping: 39, delivery: 'Hoy' }
        ]
    },
    {
        id: 'p7',
        title: 'Huevo Bachoco Blanco 30 piezas',
        category: 'Despensa',
        description: 'Huevos blancos frescos clase A directo de las granjas Bachoco. Ideales para el consumo proteico diario en el desayuno y para toda la familia.',
        image: 'https://images.unsplash.com/photo-1598965402089-897ce52e8355?q=80&w=600&auto=format&fit=crop',
        offers: [
            { store: 'walmart', price: 86, shipping: 49, delivery: 'Hoy' },
            { store: 'soriana', price: 89, shipping: 49, delivery: 'Hoy' },
            { store: 'chedraui', price: 83, shipping: 39, delivery: 'Hoy' }
        ]
    },
    {
        id: 'p8',
        title: 'Detergente Líquido Persil Universal 3L',
        category: 'Limpieza',
        description: 'La tecnología Alemana de Persil Universal ofrece limpieza profunda gracias a sus ingredientes activos que logran penetrar la tela y remover las manchas más obstinadas.',
        image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?q=80&w=600&auto=format&fit=crop',
        offers: [
            { store: 'walmart', price: 165, shipping: 49, delivery: 'Hoy' },
            { store: 'soriana', price: 175, shipping: 49, delivery: 'Hoy' },
            { store: 'amazon', price: 159, shipping: 0, delivery: 'Mañana' }
        ]
    }
];
