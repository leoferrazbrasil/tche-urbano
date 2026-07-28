/* ==========================================================================
   Tchê Urbano & Santa Temporada - B2B Dashboard Analytics & Supabase Sync
   ========================================================================== */

// Initial Mock Metrics (SaaS Dashboard Analytics)
const MOCK_REDEMPTIONS = [
    { code: "TCHE-BRUXA-94", offer: "Rodízio de Pizzas Temático (+50 Sabores)", price: 94.00, status: "validado", created_at: "27/07/2026 20:45", validated_at: "27/07/2026 20:56" },
    { code: "TCHE-BRUXA-95", offer: "Rodízio de Pizzas Temático (+50 Sabores)", price: 94.00, status: "validado", created_at: "27/07/2026 19:30", validated_at: "27/07/2026 20:12" },
    { code: "TCHE-BRUXA-96", offer: "Rodízio de Pizzas Temático (+50 Sabores)", price: 94.00, status: "gerado", created_at: "27/07/2026 19:10", validated_at: "-" },
    { code: "TCHE-BRUXA-97", offer: "Rodízio de Pizzas Temático (+50 Sabores)", price: 94.00, status: "validado", created_at: "27/07/2026 18:22", validated_at: "27/07/2026 19:05" },
    { code: "TCHE-BRUXA-98", offer: "Rodízio de Pizzas Temático (+50 Sabores)", price: 94.00, status: "gerado", created_at: "27/07/2026 17:40", validated_at: "-" }
];

document.addEventListener("DOMContentLoaded", () => {
    fetchRealtimeMetrics();
    bindSearchFilter();
});

async function fetchRealtimeMetrics() {
    const client = getSupabaseClient();

    if (client) {
        try {
            // Attempt to query live 'cupons_resgatados' table from Supabase
            const { data, error } = await client
                .from("cupons_resgatados")
                .select("*")
                .order("created_at", { ascending: false });

            if (!error && data && data.length > 0) {
                renderTableData(data);
                calculateKPIs(data);
                return;
            }
        } catch (e) {
            console.warn("Supabase query fallback to local analytics", e);
        }
    }

    // Default Fallback
    renderTableData(MOCK_REDEMPTIONS);
    calculateKPIs(MOCK_REDEMPTIONS);
}

function calculateKPIs(items) {
    const totalIssued = items.length;
    const validatedItems = items.filter(i => i.status === "validado");
    const totalValidated = validatedItems.length;
    
    const totalRevenue = validatedItems.reduce((acc, curr) => acc + (parseFloat(curr.price) || 94.00), 0);
    const conversionRate = totalIssued > 0 ? Math.round((totalValidated / totalIssued) * 100) : 0;

    const kpiIssued = document.getElementById("kpiIssued");
    const kpiValidated = document.getElementById("kpiValidated");
    const kpiRevenue = document.getElementById("kpiRevenue");
    const kpiConversion = document.getElementById("kpiConversion");

    if (kpiIssued) kpiIssued.textContent = totalIssued;
    if (kpiValidated) kpiValidated.textContent = totalValidated;
    if (kpiRevenue) kpiRevenue.textContent = `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
    if (kpiConversion) kpiConversion.textContent = `${conversionRate}%`;
}

function renderTableData(items) {
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) return;

    tableBody.innerHTML = items.map(item => `
        <tr>
            <td><code>${item.code || item.codigo_voucher}</code></td>
            <td>${item.offer || "Rodízio de Pizzas Temático"}</td>
            <td><strong>R$ ${(parseFloat(item.price || item.preco_promocional) || 94.00).toFixed(2).replace('.', ',')}</strong></td>
            <td><span class="status-tag ${item.status}">${item.status.toUpperCase()}</span></td>
            <td>${item.created_at || item.data_resgate || "-"}</td>
            <td>${item.validated_at || item.data_validacao || "-"}</td>
        </tr>
    `).join("");
}

function bindSearchFilter() {
    const filterInput = document.getElementById("tableFilter");
    if (filterInput) {
        filterInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = MOCK_REDEMPTIONS.filter(item => 
                item.code.toLowerCase().includes(query) || 
                item.offer.toLowerCase().includes(query) ||
                item.status.toLowerCase().includes(query)
            );
            renderTableData(filtered);
        });
    }
}

async function toggleOfferActive(isActive) {
    const client = getSupabaseClient();
    if (client) {
        try {
            await client.from("ofertas").update({ status: isActive ? "ativa" : "pausada" }).eq("id", "of-07");
        } catch (e) {
            console.warn("Status toggle saved locally");
        }
    }
    alert(isActive ? "Oferta marcada como ATIVA!" : "Oferta PAUSADA temporariamente.");
}
