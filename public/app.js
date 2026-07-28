/* ==========================================================================
   Tchê Urbano - Main Application Logic & Data Engine
   ========================================================================== */

let OFFERS_DATA = [];

async function loadOffersFromSupabase() {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { data, error } = await client
            .from('ofertas')
            .select(`
                *,
                parceiros (
                    nome_estabelecimento,
                    cidade,
                    bairro_endereco,
                    whatsapp,
                    categoria
                )
            `)
            .eq('status', 'ativa');

        if (error) throw error;
        
        if (data && data.length > 0) {
            OFFERS_DATA = data.map(oferta => {
                const cidadeBd = oferta.parceiros.cidade.toLowerCase();
                let cityCode = cidadeBd;
                if (cidadeBd.includes('porto alegre')) cityCode = 'poa';
                if (cidadeBd.includes('gramado') || cidadeBd.includes('canela')) cityCode = 'gramado';

                return {
                    id: oferta.id,
                    title: oferta.titulo,
                    city: cityCode,
                    location: `${oferta.parceiros.cidade} • ${oferta.parceiros.bairro_endereco}`,
                    category: oferta.parceiros.categoria,
                    image: oferta.imagem_url,
                    oldPrice: parseFloat(oferta.preco_original),
                    newPrice: parseFloat(oferta.preco_promocional),
                    discountPercent: oferta.desconto_percent,
                    rating: 5.0, // mock temporário para rating
                    reviewsCount: Math.floor(Math.random() * 200) + 50,
                    popular: oferta.destaque_vip,
                    whatsappText: `Vim pelo site Tchê Urbano! Quero resgatar o cupom da ${oferta.titulo}.`
                };
            });
        }
    } catch (error) {
        console.error("Erro ao carregar ofertas:", error);
    }
}

// App State
let currentCategory = "all";
let currentCity = "poa";
let searchQuery = "";
let currentSort = "popular";

// DOM Loaded Initialization
document.addEventListener("DOMContentLoaded", async () => {
    initEvents();
    initMobileMenu();
    await loadOffersFromSupabase();
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

                <button onclick="gerarVoucher(this, '${item.id}', '${item.newPrice}', '${encodeURIComponent(item.location)}', '${encodeURIComponent(item.title)}', '${item.oldPrice}')"
                   class="btn btn-card-resgate"
                   aria-label="Resgatar cupom para ${item.title}">
                    <i class="fa-solid fa-ticket" aria-hidden="true"></i> Resgatar Voucher VIP (QR Code)
                </button>
            </div>
        </article>
    `).join("");
}

// Lógica para gerar o voucher no Supabase e redirecionar
async function gerarVoucher(btn, ofertaId, preco, locationUrl, titleUrl, oldPrice) {
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Gerando...`;
    btn.disabled = true;

    const client = getSupabaseClient();
    if (!client) {
        alert("Erro de conexão com o servidor. Tente novamente.");
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    const randomCode = 'TCHE-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        const { data, error } = await client
            .from('cupons_resgatados')
            .insert([
                {
                    oferta_id: ofertaId,
                    codigo_voucher: randomCode,
                    price: parseFloat(preco),
                    status: 'gerado'
                }
            ])
            .select();

        if (error) throw error;

        window.location.href = `/voucher?code=${randomCode}&m=${locationUrl}&t=${titleUrl}&old=${oldPrice}&new=${preco}`;
        
        
    } catch (error) {
        console.error("Erro ao gerar cupom:", error);
        alert("Não foi possível gerar seu voucher agora. Tente novamente.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
