import * as THREE from 'three';

// O visual do desenho é chapado: um material por cor, reaproveitado em toda a cena.
const cache = new Map();

export function flat(color, options = {}) {
  const key = `${color}|${JSON.stringify(options)}`;
  let material = cache.get(key);
  if (!material) {
    material = new THREE.MeshLambertMaterial({ color, ...options });
    cache.set(key, material);
  }
  return material;
}

// Materiais que serão animados ou terão opacidade própria não podem ser compartilhados.
export function flatUnique(color, options = {}) {
  return new THREE.MeshLambertMaterial({ color, ...options });
}

export function unlit(color, options = {}) {
  const key = `unlit|${color}|${JSON.stringify(options)}`;
  let material = cache.get(key);
  if (!material) {
    material = new THREE.MeshBasicMaterial({ color, ...options });
    cache.set(key, material);
  }
  return material;
}

export function mesh(geometry, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  return m;
}

// Retângulo com cantos arredondados: base de quase todas as formas do desenho.
export function roundedRectShape(width, height, radius) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w, -h + r);
  return shape;
}

export function extrude(shape, depth, options = {}) {
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 12,
    ...options,
  });
}
