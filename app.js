/* ==========================================================================
   Tchê Urbano - Main Application Logic & Data Engine
   ========================================================================== */

// Mock Database of Initial Partner Offers
const OFFERS_DATA = [
    {
        id: "of-01",
        title: "Sequência de Fondue Tradicional (Queijo, Carnes & Chocolate)",
        city: "gramado",
        location: "Gramado • Centro",
        category: "fondue",
        image: "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=600&q=80",
        oldPrice: 169.90,
        newPrice: 89.90,
        discountPercent: 47,
        rating: 4.9,
        reviewsCount: 142,
        popular: true,
        whatsappText: "Vim pelo site Tchê Urbano! Quero resgatar o cupom da Sequência de Fondue Tradicional em Gramado (R$ 89,90)."
    },
    {
        id: "of-02",
        title: "Rodízio de Pizzas Artesanais + Calzone & Sobremesas",
        city: "poa",
        location: "Porto Alegre • Moinhos de Vento",
        category: "pizzaria",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
        oldPrice: 98.00,
        newPrice: 54.90,
        discountPercent: 44,
        rating: 4.8,
        reviewsCount: 98,
        popular: true,
        whatsappText: "Vim pelo site Tchê Urbano! Quero resgatar o cupom do Rodízio de Pizzas em Moinhos de Vento (R$ 54,90)."
    },
    {
        id: "of-03",
        title: "Combo Smash Burger Duplo + Batata Rústica + Refri",
        city: "poa",
        location: "Porto Alegre • Cidade Baixa",
        category: "hamburguer",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
        oldPrice: 48.00,
        newPrice: 27.90,
        discountPercent: 42,
        rating: 4.9,
        reviewsCount: 86,
        popular: false,
        whatsappText: "Vim pelo site Tchê Urbano! Quero resgatar o Combo Smash Burger Duplo na Cidade Baixa (R$ 27,90)."
    },
    {
        id: "of-04",
        title: "Passaporte Completo Atrações e Museu de Cera",
        city: "gramado",
        location: "Canela / Gramado • Av. das Hortênsias",
        category: "parques",
        image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
        oldPrice: 220.00,
        newPrice: 129.90,
        discountPercent: 41,
        rating: 5.0,
        reviewsCount: 215,
        popular: true,
        whatsappText: "Vim pelo site Tchê Urbano! Quero resgatar o Passaporte de Atrações em Gramado/Canela (R$ 129,90)."
    },
    {
        id: "of-05",
        title: "Café Colonial Completo (Mais de 80 Itens Típicos)",
        city: "gramado",
        location: "Gramado • Estrada do Caracol",
        category: "cafe",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
        oldPrice: 140.00,
        newPrice: 79.90,
        discountPercent: 43,
        rating: 4.9,
        reviewsCount: 167,
        popular: true,
        whatsappText: "Vim pelo site Tchê Urbano! Quero resgatar o cupom do Café Colonial Completo em Gramado (R$ 79,90)."
    },
    {
        id: "of-06",
        title: "Rodízio Completo de Carnes Nobres & Buffet de Saladas",
        city: "poa",
        location: "Porto Alegre • Passo d'Areia",
        category: "fondue",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        oldPrice: 130.00,
        newPrice: 74.90,
        discountPercent: 42,
        rating: 4.8,
        reviewsCount: 110,
        popular: false,
        whatsappText: "Vim pelo site Tchê Urbano! Quero resgatar o Rodízio de Carnes Nobres em POA (R$ 74,90)."
    },
    {
        id: "of-07",
        title: "Toca da Bruxa Canela | Rodízio de Pizzas Temático (+50 Sabores)",
        city: "gramado",
        location: "Gramado & Canela • Centro",
        category: "pizzaria",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
        oldPrice: 149.00,
        newPrice: 94.00,
        discountPercent: 37,
        rating: 5.0,
        reviewsCount: 1,
        popular: true,
        whatsappText: "Vim pelo site Tchê Urbano! Quero resgatar o cupom da Toca da Bruxa Canela (R$ 94,00)."
    }
];

// App State
let currentCategory = "all";
let currentCity = "poa";
let searchQuery = "";
let currentSort = "popular";

