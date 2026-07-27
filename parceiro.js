/* ==========================================================================
   Tchê Urbano - B2B Partner Dashboard & Offer Wizard Engine
   ========================================================================== */

// Initial State
let currentStep = 1;

const formData = {
    businessName: "Pizzaria Moinhos de Vento",
    businessCity: "poa",
    businessCategory: "pizzaria",
    businessNeighborhood: "Moinhos de Vento - Rua Fernando Gomes, 120",
    businessWhatsapp: "(51) 99673-7359",
    offerTitle: "Rodízio de Pizzas Artesanais + Calzone & Sobremesas",
    offerDescription: "Válido de Terça a Sexta. Inclui mais de 30 sabores de pizza artesanal.",
    oldPrice: 98.00,
    newPrice: 54.90,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"
};

// DOM Content Loaded
document.addEventListener("DOMContentLoaded", () => {
    loadSavedState();
    bindInputEvents();
    updateStepperUI();
    updateLivePreview();
});

// Bind Input Listeners for Live Preview
function bindInputEvents() {
    const inputs = [
        "businessName", "businessCity", "businessCategory", "businessNeighborhood",
        "businessWhatsapp", "offerTitle", "offerDescription", "oldPrice", "newPrice", "imageUrl"
    ];

    const updateValue = (id, val) => {
        if (id === "oldPrice" || id === "newPrice") {
            formData[id] = parseFloat(val) || 0;
        } else {
            formData[id] = val;
        }
        saveState();
        updateLivePreview();
    };

    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener("input", (e) => updateValue(id, e.target.value));
            element.addEventListener("change", (e) => updateValue(id, e.target.value));
        }
    });
}

// Preset Image Selection
function setPresetImage(url) {
    const imgInput = document.getElementById("imageUrl");
    if (imgInput) {
        imgInput.value = url;
        formData.imageUrl = url;
        saveState();
        updateLivePreview();
    }
}

// Wizard Step Navigation
function goToStep(step) {
    if (step > currentStep) {
        if (!validateStep(currentStep)) {
            return;
        }
    }
    
    currentStep = step;
    updateStepperUI();

    if (step === 4) {
        renderReviewSummary();
    }
}

function validateStep(step) {
    if (step === 1) {
        if (!formData.businessName || !formData.businessNeighborhood || !formData.businessWhatsapp) {
            alert("Por favor, preencha o Nome do Estabelecimento, Bairro/Endereço e WhatsApp para continuar.");
            return false;
        }
    } else if (step === 2) {
        const oldVal = parseFloat(document.getElementById("oldPrice").value) || 0;
        const newVal = parseFloat(document.getElementById("newPrice").value) || 0;
        const titleVal = document.getElementById("offerTitle").value.trim();

        formData.oldPrice = oldVal;
        formData.newPrice = newVal;
        formData.offerTitle = titleVal;

        if (!titleVal || oldVal <= 0 || newVal <= 0) {
            alert("Por favor, informe o Título da Oferta, Preço Original e Preço Promocional.");
            return false;
        }
        if (newVal >= oldVal) {
            alert("O Preço Promocional (R$ " + newVal + ") deve ser MENOR do que o Preço Original (R$ " + oldVal + ").");
            return false;
        }
    }
    return true;
}

