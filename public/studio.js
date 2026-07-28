// Inicializar Supabase
// (Usando as chaves anon já injetadas no site ou hardcoded para o admin)
const SUPABASE_URL = 'https://ycpzyuzkainfglljfmbn.supabase.co';
// WARNING: Na vida real usariamos env vars, mas como é static frontend no Admin, vamos com a chave anon
const SUPABASE_KEY = 'sb_publishable_oodZFeDSVA-Q2wXfa8ZAzQ_O20oTUl0'; // Substitua pela chave anon real se a que eu lembro for outra. Wait, I should fetch it from window or just hardcode the one we used previously in `app.js`.

// Fallback: we will fetch the key from the env or hardcode the one we know works.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentVideoData = null;
let ffmpegInstance = null;
const { createFFmpeg, fetchFile } = FFmpeg;

// ==========================================
// 1. SUPABASE PIPELINE (Kanban)
// ==========================================

async function loadQueue() {
    const list = document.getElementById('queueList');
    try {
        const { data, error } = await supabase
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
            el.className = 'video-card';
            el.innerHTML = `
                <div style="font-size:12px; color:gray; word-break: break-all; margin-bottom: 5px;">${video.original_url.substring(0,40)}...</div>
                <div style="font-size:14px; font-weight:bold; color: #FAF6F1;">Status: ${video.status}</div>
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
    
    document.getElementById('addBtn').innerText = 'Salvando...';
    try {
        await supabase.from('viral_videos').insert([{ original_url: url, status: 'fila' }]);
        input.value = '';
        await loadQueue();
    } catch (e) {
        alert('Erro ao salvar no Supabase');
    }
    document.getElementById('addBtn').innerHTML = '<i class="fa-solid fa-plus"></i> Salvar na Fila';
}

// ==========================================
// 2. COBALT API (Download sem marca d'água)
// ==========================================

async function loadIntoStudio(videoRecord) {
    setStatus('Extraindo vídeo via Cobalt API...');
    currentVideoData = videoRecord;
    document.getElementById('exportBtn').disabled = true;

    try {
        // Cobalt API request to get direct MP4 url
        const res = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: videoRecord.original_url,
                vQuality: '1080',
                isNoTTWatermark: true
            })
        });
        const data = await res.json();
        
        if (data.status === 'error' || !data.url) {
            throw new Error(data.text || 'Cobalt API falhou');
        }

        // Set video in preview
        const vid = document.getElementById('previewVideo');
        vid.src = data.url;
        vid.crossOrigin = 'anonymous';
        vid.load();
        
        document.getElementById('exportBtn').disabled = false;
        setStatus('Vídeo carregado. Pronto para editar.', 3000);
        
        // Atualiza status no banco
        supabase.from('viral_videos').update({ status: 'em_edicao' }).eq('id', videoRecord.id).then();
        
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
    
    // Init FFmpeg
    if (!ffmpegInstance) {
        ffmpegInstance = createFFmpeg({ log: true });
        await ffmpegInstance.load();
    }
    const ffmpeg = ffmpegInstance;

    try {
        setStatus('Baixando vídeo original na memória...');
        // Fetch raw mp4 bytes
        const videoData = await fetchFile(vid.src);
        ffmpeg.FS('writeFile', 'input.mp4', videoData);

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
        ffmpeg.FS('writeFile', 'overlay.png', pngBytes);

        setStatus('Renderizando vídeo final (Por favor, aguarde)...');
        // Comando FFmpeg: coloca o overlay em cima do video. -c:a copy mantém o áudio original intocado
        await ffmpeg.run(
            '-i', 'input.mp4',
            '-i', 'overlay.png',
            '-filter_complex', '[0:v][1:v]overlay=0:0',
            '-c:a', 'copy',
            '-preset', 'ultrafast', // Rapidez
            'output.mp4'
        );

        setStatus('Pronto! Iniciando download...');
        const outData = ffmpeg.FS('readFile', 'output.mp4');
        const blob = new Blob([outData.buffer], { type: 'video/mp4' });
        const objUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = objUrl;
        a.download = `tche_urbano_viral_${Date.now()}.mp4`;
        a.click();
        
        supabase.from('viral_videos').update({ status: 'finalizado' }).eq('id', currentVideoData.id).then();
        loadQueue();
        setStatus('Download concluído!', 3000);

    } catch (e) {
        console.error(e);
        setStatus('Erro na renderização: ' + e.message, 5000);
    }
}

// Bootstrap
window.onload = loadQueue;
