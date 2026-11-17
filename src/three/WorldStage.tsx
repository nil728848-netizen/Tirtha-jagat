import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from '../audio/soundEngine';
import { AlphabetWorld, GraphicsQuality } from '../types/game';
import {
  buildExplorerMascot,
  buildLetterMonument,
  buildWorldHeroLandmark,
  ExplorerRig,
} from './models';
import {
  createGroundBumpTexture,
  createGroundTileTexture,
  createOrbLetterTexture,
} from './textures';

export interface Active3DChallenge {
  type: 'explore' | 'collect_3d' | 'find_hidden' | 'alphabet_race';
  targetWord?: string;
  collectedIndices?: number[];
  hiddenTotal?: number;
  hiddenFound?: number;
  raceRound?: number;
  raceTargetLetter?: string;
  raceOptions?: string[];
}

export interface MobileControlVector {
  dx: number;
  dz: number;
  jump: boolean;
}

interface WorldStageProps {
  world: AlphabetWorld;
  gameState: 'splash' | 'title' | 'playing' | 'paused' | 'gameover';
  graphicsQuality: GraphicsQuality;
  activeChallenge: Active3DChallenge;
  mobileInputRef: React.MutableRefObject<MobileControlVector>;
  onCollectOrb?: (letter: string, isTarget: boolean, slotIdx?: number) => void;
  onFindHidden?: (foundCount: number) => void;
  onRaceGateHit?: (hitLetter: string) => void;
  onInspectLandmark?: () => void;
}

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scaleVec = new THREE.Vector3();
const _euler = new THREE.Euler();

const PARTICLE_POOL_SIZE = 48;

interface FloatingOrb {
  group: THREE.Group;
  letter: string;
  slotIndex: number;
  isTarget: boolean;
  collected: boolean;
  baseY: number;
  phase: number;
}

interface HiddenToken {
  mesh: THREE.Mesh;
  found: boolean;
  baseY: number;
  phase: number;
}

interface RaceGate {
  group: THREE.Group;
  letter: string;
  lane: number; // -1, 0, 1
  z: number;
  resolved: boolean;
}