function updateStepperUI() {
    for (let i = 1; i <= 4; i++) {
        const pane = document.getElementById(`stepPane${i}`);
        if (pane) {
            if (i === currentStep) {
                pane.classList.add("active");
            } else {
                pane.classList.remove("active");
            }
        }
    }

    const stepItems = document.querySelectorAll(".step-item");
    stepItems.forEach((item, idx) => {
        const stepNum = idx + 1;
        if (stepNum < currentStep) {
            item.classList.add("completed");
            item.classList.remove("active");
        } else if (stepNum === currentStep) {
            item.classList.add("active");
            item.classList.remove("completed");
        } else {
            item.classList.remove("active", "completed");
        }
    });

    const progress = document.getElementById("stepperProgress");
    if (progress) {
        const percentage = ((currentStep - 1) / 3) * 100;
        progress.style.width = `${percentage}%`;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Live Preview Updater
function updateLivePreview() {
    const previewTitle = document.getElementById("previewTitle");
    const previewLocation = document.getElementById("previewLocation");
    const previewDesc = document.getElementById("previewDesc");
    const previewOldPrice = document.getElementById("previewOldPrice");
    const previewNewPrice = document.getElementById("previewNewPrice");
    const previewBadge = document.getElementById("previewBadge");
    const previewImg = document.getElementById("previewImg");
    const calculatedDiscount = document.getElementById("calculatedDiscount");

    const cityMap = {
        poa: "Porto Alegre",
        gramado: "Gramado & Canela",
        litoral: "Litoral Gaúcho",
        bento: "Bento Gonçalves"
    };

    const cityName = cityMap[formData.businessCity] || "Rio Grande do Sul";
    const neighborhood = formData.businessNeighborhood ? formData.businessNeighborhood.split("-")[0] : "Centro";

    if (previewTitle) previewTitle.textContent = formData.offerTitle || "Título da Sua Oferta Aqui";
    if (previewLocation) previewLocation.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${cityName} • ${neighborhood}`;
    if (previewDesc) previewDesc.textContent = `⭐ 5.0 (${formData.businessName || "Novo Parceiro"}) • Resgate imediato`;

    // Price & Discount Calculation
    const oldP = parseFloat(formData.oldPrice) || 0;
    const newP = parseFloat(formData.newPrice) || 0;

    let discountPercent = 0;
    let savingsAmount = 0;

    if (oldP > 0 && newP > 0 && oldP > newP) {
        savingsAmount = oldP - newP;
        discountPercent = Math.round((savingsAmount / oldP) * 100);
    }

    if (previewOldPrice) previewOldPrice.textContent = `De R$ ${oldP.toFixed(2).replace('.', ',')}`;
    if (previewNewPrice) previewNewPrice.textContent = `R$ ${newP.toFixed(2).replace('.', ',')}`;
    if (previewBadge) previewBadge.textContent = `-${discountPercent}% OFF`;
    if (calculatedDiscount) {
        calculatedDiscount.textContent = `${discountPercent}% OFF (Economia de R$ ${savingsAmount.toFixed(2).replace('.', ',')})`;
    }

    if (previewImg && formData.imageUrl) {
        previewImg.src = formData.imageUrl;
    }
}

// Review Summary Renderer (Step 4)
function renderReviewSummary() {
    const list = document.getElementById("reviewList");
    if (!list) return;

    list.innerHTML = `
        <li><strong>Estabelecimento:</strong> ${formData.businessName}</li>
        <li><strong>Endereço / Bairro:</strong> ${formData.businessNeighborhood}</li>
        <li><strong>WhatsApp Comercial:</strong> ${formData.businessWhatsapp}</li>
        <li><strong>Título da Oferta:</strong> ${formData.offerTitle}</li>
        <li><strong>Descrição:</strong> ${formData.offerDescription}</li>
        <li><strong>Preço De / Por:</strong> <del>De R$ ${parseFloat(formData.oldPrice).toFixed(2)}</del> por <strong>R$ ${parseFloat(formData.newPrice).toFixed(2)}</strong></li>
    `;
}

// Submit Partner Offer via WhatsApp Payload (Direct API Endpoint with Bulletproof Formatting)
function submitPartnerOffer() {
    const message = `*NOVO CADASTRO DE PARCEIRO FUNDADOR (TCHÊ URBANO)*\n\n` +
        `► *Estabelecimento:* ${formData.businessName}\n` +
        `► *Cidade/Endereço:* ${formData.businessCity.toUpperCase()} - ${formData.businessNeighborhood}\n` +
        `► *WhatsApp do Lojista:* ${formData.businessWhatsapp}\n` +
        `► *Categoria:* ${formData.businessCategory}\n\n` +
        `► *OFERTA:* ${formData.offerTitle}\n` +
        `► *Descrição:* ${formData.offerDescription}\n` +
        `► *De:* R$ ${parseFloat(formData.oldPrice).toFixed(2)} | *Por:* R$ ${parseFloat(formData.newPrice).toFixed(2)}\n` +
        `► *Foto:* ${formData.imageUrl}\n\n` +
        `Solicito ativação do anúncio no Clube VIP!`;

    // Direct WhatsApp API endpoint (bypasses wa.me redirector double-encoding issue)
    const whatsappUrl = `https://api.whatsapp.com/send?phone=5551996737359&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
}

// LocalStorage Persistence
function saveState() {
    try {
        localStorage.setItem("tche_partner_wizard_data", JSON.stringify(formData));
    } catch (e) {
        console.warn("Storage full or disabled");
    }
}

function loadSavedState() {
    try {
        const saved = localStorage.getItem("tche_partner_wizard_data");
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(formData, parsed);

            Object.keys(formData).forEach(key => {
                const el = document.getElementById(key);
                if (el) el.value = formData[key];
            });
        }
    } catch (e) {
        console.warn("Failed to load saved state");
    }
}
