/* ==========================================================================
   Tchê Urbano - Merchant QR Code Scanner & Voucher Validation Engine
   ========================================================================== */

let html5QrcodeScanner = null;
let isCameraActive = false;

// VOUCHERS_DB mock removido. A validação agora ocorre diretamente no Supabase.

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
    validateVoucherCode(code);
}

async function validateVoucherCode(codeStr) {
    const code = codeStr.toUpperCase().trim();
    showLoadingState();

    const client = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
    if (!client) {
        showErrorState("Erro interno: Falha ao conectar ao banco de dados.");
        return;
    }

    try {
        const { data, error } = await client
            .from('cupons_resgatados')
            .select(`
                *,
                ofertas (
                    titulo,
                    preco_original,
                    preco_promocional,
                    parceiros (
                        nome_estabelecimento
                    )
                )
            `)
            .eq('codigo_voucher', code)
            .single();

        if (error || !data) {
            showErrorState("Cupom inválido ou não encontrado no sistema.");
            return;
        }

        if (data.status === "validado") {
            showErrorState(`Cupom já utilizado em ${new Date(data.data_validacao).toLocaleString("pt-BR")}.`);
            return;
        }

        // Simula verificação no banco... e atualiza para validado
        const { error: updateError } = await client
            .from('cupons_resgatados')
            .update({ 
                status: 'validado',
                data_validacao: new Date().toISOString()
            })
            .eq('id', data.id);

        if (updateError) throw updateError;

        // Sucesso
        const savings = (parseFloat(data.ofertas.preco_original) - parseFloat(data.ofertas.preco_promocional)).toFixed(2);
        showSuccessState({
            merchant: data.ofertas.parceiros.nome_estabelecimento,
            offer: data.ofertas.titulo,
            promoPrice: parseFloat(data.ofertas.preco_promocional),
            savings: savings
        });
        
    } catch (e) {
        console.error("Erro na validação:", e);
        showErrorState("Erro ao validar cupom. Verifique a conexão.");
    }
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
