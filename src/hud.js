import { Joystick } from './joystick.js';

// O arquipélago cabe num círculo de ~220 unidades; o mapa usa essa escala.
const WORLD_RADIUS = 220;

/** Painel de missão, mensagens, minimapa e botões — tudo em HTML sobre o canvas. */
export class Hud {
  constructor() {
    this.aboard = document.getElementById('aboard');
    this.delivered = document.getElementById('delivered');
    this.objective = document.getElementById('objective');
    this.toastElement = document.getElementById('toast');
    this.modeButton = document.getElementById('mode-button');
    this.soundButton = document.getElementById('sound-button');
    this.helpButton = document.getElementById('help-button');
    this.helpPanel = document.getElementById('help');
    this.victoryPanel = document.getElementById('victory');
    this.startPanel = document.getElementById('start');
    this.touchPanel = document.getElementById('touch');
    this.fullscreenButton = document.getElementById('fullscreen-button');
    this.minimap = document.getElementById('minimap');
    this.minimapContext = this.minimap.getContext('2d');
    this.toastTimer = 0;
  }

  onModeToggle(callback) {
    this.modeButton.addEventListener('click', callback);
  }

  onSoundToggle(callback) {
    this.soundButton.addEventListener('click', () => {
      const enabled = this.soundButton.dataset.on !== 'true';
      this.soundButton.dataset.on = String(enabled);
      this.soundButton.textContent = enabled ? '🔊 Som' : '🔇 Som';
      callback(enabled);
    });
  }

  onStart(callback) {
    document.getElementById('start-button').addEventListener('click', () => {
      this.startPanel.classList.add('hidden');
      callback();
    });
  }

  onRestart(callback) {
    document.getElementById('restart-button').addEventListener('click', () => {
      this.victoryPanel.classList.add('hidden');
      callback();
    });
  }

  /**
   * Tela cheia. A API não existe em todo navegador e é bloqueada dentro dos
   * navegadores embutidos de apps (o do Google, do WhatsApp, as Custom Tabs do
   * Chrome). Nesses casos o pedido é recusado em silêncio, então avisamos.
   */
  bindFullscreen() {
    const root = document.documentElement;
    const request = root.requestFullscreen ?? root.webkitRequestFullscreen;
    if (!request) {
      this.fullscreenButton.classList.add('hidden');
      return;
    }

    const isFullscreen = () =>
      Boolean(document.fullscreenElement ?? document.webkitFullscreenElement);

    this.fullscreenButton.addEventListener('click', () => {
      if (isFullscreen()) {
        (document.exitFullscreen ?? document.webkitExitFullscreen).call(document);
        return;
      }
      const recusado = () =>
        this.toast(
          'Este navegador não deixou entrar em tela cheia. Abra o link no Chrome ou use "Adicionar à tela inicial".',
          6
        );
      try {
        const resultado = request.call(root, { navigationUI: 'hide' });
        if (resultado?.catch) resultado.catch(recusado);
        // Alguns navegadores resolvem a promessa e não mudam nada.
        setTimeout(() => {
          if (!isFullscreen()) recusado();
        }, 800);
      } catch {
        recusado();
      }
    });

    const sync = () => {
      this.fullscreenButton.textContent = isFullscreen() ? '⛶ Sair' : '⛶ Tela cheia';
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
  }

  bindHelp() {
    this.helpButton.addEventListener('click', () => {
      this.helpPanel.classList.toggle('hidden');
    });
  }

  /** Analógico de toque: arrastar a manopla vira acelerador e leme. */
  bindJoystick(input) {
    this.joystick = new Joystick(
      document.getElementById('joystick'),
      document.getElementById('joystick-knob'),
      (x, y) => input.setAxis(x, y)
    );
    this.touch = window.matchMedia('(hover: none)').matches;
    if (this.touch) this.touchPanel.classList.remove('hidden');
  }

  setMode(mode) {
    // O analógico serve aos dois modos: pilota o barco ou desliza a câmera.
    this.modeButton.textContent = mode === 'boat' ? '🚤 Barco' : '🎥 Câmera';
  }

  setCounts(aboard, delivered, total) {
    this.aboard.textContent = String(aboard);
    this.delivered.textContent = `${delivered}/${total}`;
  }

  setObjective(text) {
    this.objective.textContent = text;
  }

  toast(text, seconds = 3) {
    this.toastElement.textContent = text;
    this.toastElement.classList.remove('hidden');
    this.toastTimer = seconds;
  }

  showVictory(delivered) {
    document.getElementById('victory-text').textContent =
      `Você levou ${delivered} amigos para a festa na Ilha da Família Pig!`;
    this.victoryPanel.classList.remove('hidden');
  }

  update(dt) {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toastElement.classList.add('hidden');
    }
  }

  /** Minimapa: ilhas, quem ainda espera carona e onde está o barco. */
  drawMinimap(islands, boat, homeIsland) {
    const ctx = this.minimapContext;
    const size = this.minimap.width;
    const center = size / 2;
    const scale = center / WORLD_RADIUS;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#2f79bd';
    ctx.beginPath();
    ctx.arc(center, center, center - 1, 0, Math.PI * 2);
    ctx.fill();

    for (const island of islands) {
      const x = center + island.position.x * scale;
      const y = center + island.position.z * scale;
      const radius = Math.max(4, island.userData.radius * scale);
      ctx.fillStyle = island === homeIsland ? '#f0607e' : '#4fc63f';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (island.userData.passenger && !island.userData.passenger.userData.boarded) {
        ctx.strokeStyle = '#ffe45e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Barco: um triângulo apontando para onde ele navega, preso à borda do mapa.
    let dx = boat.position.x * scale;
    let dy = boat.position.z * scale;
    const distance = Math.hypot(dx, dy);
    const maxDistance = center - 8;
    if (distance > maxDistance) {
      dx *= maxDistance / distance;
      dy *= maxDistance / distance;
    }
    const bx = center + dx;
    const by = center + dy;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(-boat.heading);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 5);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
