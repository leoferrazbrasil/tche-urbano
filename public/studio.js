// Inicializar Supabase
var STUDIO_SUPABASE_URL = 'https://ycpzyuzkainfglljfmbn.supabase.co';
var STUDIO_SUPABASE_KEY = 'sb_publishable_oodZFeDSVA-Q2wXfa8ZAzQ_O20oTUl0';
var studioSupabase = window.supabase.createClient(STUDIO_SUPABASE_URL, STUDIO_SUPABASE_KEY);

var currentVideoData = null;
var ffmpegInstance = null;
var FFmpegClass = null;
var fetchFile = null;
var toBlobURL = null;

try {
    if (typeof FFmpegWASM !== 'undefined') {
        FFmpegClass = FFmpegWASM.FFmpeg;
    }
    if (typeof FFmpegUtil !== 'undefined') {
        fetchFile = FFmpegUtil.fetchFile;
        toBlobURL = FFmpegUtil.toBlobURL;
    }
} catch(e) {
    console.warn("FFmpeg WASM não carregado:", e);
}

// ==========================================
// 1. SUPABASE PIPELINE (Kanban)
// ==========================================

async function loadQueue() {
    const list = document.getElementById('queueList');
    try {
        const { data, error } = await studioSupabase
            .from('viral_videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        list.innerHTML = '';
        if (data.length === 0) {
            list.innerHTML = '<p style="color:#777; font-size:14px;">Fila vazia. Cole um link acima!</p>';
            return;
        }

        data.forEach(video => {
            const el = document.createElement('div');
            el.className = 'video-card ' + video.status;
            
            // Format status
            let statusText = 'Na Fila';
            let icon = 'fa-clock';
            let statusColor = '#aaa';
            if (video.status === 'em_edicao') {
                statusText = 'Em Edição';
                icon = 'fa-spinner fa-spin';
                statusColor = '#f39c12';
            } else if (video.status === 'finalizado') {
                statusText = 'Finalizado';
                icon = 'fa-check-circle';
                statusColor = '#2ecc71';
            }

            el.innerHTML = `
                <div class="video-info">
                    <i class="fa-brands fa-instagram" style="font-size:18px; color:#E1306C;"></i>
                    <div class="video-url">${video.original_url.substring(0, 30)}...</div>
                </div>
                <div class="video-status" style="color: ${statusColor};">
                    <i class="fa-solid ${icon}"></i> ${statusText}
                </div>
            `;
            el.onclick = () => loadIntoStudio(video);
            list.appendChild(el);
        });
    } catch (e) {
        console.error('Supabase Error:', e);
        list.innerHTML = '<p style="color:red; font-size:14px;">Erro ao carregar do Supabase. Verifique se a tabela viral_videos existe.</p>';
    }
}

async function addVideo() {
    const input = document.getElementById('urlInput');
    const url = input.value.trim();
    if (!url) return;
    
    const btn = document.getElementById('addBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
    btn.disabled = true;
    
    try {
        const { error } = await studioSupabase.from('viral_videos').insert([{ original_url: url, status: 'fila' }]);
        if (error) {
            console.error("Insert error:", error);
            alert("Erro Supabase: " + error.message);
            throw error;
        }
        input.value = '';
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo com Sucesso!';
        btn.style.backgroundColor = '#2ecc71';
        
        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-plus"></i> Salvar na Fila';
            btn.style.backgroundColor = '';
            btn.disabled = false;
        }, 2000);

        await loadQueue();
    } catch (e) {
        btn.innerHTML = '<i class="fa-solid fa-plus"></i> Salvar na Fila';
        btn.disabled = false;
        alert('Erro ao salvar no Supabase. Veja o console.');
    }
}

// ==========================================
// 2. COBALT API (Download sem marca d'água)
// ==========================================

