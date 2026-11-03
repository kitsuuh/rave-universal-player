
const input = document.getElementById("videoUrl");
const video = document.getElementById("player");
const frame = document.getElementById("webFrame");
const statusText = document.getElementById("status");

let hls = null;
let currentUrl = "";

function validUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol)
      ? url.href
      : null;
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

function playContent(value) {
  const url = validUrl(value);

  if (!url) {
    statusText.textContent = "Endereço inválido.";
    return;
  }

  stopPlayer();
  currentUrl = url;
  input.value = url;

  const path = new URL(url).pathname.toLowerCase();

  if (path.endsWith(".mp4")) {
    video.hidden = false;
    video.src = url;
    statusText.textContent = "Vídeo MP4 carregado.";
    video.play().catch(() => {});
    return;
  }

  if (path.endsWith(".m3u8")) {
    video.hidden = false;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.play().catch(() => {});
    } else if (window.Hls && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else {
      statusText.textContent = "Este navegador não suporta HLS.";
      return;
    }

    statusText.textContent = "Carregando transmissão HLS...";
    return;
  }

  frame.hidden = false;
  frame.src = url;
  statusText.textContent =
    "Tentando abrir a página. O site precisa permitir incorporação.";
}

document.getElementById("playButton").onclick = () => {
  playContent(input.value.trim());
};

document.getElementById("shareButton").onclick = async () => {
  if (!currentUrl) {
    statusText.textContent = "Carregue um vídeo primeiro.";
    return;
  }

  const shareUrl = new URL(window.location.href);
  shareUrl.search = "";
  shareUrl.searchParams.set("url", currentUrl);

  try {
    await navigator.clipboard.writeText(shareUrl.href);
    statusText.textContent = "Link compartilhável copiado!";
  } catch {
    statusText.textContent = "Não foi possível copiar. Copie o endereço da página.";
  }
};

document.getElementById("openPageButton").onclick = () => {
  if (currentUrl) {
    window.open(currentUrl, "_blank", "noopener,noreferrer");
  }
};

// Carrega automaticamente um vídeo compartilhado pela URL.
const sharedUrl = new URLSearchParams(location.search).get("url");

if (sharedUrl) {
  input.value = sharedUrl;
  playContent(sharedUrl);
}
