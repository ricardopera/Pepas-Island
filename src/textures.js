import * as THREE from 'three';

function canvas(size = 128) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

function hex(color) {
  return '#' + new THREE.Color(color).getHexString();
}

function shade(color, amount) {
  const c = new THREE.Color(color);
  c.offsetHSL(0, 0, amount);
  return '#' + c.getHexString();
}

/** Telhado com fileiras de telhas onduladas, como o desenho das casas. */
export function roofTexture(color) {
  const c = canvas(128);
  const ctx = c.getContext('2d');
  ctx.fillStyle = hex(color);
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = shade(color, -0.09);
  ctx.lineWidth = 3;
  const rows = 4;
  const cols = 8;
  const rowH = 128 / rows;
  const colW = 128 / cols;
  for (let r = 0; r < rows; r++) {
    const y = r * rowH + rowH * 0.75;
    const offset = r % 2 ? colW / 2 : 0;
    ctx.beginPath();
    for (let i = -1; i <= cols; i++) {
      const x = i * colW + offset;
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + colW / 2, y - rowH * 0.42, x + colW, y);
    }
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(c);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Bandeira pirata do barco do Vovô Pig. */
export function pirateFlagTexture() {
  const c = canvas(128);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1d1d20';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#ffffff';
  // Crânio.
  ctx.beginPath();
  ctx.ellipse(64, 52, 24, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(52, 66, 24, 12);
  ctx.fillStyle = '#1d1d20';
  ctx.beginPath();
  ctx.ellipse(55, 50, 7, 8, 0, 0, Math.PI * 2);
  ctx.ellipse(73, 50, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(60, 68, 3, 9);
  ctx.fillRect(66, 68, 3, 9);
  // Ossos cruzados.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(40, 92);
  ctx.lineTo(88, 108);
  ctx.moveTo(88, 92);
  ctx.lineTo(40, 108);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Sombra macia usada sob personagens e barco. */
export function shadowTexture() {
  const c = canvas(64);
  const ctx = c.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(0,0,0,0.32)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
