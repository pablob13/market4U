const stores = {
    walmart: { 
        name: 'Walmart', 
        logo: `<svg viewBox="0 0 100 100" style="width:70%; height:70%;" xmlns="http://www.w3.org/2000/svg"><path d="M50 5 L50 35 M50 95 L50 65 M11 27 L37 42 M89 73 L63 58 M11 73 L37 58 M89 27 L63 42" stroke="#ffb81c" stroke-width="12" stroke-linecap="round" /></svg>`,  
        color: '#ffffff', bgColor: '#0071ce' 
    },
    soriana: { 
        name: 'Soriana', 
        logo: `<svg viewBox="0 0 100 100" style="width:75%; height:75%;" xmlns="http://www.w3.org/2000/svg"><path d="M50 90 L42 82 C14 57 0 42 0 28 C0 13 13 0 28 0 C38 0 45 6 50 14 C55 6 62 0 72 0 C87 0 100 13 100 28 C100 42 86 57 58 82 L50 90 Z" fill="white" /></svg>`,  
        color: '#ffffff', bgColor: '#e32726', live: true 
    },
    chedraui: { 
        name: 'Chedraui', 
        logo: `<svg viewBox="0 0 100 100" style="width:90%; height:90%;" xmlns="http://www.w3.org/2000/svg"><text x="50" y="80" fill="white" font-family="Arial, sans-serif" font-weight="900" font-size="80" text-anchor="middle">C</text></svg>`,  
        color: '#ffffff', bgColor: '#f37021', live: true 
    },
    heb: { 
        name: 'H-E-B', 
        logo: `<svg viewBox="0 0 100 100" style="width:95%; height:95%;" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="50" rx="45" ry="25" fill="none" stroke="white" stroke-width="8"/><text x="50" y="62" fill="white" font-family="Arial, sans-serif" font-weight="900" font-size="34" text-anchor="middle">HEB</text></svg>`,  
        color: '#ffffff', bgColor: '#cc0000', live: true 
    },
    lacomer: { 
        name: 'La Comer', 
        logo: `<svg viewBox="0 0 100 100" style="width:90%; height:90%;" xmlns="http://www.w3.org/2000/svg"><text x="50" y="72" fill="white" font-family="Arial, sans-serif" font-weight="900" font-size="65" text-anchor="middle" letter-spacing="-2">LC</text></svg>`,  
        color: '#ffffff', bgColor: '#007a4c', live: true 
    },
    fresko: { 
        name: 'Fresko', 
        logo: `<svg viewBox="0 0 100 100" style="width:90%; height:90%;" xmlns="http://www.w3.org/2000/svg"><text x="50" y="70" fill="white" font-family="'Georgia', serif" font-style="italic" font-weight="bold" font-size="50" text-anchor="middle">Fr</text></svg>`,  
        color: '#ffffff', bgColor: '#632066', live: true 
    },
    citymarket: { 
        name: 'City Market', 
        logo: `<svg viewBox="0 0 100 100" style="width:90%; height:90%;" xmlns="http://www.w3.org/2000/svg"><text x="50" y="72" fill="white" font-family="'Georgia', serif" font-weight="normal" font-size="65" text-anchor="middle" letter-spacing="-1">CM</text></svg>`,  
        color: '#ffffff', bgColor: '#4c2d1b', live: true 
    },
    justo: { 
        name: 'Jüsto', 
        logo: `<svg viewBox="0 0 100 100" style="width:90%; height:90%;" xmlns="http://www.w3.org/2000/svg"><text x="50" y="72" fill="white" font-family="'Arial', sans-serif" font-weight="bold" font-size="55" text-anchor="middle" letter-spacing="-2">Jü</text></svg>`,  
        color: '#ffffff', bgColor: '#87c846', live: true 
    },
    amazon: { 
        name: 'Amazon Súper', 
        logo: `<svg viewBox="0 0 100 100" style="width:80%; height:80%;" xmlns="http://www.w3.org/2000/svg"><text x="50" y="60" fill="black" font-family="Arial, sans-serif" font-weight="bold" font-size="65" text-anchor="middle">a</text><path d="M20 75 C40 95, 70 85, 85 65" fill="none" stroke="black" stroke-width="8" stroke-linecap="round"/></svg>`,  
        color: '#000000', bgColor: '#ff9900' 
    },
    mercadolibre: { 
        name: 'Mercado Libre', 
        logo: `<svg viewBox="0 0 100 100" style="width:90%; height:90%;" xmlns="http://www.w3.org/2000/svg"><text x="50" y="72" fill="#2d3277" font-family="Arial, sans-serif" font-weight="900" font-size="65" text-anchor="middle" letter-spacing="-3">ML</text></svg>`,  
        color: '#2d3277', bgColor: '#ffe600' 
    }
};


const products = [];