export const WorldStage: React.FC<WorldStageProps> = ({
  world,
  gameState,
  graphicsQuality,
  activeChallenge,
  mobileInputRef,
  onCollectOrb,
  onFindHidden,
  onRaceGateHit,
  onInspectLandmark,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const propsRef = useRef({
    world,
    gameState,
    graphicsQuality,
    activeChallenge,
    onCollectOrb,
    onFindHidden,
    onRaceGateHit,
    onInspectLandmark,
  });
  propsRef.current = {
    world,
    gameState,
    graphicsQuality,
    activeChallenge,
    onCollectOrb,
    onFindHidden,
    onRaceGateHit,
    onInspectLandmark,
  };

  const sceneApiRef = useRef<{
    rebuildWorld: (w: AlphabetWorld) => void;
    rebuildChallenge: (c: Active3DChallenge, w: AlphabetWorld) => void;
    applyQuality: (q: GraphicsQuality) => void;
  } | null>(null);

  // Mount Three.js engine once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: isSoftwareGl,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('data-testid', 'alphabet-3d-canvas');
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      52,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      220,
    );
    camera.position.set(0, 7.5, 16);

    // Studio Environment Reflection Map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // Three-point + Hemisphere lighting rig
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x334155, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.55);
    keyLight.position.set(16, 26, 14);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 68;
    const d = 22;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
    rimLight.position.set(-14, 12, -16);
    scene.add(rimLight);

    // Dynamic world root + challenge root
    const worldGroup = new THREE.Group();
    const challengeGroup = new THREE.Group();
    scene.add(worldGroup, challengeGroup);

    // Explorer Mascot
    const explorer: ExplorerRig = buildExplorerMascot();
    explorer.root.position.set(0, 0, 7.5);
    scene.add(explorer.root);

    // Pooled Sparkle Particles (Zero-GC InstancedMesh)
    const particleGeo = new THREE.OctahedronGeometry(0.16, 0);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, PARTICLE_POOL_SIZE);
    particleMesh.frustumCulled = false;
    scene.add(particleMesh);

    const particles = Array.from({ length: PARTICLE_POOL_SIZE }, (_, i) => ({
      active: false,
      x: 0,
      y: -50,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 1,
      seed: i,
    }));
    let particleCursor = 0;

    function spawnBurst(x: number, y: number, z: number, count = 12) {
      for (let i = 0; i < count; i++) {
        const p = particles[particleCursor];
        particleCursor = (particleCursor + 1) % PARTICLE_POOL_SIZE;
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 2.2 + Math.random() * 3.0;
        p.active = true;
        p.x = x;
        p.y = y;
        p.z = z;
        p.vx = Math.cos(angle) * speed;
        p.vy = 2.4 + Math.random() * 2.5;
        p.vz = Math.sin(angle) * speed;
        p.life = 0;
        p.maxLife = 0.55 + Math.random() * 0.35;
      }
    }

    // Tracked interactables & challenge entities
    let monumentGroup: THREE.Group | null = null;
    let heroGroup: THREE.Group | null = null;
    const clickableTargets: THREE.Object3D[] = [];
    const floatingOrbs: FloatingOrb[] = [];
    const hiddenTokens: HiddenToken[] = [];
    const raceGates: RaceGate[] = [];
    const worldDisposables: Array<{ dispose: () => void }> = [];
    const challengeDisposables: Array<{ dispose: () => void }> = [];

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy() || 4;
    const bumpTex = createGroundBumpTexture();

    function disposeList(list: Array<{ dispose: () => void }>) {
      while (list.length > 0) {
        try {
          list.pop()?.dispose();
        } catch {
          // ignore
        }
      }
    }

    function clearGroup(grp: THREE.Group, disposables: Array<{ dispose: () => void }>) {
      grp.clear();
      disposeList(disposables);
    }

    function rebuildWorld(w: AlphabetWorld) {
      clearGroup(worldGroup, worldDisposables);
      clickableTargets.length = 0;

      // Sky & Fog matching horizon
      const bgCol = new THREE.Color(w.palette.skyHorizon);
      scene.background = bgCol;
      scene.fog = new THREE.FogExp2(w.palette.fog, 0.014);

      const groundTex = createGroundTileTexture(w.palette.ground, w.palette.groundAccent, maxAnisotropy);
      worldDisposables.push(groundTex);

      // Extended Ground Plane (no floating box void)
      const groundGeo = new THREE.CircleGeometry(68, 48);
      const groundMat = new THREE.MeshStandardMaterial({
        map: groundTex,
        bumpMap: bumpTex,
        bumpScale: 0.12,
        roughness: 0.88,
        metalness: 0.02,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      worldGroup.add(ground);
      worldDisposables.push(groundGeo, groundMat);

      // Central Cobblestone/Plaza Disc (offset +0.025 on Y to prevent Z-fighting)
      const plazaGeo = new THREE.CylinderGeometry(8.5, 9.0, 0.06, 36);
      const plazaMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.72,
        metalness: 0.05,
      });
      const plaza = new THREE.Mesh(plazaGeo, plazaMat);
      plaza.position.y = 0.025;
      plaza.receiveShadow = true;
      worldGroup.add(plaza);
      worldDisposables.push(plazaGeo, plazaMat);

      // Decorative Golden Plaza Ring
      const ringGeo = new THREE.RingGeometry(8.1, 8.5, 48);
      const ringMat = new THREE.MeshStandardMaterial({
        color: w.palette.accentHex,
        roughness: 0.4,
        metalness: 0.35,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.06;
      worldGroup.add(ring);
      worldDisposables.push(ringGeo, ringMat);

      // Letter Monument (left-center focal point)
      monumentGroup = buildLetterMonument(w, maxAnisotropy);
      monumentGroup.position.set(-4.2, 0, -2.5);
      monumentGroup.userData.action = 'landmark';
      worldGroup.add(monumentGroup);
      clickableTargets.push(monumentGroup);

      // World Hero 3D Landmark Sculpture (right-center focal point)
      heroGroup = buildWorldHeroLandmark(w);
      heroGroup.position.set(4.2, 0, -2.5);
      heroGroup.userData.action = 'landmark';
      worldGroup.add(heroGroup);
      clickableTargets.push(heroGroup);

      // Natural Outdoor Perimeter Ring (Instanced trees/crystals/pillars around radius 19..40)
      const treeCount = 34;
      const trunkGeo = new THREE.CylinderGeometry(0.28, 0.45, 2.2, 8);
      const trunkMat = new THREE.MeshStandardMaterial({
        color: w.biome === 'cosmos' || w.biome === 'glacier' ? 0x475569 : 0x78350f,
        roughness: 0.85,
      });
      const crownGeo =
        w.biome === 'cosmos' || w.biome === 'glacier' || w.biome === 'royal'
          ? new THREE.OctahedronGeometry(1.45, 0)
          : new THREE.ConeGeometry(1.5, 3.2, 8);
      const crownMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: w.biome === 'cosmos' || w.biome === 'glacier' ? 0.25 : 0.72,
        metalness: w.biome === 'cosmos' ? 0.6 : 0.05,
      });

      const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
      const crownInst = new THREE.InstancedMesh(crownGeo, crownMat, treeCount);
      trunkInst.castShadow = !isSoftwareGl;
      crownInst.castShadow = !isSoftwareGl;

      const baseLeafColor = new THREE.Color(
        w.biome === 'cosmos'
          ? 0x38bdf8
          : w.biome === 'glacier'
          ? 0x7dd3fc
          : w.biome === 'savannah'
          ? 0x65a30d
          : w.biome === 'royal'
          ? 0xa855f7
          : 0x16a34a,
      );

      for (let i = 0; i < treeCount; i++) {
        const ang = (i / treeCount) * Math.PI * 2 + (i % 3) * 0.08;
        const radius = 19 + (i % 5) * 4.2;
        const px = Math.cos(ang) * radius;
        const pz = Math.sin(ang) * radius;
        const s = 0.85 + (i % 4) * 0.14;

        _scaleVec.set(s, s, s);
        _euler.set(0, ang, 0);
        _quat.setFromEuler(_euler);
        _vec3A.set(px, 1.1 * s, pz);
        _mat4.compose(_vec3A, _quat, _scaleVec);
        trunkInst.setMatrixAt(i, _mat4);

        _vec3A.set(px, 2.9 * s, pz);
        _mat4.compose(_vec3A, _quat, _scaleVec);
        crownInst.setMatrixAt(i, _mat4);

        const c = baseLeafColor.clone().offsetHSL(((i % 5) - 2) * 0.02, 0, ((i % 3) - 1) * 0.04);
        crownInst.setColorAt(i, c);
      }
      trunkInst.instanceMatrix.needsUpdate = true;
      crownInst.instanceMatrix.needsUpdate = true;
      if (crownInst.instanceColor) crownInst.instanceColor.needsUpdate = true;
      trunkInst.computeBoundingSphere();
      crownInst.computeBoundingSphere();

      worldGroup.add(trunkInst, crownInst);
      worldDisposables.push(trunkGeo, trunkMat, crownGeo, crownMat);

      // Add subtle pathway stepping stones along +Z from spawn
      const stoneGeo = new THREE.CylinderGeometry(0.65, 0.72, 0.08, 12);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.75 });
      for (let s = 0; s < 5; s++) {
        const st = new THREE.Mesh(stoneGeo, stoneMat);
        st.position.set(Math.sin(s * 0.9) * 0.65, 0.04, 3.2 + s * 2.1);
        st.receiveShadow = true;
        worldGroup.add(st);
      }
      worldDisposables.push(stoneGeo, stoneMat);
    }

    function rebuildChallenge(ch: Active3DChallenge, w: AlphabetWorld) {
      clearGroup(challengeGroup, challengeDisposables);
      floatingOrbs.length = 0;
      hiddenTokens.length = 0;
      raceGates.length = 0;

      if (ch.type === 'explore') {
        // Spawn 5 ambient collectible letters around the plaza (including world.letter)
        const letters = [w.letter, w.primaryWord[1]?.toUpperCase() || 'E', w.letter, '★', w.letter];
        const coords = [
          [-7.5, 4.5],
          [7.5, 4.5],
          [-10, -5],
          [10, -5],
          [0, -9.5],
        ];
        coords.forEach(([ox, oz], idx) => {
          const orbGrp = new THREE.Group();
          orbGrp.position.set(ox, 1.35, oz);
          const tex = createOrbLetterTexture(letters[idx], w.palette.accentHex, maxAnisotropy);
          const rimGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.16, 24);
          const rimMat = new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            roughness: 0.2,
            metalness: 0.85,
          });
          const rimMesh = new THREE.Mesh(rimGeo, rimMat);
          rimMesh.rotation.x = Math.PI / 2;
          rimMesh.castShadow = true;
          orbGrp.add(rimMesh);

          const faceGeo = new THREE.CircleGeometry(0.64, 24);
          const faceMat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.25,
            metalness: 0.1,
          });
          const f1 = new THREE.Mesh(faceGeo, faceMat);
          f1.position.z = 0.085;
          const f2 = new THREE.Mesh(faceGeo, faceMat);
          f2.position.z = -0.085;
          f2.rotation.y = Math.PI;
          orbGrp.add(f1, f2);

          const haloGeo = new THREE.TorusGeometry(0.88, 0.045, 8, 24);
          const haloMat = new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            emissive: 0xf59e0b,
            emissiveIntensity: 0.4,
            roughness: 0.2,
            metalness: 0.85,
          });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          halo.rotation.x = Math.PI / 2;
          orbGrp.add(halo);

          challengeGroup.add(orbGrp);
          challengeDisposables.push(tex, rimGeo, rimMat, faceGeo, faceMat, haloGeo, haloMat);
          floatingOrbs.push({
            group: orbGrp,
            letter: letters[idx],
            slotIndex: idx,
            isTarget: true,
            collected: false,
            baseY: 1.35,
            phase: idx * 1.1,
          });
        });
      } else if (ch.type === 'collect_3d' && ch.targetWord) {
        const clean = ch.targetWord.toUpperCase().replace(/[^A-Z]/g, '');
        const already = new Set(ch.collectedIndices ?? []);
        const total = clean.length;
        for (let i = 0; i < total; i++) {
          if (already.has(i)) continue;
          const ang = (i / total) * Math.PI * 2 + 0.35;
          const rad = 7.5 + (i % 2) * 4.5;
          const ox = Math.cos(ang) * rad;
          const oz = Math.sin(ang) * rad;

          const orbGrp = new THREE.Group();
          orbGrp.position.set(ox, 1.4, oz);
          const tex = createOrbLetterTexture(clean[i], w.palette.accentHex, maxAnisotropy);
          const rimGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.16, 24);
          const rimMat = new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            roughness: 0.2,
            metalness: 0.85,
          });
          const rimMesh = new THREE.Mesh(rimGeo, rimMat);
          rimMesh.rotation.x = Math.PI / 2;
          rimMesh.castShadow = true;
          orbGrp.add(rimMesh);

          const faceGeo = new THREE.CircleGeometry(0.68, 24);
          const faceMat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.22,
            metalness: 0.12,
          });
          const f1 = new THREE.Mesh(faceGeo, faceMat);
          f1.position.z = 0.085;
          const f2 = new THREE.Mesh(faceGeo, faceMat);
          f2.position.z = -0.085;
          f2.rotation.y = Math.PI;
          orbGrp.add(f1, f2);

          const ringGeo = new THREE.TorusGeometry(0.92, 0.06, 8, 24);
          const ringMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = Math.PI / 2;
          orbGrp.add(ring);

          challengeGroup.add(orbGrp);
          challengeDisposables.push(tex, rimGeo, rimMat, faceGeo, faceMat, ringGeo, ringMat);
          floatingOrbs.push({
            group: orbGrp,
            letter: clean[i],
            slotIndex: i,
            isTarget: true,
            collected: false,
            baseY: 1.4,
            phase: i * 0.9,
          });
        }
      } else if (ch.type === 'find_hidden') {
        const spots = [
          [-11.5, 1.1, -7.5],
          [11.2, 1.1, -6.2],
          [-6.4, 1.1, 10.5],
          [8.6, 1.1, 8.8],
          [0, 3.8, -5.8],
        ];
        const count = Math.min(spots.length, ch.hiddenTotal ?? 4);
        const geo = new THREE.OctahedronGeometry(0.75, 0);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.55,
          roughness: 0.15,
          metalness: 0.9,
        });
        challengeDisposables.push(geo, mat);

        for (let i = 0; i < count; i++) {
          const [hx, hy, hz] = spots[i];
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(hx, hy, hz);
          mesh.userData.hiddenIndex = i;
          challengeGroup.add(mesh);
          hiddenTokens.push({ mesh, found: false, baseY: hy, phase: i * 1.3 });
        }
      } else if (ch.type === 'alphabet_race') {
        // Build glowing sky-track lanes along -Z and 3 letter gates ahead
        const trackGeo = new THREE.BoxGeometry(10, 0.15, 42);
        const trackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
        const track = new THREE.Mesh(trackGeo, trackMat);
        track.position.set(0, 0.08, -10);
        track.receiveShadow = true;
        challengeGroup.add(track);
        challengeDisposables.push(trackGeo, trackMat);

        const options = ch.raceOptions ?? [w.letter, 'X', 'Z'];
        const lanes = [-3.0, 0, 3.0];
        options.slice(0, 3).forEach((ltr, idx) => {
          const gateGrp = new THREE.Group();
          const lane = idx - 1;
          gateGrp.position.set(lanes[idx], 1.5, -24);

          const tex = createOrbLetterTexture(ltr, w.palette.accentHex, maxAnisotropy);
          const archGeo = new THREE.BoxGeometry(2.1, 2.3, 0.35);
          const archMat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.3,
            metalness: 0.2,
          });
          const arch = new THREE.Mesh(archGeo, archMat);
          gateGrp.add(arch);

          challengeGroup.add(gateGrp);
          challengeDisposables.push(tex, archGeo, archMat);
          raceGates.push({ group: gateGrp, letter: ltr, lane, z: -24, resolved: false });
        });
      }
    }

    function applyQuality(q: GraphicsQuality) {
      if (isSoftwareGl) {
        renderer.setPixelRatio(1);
        renderer.shadowMap.enabled = false;
        return;
      }
      if (q === 'low') {
        renderer.setPixelRatio(1);
        renderer.shadowMap.enabled = false;
      } else if (q === 'medium') {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.shadowMap.enabled = true;
      } else {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
      }
    }

    sceneApiRef.current = { rebuildWorld, rebuildChallenge, applyQuality };
    rebuildWorld(propsRef.current.world);
    rebuildChallenge(propsRef.current.activeChallenge, propsRef.current.world);
    applyQuality(propsRef.current.graphicsQuality);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Input Tracking
    const keysPressed = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
          if (propsRef.current.gameState === 'playing') {
            e.preventDefault();
          }
        }
      }
      keysPressed.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.code);
    };
    const clearInputs = () => keysPressed.clear();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);

    // Raycasting for clicking 3D Landmarks, Orbs, or Hidden Stars
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const onPointerDown = (e: PointerEvent) => {
      if (propsRef.current.gameState !== 'playing') return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);

      // Check hidden tokens first
      const activeTokens = hiddenTokens.filter((t) => !t.found).map((t) => t.mesh);
      if (activeTokens.length > 0) {
        const hits = raycaster.intersectObjects(activeTokens, false);
        if (hits.length > 0) {
          const hitMesh = hits[0].object as THREE.Mesh;
          const token = hiddenTokens.find((t) => t.mesh === hitMesh);
          if (token && !token.found) {
            token.found = true;
            token.mesh.visible = false;
            spawnBurst(token.mesh.position.x, token.mesh.position.y, token.mesh.position.z, 18);
            soundEngine.playCollect(2);
            const foundCount = hiddenTokens.filter((t) => t.found).length;
            propsRef.current.onFindHidden?.(foundCount);
            return;
          }
        }
      }

      // Check floating orbs click
      const orbMeshes = floatingOrbs.filter((o) => !o.collected).map((o) => o.group);
      if (orbMeshes.length > 0) {
        const orbHits = raycaster.intersectObjects(orbMeshes, true);
        if (orbHits.length > 0) {
          let curr: THREE.Object3D | null = orbHits[0].object;
          while (curr && curr.parent !== challengeGroup) {
            curr = curr.parent;
          }
          const orb = floatingOrbs.find((o) => o.group === curr);
          if (orb && !orb.collected) {
            orb.collected = true;
            orb.group.visible = false;
            spawnBurst(orb.group.position.x, orb.group.position.y, orb.group.position.z, 16);
            soundEngine.playCollect(orb.slotIndex);
            propsRef.current.onCollectOrb?.(orb.letter, orb.isTarget, orb.slotIndex);
            return;
          }
        }
      }

      // Check landmarks (pronounce word on click!)
      const landmarkHits = raycaster.intersectObjects(clickableTargets, true);
      if (landmarkHits.length > 0) {
        spawnBurst(landmarkHits[0].point.x, landmarkHits[0].point.y + 0.5, landmarkHits[0].point.z, 10);
        propsRef.current.onInspectLandmark?.();
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Resize observer
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Player physics state
    let playerVy = 0;
    let isGrounded = true;
    let walkPhase = 0;
    let squashY = 1;
    let elapsed = 0;
    let lastTime = performance.now();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (sync && state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      elapsed += dt;

      const { gameState: state, activeChallenge: challenge } = propsRef.current;

      // Animate monuments & hero props gently
      if (monumentGroup) {
        const crest = monumentGroup.getObjectByName('spinning_crest');
        if (crest) crest.rotation.y = Math.sin(elapsed * 0.85) * 0.28;
      }
      if (heroGroup) {
        const hero = heroGroup.getObjectByName('hero_prop');
        if (hero) hero.rotation.y = Math.sin(elapsed * 0.55) * 0.22;
      }

      // Animate orbs & hidden tokens
      for (const orb of floatingOrbs) {
        if (orb.collected) continue;
        orb.group.position.y = orb.baseY + Math.sin(elapsed * 2.4 + orb.phase) * 0.24;
        orb.group.rotation.y += dt * 1.4;
      }
      for (const tok of hiddenTokens) {
        if (tok.found) continue;
        tok.mesh.position.y = tok.baseY + Math.sin(elapsed * 2.8 + tok.phase) * 0.2;
        tok.mesh.rotation.y += dt * 2.1;
      }

      // Simulation update when playing
      if (state === 'playing') {
        const mob = mobileInputRef.current;
        let moveX = mob.dx;
        let moveZ = mob.dz;
        if (keysPressed.has('KeyA') || keysPressed.has('ArrowLeft')) moveX -= 1;
        if (keysPressed.has('KeyD') || keysPressed.has('ArrowRight')) moveX += 1;
        if (keysPressed.has('KeyW') || keysPressed.has('ArrowUp')) moveZ -= 1;
        if (keysPressed.has('KeyS') || keysPressed.has('ArrowDown')) moveZ += 1;

        if (challenge.type === 'alphabet_race') {
          // Keep explorer in race lanes (-3, 0, +3) at z = 6 while gates approach along +Z
          const targetLaneX = THREE.MathUtils.clamp(explorer.root.position.x + moveX * dt * 11, -3.6, 3.6);
          explorer.root.position.x = targetLaneX;
          explorer.root.position.z = 7.5;
          explorer.root.rotation.y = Math.PI;
          walkPhase += dt * 12;

          for (const gate of raceGates) {
            if (gate.resolved) continue;
            gate.z += dt * 11.5;
            gate.group.position.z = gate.z;
            if (gate.z >= 6.8 && gate.z <= 8.6) {
              if (Math.abs(explorer.root.position.x - gate.group.position.x) < 1.35) {
                gate.resolved = true;
                gate.group.visible = false;
                spawnBurst(gate.group.position.x, 1.5, 7.5, 16);
                propsRef.current.onRaceGateHit?.(gate.letter);
              }
            } else if (gate.z > 10.5 && !gate.resolved) {
              gate.resolved = true;
              if (gate.letter === challenge.raceTargetLetter) {
                propsRef.current.onRaceGateHit?.('__MISSED__');
              }
            }
          }
        } else {
          // Free 3D World Exploration movement
          _vec3A.set(moveX, 0, moveZ);
          const len = _vec3A.length();
          if (len > 0.05) {
            _vec3A.normalize();
            const speed = 8.4;
            explorer.root.position.x = THREE.MathUtils.clamp(
              explorer.root.position.x + _vec3A.x * speed * dt,
              -15.5,
              15.5,
            );
            explorer.root.position.z = THREE.MathUtils.clamp(
              explorer.root.position.z + _vec3A.z * speed * dt,
              -14.5,
              15.5,
            );

            const targetYaw = Math.atan2(_vec3A.x, _vec3A.z);
            let diff = targetYaw - explorer.root.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            explorer.root.rotation.y += diff * Math.min(1, dt * 12);
            walkPhase += dt * speed * 1.45;
          } else {
            walkPhase = THREE.MathUtils.damp(walkPhase, Math.round(walkPhase / Math.PI) * Math.PI, 8, dt);
          }

          // Jump
          if ((keysPressed.has('Space') || mob.jump) && isGrounded) {
            playerVy = 8.2;
            isGrounded = false;
            squashY = 1.2;
            soundEngine.playClick();
          }
          if (!isGrounded) {
            playerVy -= 22 * dt;
            explorer.root.position.y += playerVy * dt;
            if (explorer.root.position.y <= 0) {
              explorer.root.position.y = 0;
              playerVy = 0;
              isGrounded = true;
              squashY = 0.82;
            }
          }

          // Proximity pickup for floating orbs & hidden tokens
          for (const orb of floatingOrbs) {
            if (orb.collected) continue;
            const dx = explorer.root.position.x - orb.group.position.x;
            const dz = explorer.root.position.z - orb.group.position.z;
            if (dx * dx + dz * dz < 2.25) {
              orb.collected = true;
              orb.group.visible = false;
              spawnBurst(orb.group.position.x, orb.group.position.y, orb.group.position.z, 16);
              soundEngine.playCollect(orb.slotIndex);
              propsRef.current.onCollectOrb?.(orb.letter, orb.isTarget, orb.slotIndex);
            }
          }
          for (const tok of hiddenTokens) {
            if (tok.found) continue;
            const dx = explorer.root.position.x - tok.mesh.position.x;
            const dz = explorer.root.position.z - tok.mesh.position.z;
            if (dx * dx + dz * dz < 2.25) {
              tok.found = true;
              tok.mesh.visible = false;
              spawnBurst(tok.mesh.position.x, tok.mesh.position.y, tok.mesh.position.z, 18);
              soundEngine.playCollect(2);
              const foundCount = hiddenTokens.filter((t) => t.found).length;
              propsRef.current.onFindHidden?.(foundCount);
            }
          }
        }

        // Gait sync & squash/stretch damping
        squashY = THREE.MathUtils.damp(squashY, 1, 14, dt);
        const invXZ = 1 / Math.sqrt(squashY);
        explorer.bodyGroup.scale.set(invXZ, squashY, invXZ);
        explorer.leftLeg.rotation.x = Math.sin(walkPhase) * 0.55;
        explorer.rightLeg.rotation.x = -Math.sin(walkPhase) * 0.55;
        explorer.leftArm.rotation.x = -Math.sin(walkPhase) * 0.45;
        explorer.rightArm.rotation.x = Math.sin(walkPhase) * 0.45;
        explorer.head.rotation.y = Math.sin(elapsed * 1.4) * 0.08;

        // Smooth Chase Camera
        if (challenge.type === 'alphabet_race') {
          _camDesired.set(explorer.root.position.x * 0.4, 5.8, 14.5);
          _camTarget.set(explorer.root.position.x * 0.5, 1.8, -6);
        } else {
          _camDesired.set(
            explorer.root.position.x * 0.85,
            5.8 + explorer.root.position.y * 0.5,
            explorer.root.position.z + 10.5,
          );
          _camTarget.set(explorer.root.position.x, 1.6 + explorer.root.position.y * 0.3, explorer.root.position.z - 2.2);
        }
        const dampAlpha = 1 - Math.exp(-6.5 * dt);
        camera.position.lerp(_camDesired, dampAlpha);
        _vec3B.copy(_camTarget);
        camera.lookAt(_vec3B);
      } else {
        // Title / Splash Camera Flyover Orbit
        const orbitAng = elapsed * 0.24;
        const rad = 14.5;
        _camDesired.set(Math.sin(orbitAng) * rad, 5.6 + Math.sin(elapsed * 0.4) * 0.7, Math.cos(orbitAng) * rad);
        camera.position.lerp(_camDesired, 1 - Math.exp(-3.5 * dt));
        camera.lookAt(0, 1.8, -1.2);
        explorer.bodyGroup.position.y = Math.abs(Math.sin(elapsed * 2.2)) * 0.08;
        explorer.head.rotation.y = Math.sin(elapsed * 1.2) * 0.25;
      }

      // Update Pooled Burst Particles
      for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const p = particles[i];
        if (!p.active) {
          _vec3A.set(0, -100, 0);
          _scaleVec.set(0.001, 0.001, 0.001);
          _quat.identity();
          _mat4.compose(_vec3A, _quat, _scaleVec);
          particleMesh.setMatrixAt(i, _mat4);
          continue;
        }
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          continue;
        }
        p.vy -= 9.8 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        const s = Math.max(0.01, 1 - p.life / p.maxLife);
        _vec3A.set(p.x, p.y, p.z);
        _euler.set(p.life * 6, p.life * 4, 0);
        _quat.setFromEuler(_euler);
        _scaleVec.set(s, s, s);
        _mat4.compose(_vec3A, _quat, _scaleVec);
        particleMesh.setMatrixAt(i, _mat4);
      }
      particleMesh.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      disposeList(worldDisposables);
      disposeList(challengeDisposables);
      bumpTex.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [mobileInputRef]);

  // Rebuild world smoothly when selected letter changes
  useEffect(() => {
    sceneApiRef.current?.rebuildWorld(world);
    sceneApiRef.current?.rebuildChallenge(activeChallenge, world);
  }, [world, activeChallenge]);

  // Apply graphics quality changes live
  useEffect(() => {
    sceneApiRef.current?.applyQuality(graphicsQuality);
  }, [graphicsQuality]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-full h-full select-none touch-none"
      aria-label={`3D Environment for ${world.letter} - ${world.name}`}
    />
  );
};
