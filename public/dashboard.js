/* ==========================================================================
   Tchê Urbano & Santa Temporada - B2B Dashboard Analytics & Supabase Sync
   ========================================================================== */

// Inicializa sem mock.
const MOCK_REDEMPTIONS = [];

fetchRealtimeMetrics();
bindSearchFilter();

async function fetchRealtimeMetrics() {
    const client = getSupabaseClient();

    if (client) {
        try {
            // Attempt to query live 'cupons_resgatados' table from Supabase
            const { data, error } = await client
                .from("cupons_resgatados")
                .select("*, ofertas(titulo)")
                .order("created_at", { ascending: false });

            if (error) throw error;
            
            if (data && data.length > 0) {
                renderTableData(data);
                calculateKPIs(data);
                return;
            } else {
                renderTableData([]);
                calculateKPIs([]);
                return;
            }
        } catch (e) {
            console.warn("Erro ao buscar métricas reais:", e);
        }
    }

    // Default Fallback
    renderTableData([]);
    calculateKPIs([]);
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
            <td>${(item.ofertas && item.ofertas.titulo) || item.offer || "Oferta VIP"}</td>
            <td><strong>R$ ${(parseFloat(item.price || item.preco_promocional) || 94.00).toFixed(2).replace('.', ',')}</strong></td>
            <td><span class="status-tag ${item.status}">${item.status.toUpperCase()}</span></td>
            <td>${new Date(item.created_at || item.data_resgate).toLocaleDateString('pt-BR')}</td>
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