// DOM Loaded Initialization
document.addEventListener("DOMContentLoaded", () => {
    initEvents();
    initMobileMenu();
    renderOffers();
});

function initEvents() {
    // Category pill click handler
    const pills = document.querySelectorAll(".cat-pill");
    pills.forEach(pill => {
        pill.addEventListener("click", () => {
            pills.forEach(p => {
                p.classList.remove("active");
                p.setAttribute("aria-selected", "false");
            });
            pill.classList.add("active");
            pill.setAttribute("aria-selected", "true");
            currentCategory = pill.getAttribute("data-cat");
            renderOffers();
        });
    });

    // City selector change
    const citySelect = document.getElementById("citySelect");
    if (citySelect) {
        citySelect.addEventListener("change", (e) => {
            currentCity = e.target.value;
            renderOffers();
        });
    }

    // Search input typing
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderOffers();
        });
    }
}

function initMobileMenu() {
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const navMenu = document.getElementById("navMenu");
    const menuIcon = document.getElementById("menuIcon");

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener("click", () => {
            const isOpen = navMenu.classList.toggle("active");
            mobileMenuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
            if (menuIcon) {
                menuIcon.className = isOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars";
            }
        });

        // Close menu on click outside
        document.addEventListener("click", (e) => {
            if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target) && navMenu.classList.contains("active")) {
                navMenu.classList.remove("active");
                mobileMenuBtn.setAttribute("aria-expanded", "false");
                if (menuIcon) {
                    menuIcon.className = "fa-solid fa-bars";
                }
            }
        });
    }
}

function filterOffers() {
    renderOffers();
}

function sortOffers() {
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        currentSort = sortSelect.value;
        renderOffers();
    }
}

function renderOffers() {
    const grid = document.getElementById("offersGrid");
    if (!grid) return;
    
    // Filter
    let filtered = OFFERS_DATA.filter(item => {
        const matchCategory = (currentCategory === "all") || (item.category === currentCategory);
        const matchCity = (currentCity === "all") || (item.city === currentCity);
        const matchSearch = searchQuery === "" || 
            item.title.toLowerCase().includes(searchQuery) || 
            item.location.toLowerCase().includes(searchQuery);
        
        return matchCategory && matchCity && matchSearch;
    });

    // Sort
    if (currentSort === "popular") {
        filtered.sort((a, b) => b.reviewsCount - a.reviewsCount);
    } else if (currentSort === "discount") {
        filtered.sort((a, b) => b.discountPercent - a.discountPercent);
    } else if (currentSort === "price-low") {
        filtered.sort((a, b) => a.newPrice - b.newPrice);
    }

    // Render HTML
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <i class="fa-solid fa-cookie-bite" style="font-size: 3rem; margin-bottom: 16px; color: var(--primary);"></i>
                <h3>Nenhuma experiência encontrada</h3>
                <p>Tente mudar os filtros de cidade ou busca para ver mais ofertas.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(item => `
        <article class="offer-card" aria-label="${item.title}">
            <div class="card-img-wrapper">
                <img src="${item.image}" alt="${item.title}" class="card-img" loading="lazy" width="600" height="400">
                <span class="card-badge">-${item.discountPercent}% OFF</span>
                <span class="card-badge-vip"><i class="fa-solid fa-crown" aria-hidden="true"></i> Cupom VIP</span>
            </div>
            <div class="card-body">
                <div class="card-location">
                    <i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${item.location}
                </div>
                <h3 class="card-title">${item.title}</h3>
                <div class="card-desc">⭐ ${item.rating} (${item.reviewsCount} avaliações) • Resgate imediato</div>
                
                <div class="card-price-row">
                    <div>
                        <span class="price-old">De R$ ${item.oldPrice.toFixed(2).replace('.', ',')}</span> <br>
                        <span class="price-new">R$ ${item.newPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>

                <a href="https://wa.me/5551996737359?text=${encodeURIComponent(item.whatsappText)}"
                   target="_blank"
                   rel="noopener"
                   class="btn btn-card-resgate"
                   aria-label="Resgatar cupom para ${item.title} no WhatsApp">
                    <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Resgatar no WhatsApp
                </a>
            </div>
        </article>
    `).join("");
}
