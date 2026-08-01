import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { flat, unlit, mesh } from './materials.js';

export const WATER_SIZE = 1600;

/** Altura das ondas — a mesma fórmula roda no shader e aqui, para o barco boiar certo. */
export function waveHeight(x, z, time) {
  return (
    Math.sin(x * 0.09 + time * 0.9) * 0.26 +
    Math.sin(z * 0.13 - time * 1.05) * 0.2 +
    Math.sin((x + z) * 0.05 + time * 0.55) * 0.3
  );
}

const waterVertexShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying float vHeight;
  varying vec2 vLocal;

  float waveHeight(float x, float z, float t) {
    return sin(x * 0.09 + t * 0.9) * 0.26
         + sin(z * 0.13 - t * 1.05) * 0.2
         + sin((x + z) * 0.05 + t * 0.55) * 0.3;
  }

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    float h = waveHeight(world.x, world.z, uTime);
    world.y += h;
    vHeight = h;
    vWorldPosition = world.xyz;
    vLocal = position.xz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const waterFragmentShader = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying float vHeight;
  varying vec2 vLocal;

  void main() {
    // Manchas largas e suaves, como as variações de azul pintadas no cenário.
    float blotch = sin(vWorldPosition.x * 0.012 + uTime * 0.05)
                * cos(vWorldPosition.z * 0.015 - uTime * 0.04);
    float mixAmount = smoothstep(-0.6, 0.8, vHeight * 1.05 + blotch * 0.3);
    vec3 color = mix(uDeep, uShallow, mixAmount);

    // Cristas mais claras nas ondas altas.
    float crest = smoothstep(0.40, 0.66, vHeight);
    color = mix(color, vec3(0.80, 0.91, 0.99), crest * 0.25);

    // O mar clareia perto do horizonte para encontrar o céu.
    float horizon = smoothstep(170.0, 520.0, length(vLocal));
    color = mix(color, vec3(0.58, 0.80, 0.91), horizon);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createWater() {
  const geometry = new THREE.PlaneGeometry(WATER_SIZE, WATER_SIZE, 200, 200);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(PALETTE.waterDeep) },
      uShallow: { value: new THREE.Color(PALETTE.waterShallow) },
    },
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
  });
  const water = new THREE.Mesh(geometry, material);
  water.renderOrder = -1;
  water.userData.material = material;
  return water;
}

const skyVertexShader = /* glsl */ `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  varying vec3 vPosition;
  void main() {
    float h = clamp(vPosition.y / 400.0, -1.0, 1.0);
    vec3 color = mix(uBottom, uTop, smoothstep(-0.05, 0.75, h));
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createSky() {
  const geometry = new THREE.SphereGeometry(700, 40, 24);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color(PALETTE.skyTop) },
      uBottom: { value: new THREE.Color(PALETTE.skyBottom) },
    },
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(geometry, material);
  sky.renderOrder = -2;
  return sky;
}

/** Sol amarelo com raios em volta, desenhado sempre de frente para a câmera. */
export function createSun() {
  const sun = new THREE.Group();
  const disc = mesh(new THREE.CircleGeometry(14, 24), unlit(PALETTE.sun));
  sun.add(disc);

  const rays = new THREE.Group();
  const rayGeometry = new THREE.CapsuleGeometry(1.1, 5, 3, 6);
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const ray = mesh(
      rayGeometry,
      unlit(PALETTE.sun),
      Math.cos(angle) * 21,
      Math.sin(angle) * 21,
      0
    );
    ray.rotation.z = angle - Math.PI / 2;
    rays.add(ray);
  }
  sun.add(rays);
  sun.userData.rays = rays;
  sun.position.set(150, 130, -320);
  return sun;
}

/** Nuvens de bolhas brancas que deslizam devagar pelo céu. */
export function createClouds(count = 14, rng = Math.random) {
  const clouds = new THREE.Group();
  const geometry = new THREE.SphereGeometry(1, 10, 8);
  const material = unlit(PALETTE.cloud);

  for (let i = 0; i < count; i++) {
    const cloud = new THREE.Group();
    const puffs = 3 + Math.floor(rng() * 3);
    for (let p = 0; p < puffs; p++) {
      const puff = mesh(
        geometry,
        material,
        (p - (puffs - 1) / 2) * 7 + (rng() - 0.5) * 2,
        rng() * 2.2,
        (rng() - 0.5) * 1.5
      );
      const size = 6 + rng() * 4;
      puff.scale.set(size, size * 0.68, size * 0.7);
      cloud.add(puff);
    }
    const angle = rng() * Math.PI * 2;
    const distance = 160 + rng() * 220;
    cloud.position.set(
      Math.cos(angle) * distance,
      130 + rng() * 70,
      Math.sin(angle) * distance
    );
    cloud.userData.speed = 0.7 + rng() * 0.9;
    clouds.add(cloud);
  }
  return clouds;
}

export function updateClouds(clouds, dt) {
  for (const cloud of clouds.children) {
    cloud.position.x += cloud.userData.speed * dt;
    if (cloud.position.x > 420) cloud.position.x = -420;
  }
}

/** Gaivotas em círculos lentos, para o céu não ficar parado. */
export function createSeagulls(count = 5, rng = Math.random) {
  const flock = new THREE.Group();
  const material = flat(0xffffff);
  const wingGeometry = new THREE.CapsuleGeometry(0.18, 1.5, 2, 6);

  for (let i = 0; i < count; i++) {
    const bird = new THREE.Group();
    bird.add(mesh(new THREE.SphereGeometry(0.4, 8, 6), material));
    for (const sx of [-1, 1]) {
      const wing = mesh(wingGeometry, material, sx * 0.85, 0, 0);
      wing.rotation.z = Math.PI / 2;
      const pivot = new THREE.Group();
      pivot.add(wing);
      bird.add(pivot);
      bird.userData[sx < 0 ? 'leftWing' : 'rightWing'] = pivot;
    }
    bird.userData.radius = 60 + rng() * 90;
    bird.userData.height = 34 + rng() * 26;
    bird.userData.speed = 0.1 + rng() * 0.12;
    bird.userData.phase = rng() * Math.PI * 2;
    bird.userData.center = new THREE.Vector3((rng() - 0.5) * 200, 0, (rng() - 0.5) * 200);
    flock.add(bird);
  }
  return flock;
}

export function updateSeagulls(flock, time) {
  for (const bird of flock.children) {
    const data = bird.userData;
    const angle = time * data.speed + data.phase;
    bird.position.set(
      data.center.x + Math.cos(angle) * data.radius,
      data.height + Math.sin(time * 0.8 + data.phase) * 2.5,
      data.center.z + Math.sin(angle) * data.radius
    );
    bird.rotation.y = -angle + Math.PI / 2;
    const flap = Math.sin(time * 6 + data.phase) * 0.6;
    data.leftWing.rotation.z = flap;
    data.rightWing.rotation.z = -flap;
  }
}

export function createLights() {
  const group = new THREE.Group();
  // Luz forte e difusa: mantém as cores chapadas, com só uma sombra suave.
  group.add(new THREE.AmbientLight(0xffffff, 1.45));
  const hemisphere = new THREE.HemisphereLight(0xcdefff, 0x4f9fd8, 0.6);
  group.add(hemisphere);
  const sun = new THREE.DirectionalLight(0xfff6dd, 1.1);
  sun.position.set(60, 120, 40);
  group.add(sun);
  return group;
}
