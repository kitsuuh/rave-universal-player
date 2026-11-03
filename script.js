
const API = "https://rave-analyzer.animesover1.workers.dev/";

const input = document.getElementById("videoUrl");
const video = document.getElementById("player");
const frame = document.getElementById("webFrame");
const statusText = document.getElementById("status");

const playButton = document.getElementById("playButton");
const shareButton = document.getElementById("shareButton");
const openButton = document.getElementById("openPageButton");

let hls = null;
let currentUrl = "";
let currentAnalysis = null;

function setStatus(message) {
  statusText.textContent = message;
}

function validUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function stopPlayer() {
  if (hls) {
    hls.destroy();
    hls = null;
  }

  video.pause();
  video.removeAttribute("src");
  video.load();
  video.hidden = true;

  frame.src = "about:blank";
  frame.hidden = true;
}

function showAnalysis(data) {
  currentAnalysis = data;

  let panel = document.getElementById("analysisResult");

  if (!panel) {
    panel = document.createElement("section");
    panel.id = "analysisResult";
    panel.className = "input-area";
    document.querySelector(".input-area").after(panel);
  }

  panel.replaceChildren();

  const heading = document.createElement("h2");
  heading.textContent = data.title || "Página identificada";
  panel.appendChild(heading);

  if (data.image) {
    const image = document.createElement("img");
    image.src = data.image;
    image.alt = "Capa do conteúdo";
    image.style.cssText =
      "width:130px;border-radius:10px;margin:10px 0";
    image.referrerPolicy = "no-referrer";
    panel.appendChild(image);
  }

  const description = document.createElement("p");
  description.textContent =
    data.description || "Sem descrição disponível.";
  panel.appendChild(description);

  const source = document.createElement("p");
  source.textContent = "Site: " + data.source;
  panel.appendChild(source);

  const compatibility = document.createElement("p");
  compatibility.textContent =
    "Reprodução: ainda precisa ser testada.";
  panel.appendChild(compatibility);

  const open = document.createElement("button");
  open.textContent = "ABRIR SITE ORIGINAL";
  open.onclick = () => window.open(
    data.pageUrl,
    "_blank",
    "noopener,noreferrer"
  );
  panel.appendChild(open);
}

async function analyzePage(url) {
  setStatus("Analisando a página...");
  playButton.disabled = true;

  try {
    const endpoint = new URL(API);
    endpoint.searchParams.set("url", url);

    const response = await fetch(endpoint.href, {
      method: "GET",
      headers: { Accept: "application/json" }
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Falha na análise.");
    }

    showAnalysis(data);
    currentUrl = url;
    setStatus("Análise concluída. Verifique a compatibilidade.");
  } catch (error) {
    setStatus("Não foi possível analisar: " + error.message);
  } finally {
    playButton.disabled = false;
  }
}

function playDirect(url) {
  stopPlayer();

  const path = new URL(url).pathname.toLowerCase();

  if (path.endsWith(".mp4")) {
    video.hidden = false;
    video.src = url;
    setStatus("MP4 identificado. Tentando reproduzir...");
    video.play().catch(() =>
      setStatus("Toque no botão de reprodução.")
    );
    return true;
  }

  if (path.endsWith(".m3u8")) {
    video.hidden = false;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    } else if (window.Hls && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
      setStatus("HLS não suportado neste navegador.");
      return false;
    }

    setStatus("Carregando vídeo HLS...");
    return true;
  }

  return false;
}

playButton.addEventListener("click", async () => {
  const url = validUrl(input.value.trim());

  if (!url) {
    setStatus("Digite um endereço HTTP ou HTTPS válido.");
    return;
  }

  currentUrl = url;
  stopPlayer();

  const path = new URL(url).pathname.toLowerCase();

  if (path.endsWith(".mp4") || path.endsWith(".m3u8")) {
    playDirect(url);
    return;
  }

  await analyzePage(url);
});

shareButton.addEventListener("click", async () => {
  if (!currentUrl) {
    setStatus("Analise um link primeiro.");
    return;
  }

  const share = new URL(window.location.href);
  share.search = "";
  share.searchParams.set("url", currentUrl);

  try {
    await navigator.clipboard.writeText(share.href);
    setStatus("Link do analisador copiado!");
  } catch {
    setStatus("Não foi possível copiar o link.");
  }
});

openButton.addEventListener("click", () => {
  if (currentUrl) {
    window.open(currentUrl, "_blank", "noopener,noreferrer");
  }
});

const shared = new URLSearchParams(location.search).get("url");

if (shared) {
  const url = validUrl(shared);

  if (url) {
    input.value = url;
    currentUrl = url;

    const path = new URL(url).pathname.toLowerCase();

    if (path.endsWith(".mp4") || path.endsWith(".m3u8")) {
      playDirect(url);
    } else {
      analyzePage(url);
    }
  }
}