async function loadIntoStudio(videoRecord) {
    setStatus('Extraindo vídeo via Cobalt API...');
    currentVideoData = videoRecord;
    document.getElementById('exportBtn').disabled = true;

    try {
        let videoMp4Url = null;
        
        try {
            // Tentativa de usar a API Cobalt (v7 desligada, pode falhar)
            const res = await fetch('https://api.cobalt.tools/api/json', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: videoRecord.original_url, vQuality: '1080', isNoTTWatermark: true })
            });
            const data = await res.json();
            if (data.status === 'error' || !data.url) throw new Error(data.text);
            videoMp4Url = data.url;
        } catch(apiError) {
            console.warn("API de extração falhou:", apiError);
            const fallback = prompt("A extração automática falhou (a API gratuita mudou suas políticas de acesso).\n\nPara continuarmos o teste do FFmpeg, vá em snapinsta.app, baixe o link do vídeo, ou cole a URL direta de um .mp4 aqui:");
            if (fallback && fallback.trim().length > 5) {
                videoMp4Url = fallback.trim();
            } else {
                throw new Error("Nenhum link MP4 fornecido no fallback.");
            }
        }

        // Contornar bloqueios de CORS para o vídeo externo
        const corsVideoUrl = 'https://corsproxy.io/?' + encodeURIComponent(videoMp4Url);

        // Set video in preview
        const vid = document.getElementById('previewVideo');
        vid.src = corsVideoUrl;
        vid.crossOrigin = 'anonymous';
        vid.load();
        
        document.getElementById('exportBtn').disabled = false;
        setStatus('Vídeo carregado. Pronto para editar.', 3000);
        
        // Atualiza status no banco
        studioSupabase.from('viral_videos').update({ status: 'em_edicao' }).eq('id', videoRecord.id).then();
        
    } catch (e) {
        console.error(e);
        setStatus('Erro ao extrair vídeo: ' + e.message, 5000);
    }
}

// ==========================================
// 3. FFMPEG STUDIO ENGINE
// ==========================================

function updateText() {
    const text = document.getElementById('headlineInput').value;
    document.getElementById('overlayTextDisplay').innerText = text;
    document.getElementById('renderTextDisplay').innerText = text;
}

function setStatus(msg, timeout = 0) {
    const sb = document.getElementById('statusBar');
    sb.innerText = msg;
    sb.style.display = 'block';
    if (timeout > 0) {
        setTimeout(() => sb.style.display = 'none', timeout);
    }
}

async function exportVideo() {
    if (!currentVideoData) return;
    const vid = document.getElementById('previewVideo');
    if (!vid.src) return;

    setStatus('Carregando motor FFmpeg (pode demorar na primeira vez)...');
    
    // Init FFmpeg v0.12
    if (!ffmpegInstance) {
        ffmpegInstance = new FFmpegClass();
        ffmpegInstance.on('log', ({ message }) => {
            console.log("FFmpeg:", message);
        });
        
        const coreBase = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        const ffmpegBase = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd';
        
        await ffmpegInstance.load({
            coreURL: await toBlobURL(`${coreBase}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${coreBase}/ffmpeg-core.wasm`, 'application/wasm'),
            workerURL: await toBlobURL(`${ffmpegBase}/814.ffmpeg.js`, 'text/javascript')
        });
    }
    const ffmpeg = ffmpegInstance;

    try {
        setStatus('Baixando vídeo original na memória...');
        // Fetch raw mp4 bytes
        const videoData = await fetchFile(vid.src);
        await ffmpeg.writeFile('input.mp4', videoData);

        setStatus('Gerando camada transparente (Overlay)...');
        // Usar html2canvas no renderTarget (1080x1920 transparente)
        const target = document.getElementById('renderTarget');
        const canvas = await html2canvas(target, {
            backgroundColor: null, // Transparente
            scale: 1,
            width: 1080,
            height: 1920,
            logging: false
        });
        
        // Converte pra PNG Blob
        const pngData = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const pngBytes = await fetchFile(pngData);
        await ffmpeg.writeFile('overlay.png', pngBytes);

        setStatus('Renderizando vídeo final (Por favor, aguarde)...');
        // Comando FFmpeg: coloca o overlay em cima do video.
        await ffmpeg.exec([
            '-i', 'input.mp4',
            '-i', 'overlay.png',
            '-filter_complex', '[0:v][1:v]overlay=0:0',
            '-c:a', 'copy',
            '-preset', 'ultrafast',
            'output.mp4'
        ]);

        setStatus('Pronto! Iniciando download...');
        const outData = await ffmpeg.readFile('output.mp4');
        const blob = new Blob([outData.buffer], { type: 'video/mp4' });
        const objUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = objUrl;
        a.download = `tche_urbano_viral_${Date.now()}.mp4`;
        a.click();
        
        studioSupabase.from('viral_videos').update({ status: 'finalizado' }).eq('id', currentVideoData.id).then();
        loadQueue();
        setStatus('Download concluído!', 3000);

    } catch (e) {
        console.error(e);
        setStatus('Erro na renderização: ' + e.message, 5000);
    }
}

// Bootstrap (Call immediately since script is at the end of body)
loadQueue();
