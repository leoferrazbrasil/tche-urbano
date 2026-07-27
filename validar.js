/* ==========================================================================
   Tchê Urbano - Merchant QR Code Scanner & Voucher Validation Engine
   ========================================================================== */

let html5QrcodeScanner = null;
let isCameraActive = false;

// Mock Database of Valid Vouchers & Hash Tokens
const VOUCHERS_DB = {
    "TCHE-BRUXA-94": {
        merchant: "Toca da Bruxa Canela",
        offer: "Rodízio de Pizzas Temático (+50 Sabores)",
        originalPrice: 149.00,
        promoPrice: 94.00,
        savings: 55.00,
        validUntil: "30/08/2026",
        used: false
    },
    "TCHE-FONDUE-89": {
        merchant: "Sequência de Fondue Gramado",
        offer: "Sequência Tradicional de Queijo, Carnes & Chocolate",
        originalPrice: 169.90,
        promoPrice: 89.90,
        savings: 80.00,
        validUntil: "30/08/2026",
        used: false
    },
    "TCHE-PIZZA-54": {
        merchant: "Rodízio de Pizzas Moinhos de Vento",
        offer: "Rodízio de Pizzas Artesanais + Calzone",
        originalPrice: 98.00,
        promoPrice: 54.90,
        savings: 43.10,
        validUntil: "30/08/2026",
        used: false
    }
};

document.addEventListener("DOMContentLoaded", () => {
    initURLParamValidation();
    bindEvents();
});

function bindEvents() {
    const btnToggle = document.getElementById("btnToggleCamera");
    if (btnToggle) {
        btnToggle.addEventListener("click", toggleCameraScanner);
    }
}

// Auto-validate if opened via URL param: validar.html?v=TCHE-BRUXA-94
function initURLParamValidation() {
    const urlParams = new URLSearchParams(window.location.search);
    const voucherCode = urlParams.get("v") || urlParams.get("code");

    if (voucherCode) {
        const manualInput = document.getElementById("manualCode");
        if (manualInput) manualInput.value = voucherCode.toUpperCase();
        processVoucherValidation(voucherCode.toUpperCase());
    }
}

function validateManualCode() {
    const manualInput = document.getElementById("manualCode");
    if (!manualInput || !manualInput.value.trim()) {
        alert("Por favor, digite o código do voucher.");
        return;
    }
    processVoucherValidation(manualInput.value.trim().toUpperCase());
}

function processVoucherValidation(code) {
    const resultBox = document.getElementById("resultBox");
    const resultHeader = document.getElementById("resultHeader");
    const resultDetails = document.getElementById("resultDetails");

    if (!resultBox || !resultHeader || !resultDetails) return;

    // Check DB or generated pattern
    const voucher = VOUCHERS_DB[code] || generateDynamicVoucher(code);

    if (voucher) {
        resultBox.className = "validation-result valid";
        resultHeader.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>VOUCHER VÁLIDO!</span>`;
        resultDetails.innerHTML = `
            <li><strong>Estabelecimento:</strong> ${voucher.merchant}</li>
            <li><strong>Oferta:</strong> ${voucher.offer}</li>
            <li><strong>Preço a Cobrar no Caixa:</strong> <span style="font-size: 1.2rem; color: #10B981; font-weight: 800;">R$ ${voucher.promoPrice.toFixed(2).replace('.', ',')}</span></li>
            <li><strong>Desconto Aplicado ao Cliente:</strong> R$ ${voucher.savings.toFixed(2).replace('.', ',')} OFF</li>
            <li><strong>Código do Voucher:</strong> <code>${code}</code></li>
            <li><strong>Data da Validação:</strong> ${new Date().toLocaleString('pt-BR')}</li>
        `;
    } else {
        resultBox.className = "validation-result invalid";
        resultHeader.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <span>VOUCHER INVÁLIDO OU EXPIRADO</span>`;
        resultDetails.innerHTML = `
            <li>O código <code>${code}</code> não foi encontrado ou já foi utilizado.</li>
            <li>Verifique se o código foi digitado corretamente.</li>
        `;
    }
}

// Fallback for dynamic vouchers
function generateDynamicVoucher(code) {
    if (code.startsWith("TCHE-")) {
        return {
            merchant: "Estabelecimento Parceiro Tchê Urbano",
            offer: "Oferta Exclusiva do Clube VIP",
            originalPrice: 120.00,
            promoPrice: 69.90,
            savings: 50.10,
            validUntil: "30/08/2026",
            used: false
        };
    }
    return null;
}

// Camera QR Scanner Toggle
function toggleCameraScanner() {
    const readerDiv = document.getElementById("reader");
    const btnToggle = document.getElementById("btnToggleCamera");

    if (!isCameraActive) {
        if (!html5QrcodeScanner) {
            html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } });
        }
        
        html5QrcodeScanner.render((decodedText) => {
            // Success QR Scan
            if (html5QrcodeScanner) {
                html5QrcodeScanner.clear();
                isCameraActive = false;
                if (btnToggle) btnToggle.innerHTML = `<i class="fa-solid fa-camera"></i> Abrir Câmera para Escanear`;
            }
            // Parse QR text (can be URL or code)
            let code = decodedText;
            if (decodedText.includes("v=")) {
                code = decodedText.split("v=")[1].split("&")[0];
            }
            processVoucherValidation(code.toUpperCase());
        }, (error) => {
            // QR Scan errors (silent)
        });

        isCameraActive = true;
        if (btnToggle) btnToggle.innerHTML = `<i class="fa-solid fa-xmark"></i> Fechar Câmera`;
    } else {
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear();
        }
        isCameraActive = false;
        if (btnToggle) btnToggle.innerHTML = `<i class="fa-solid fa-camera"></i> Abrir Câmera para Escanear`;
    }
}

function resetScanner() {
    const resultBox = document.getElementById("resultBox");
    const manualInput = document.getElementById("manualCode");
    if (resultBox) resultBox.className = "validation-result";
    if (manualInput) manualInput.value = "";
}
