import * as THREE from 'three';
import { AlphabetWorld } from '../types/game';
import { createContactShadowTexture, createLetterCrestTexture } from './textures';

let sharedShadowTex: THREE.CanvasTexture | null = null;
function getShadowTexture(): THREE.CanvasTexture {
  if (!sharedShadowTex) {
    sharedShadowTex = createContactShadowTexture();
  }
  return sharedShadowTex;
}

export function addContactShadow(group: THREE.Group, radius = 1.1) {
  const geo = new THREE.CircleGeometry(radius, 24);
  const mat = new THREE.MeshBasicMaterial({
    map: getShadowTexture(),
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(geo, mat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);
  return shadow;
}

export interface ExplorerRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  head: THREE.Group;
}

/**
 * Composite 10-part articulated 3D Explorer Mascot with bottom-center pivot.
 */
export function buildExplorerMascot(): ExplorerRig {
  const root = new THREE.Group();
  addContactShadow(root, 0.95);

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const suitMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    roughness: 0.48,
    metalness: 0.12,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.22,
    metalness: 0.85,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.72,
    metalness: 0.1,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.35,
    metalness: 0.08,
  });
  const visorMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.12,
    metalness: 0.4,
    clearcoat: 1.0,
  });

  // Legs (2 parts)
  const legGeo = new THREE.CapsuleGeometry(0.14, 0.34, 6, 12);
  const leftLeg = new THREE.Mesh(legGeo, bootMat);
  leftLeg.position.set(-0.22, 0.36, 0);
  leftLeg.castShadow = true;
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, bootMat);
  rightLeg.position.set(0.22, 0.36, 0);
  rightLeg.castShadow = true;
  bodyGroup.add(rightLeg);

  // Torso + Golden Chest Emblem
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.45, 8, 16), suitMat);
  torso.position.set(0, 0.96, 0);
  torso.castShadow = true;
  bodyGroup.add(torso);

  const badge = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), goldMat);
  badge.position.set(0, 1.05, 0.36);
  bodyGroup.add(badge);

  // Explorer Backpack
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.56, 0.28), goldMat);
  pack.position.set(0, 1.02, -0.34);
  pack.castShadow = true;
  bodyGroup.add(pack);

  // Arms (2 parts)
  const armGeo = new THREE.CapsuleGeometry(0.11, 0.36, 6, 10);
  const leftArm = new THREE.Mesh(armGeo, suitMat);
  leftArm.position.set(-0.48, 0.98, 0);
  leftArm.rotation.z = 0.2;
  leftArm.castShadow = true;
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, suitMat);
  rightArm.position.set(0.48, 0.98, 0);
  rightArm.rotation.z = -0.2;
  rightArm.castShadow = true;
  bodyGroup.add(rightArm);

  // Head Group (Helmet, Visor, Eyes, Antenna)
  const head = new THREE.Group();
  head.position.set(0, 1.68, 0);
  bodyGroup.add(head);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), skinMat);
  helmet.castShadow = true;
  head.add(helmet);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.26, 0.16), visorMat);
  visor.position.set(0, 0.02, 0.34);
  head.add(visor);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const eyeGeo = new THREE.SphereGeometry(0.055, 10, 10);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.12, 0.03, 0.42);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.12, 0.03, 0.42);
  head.add(leftEye, rightEye);

  const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8), goldMat);
  antennaStem.position.set(0, 0.48, 0);
  const antennaTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 0.6 }),
  );
  antennaTip.position.set(0, 0.64, 0);
  head.add(antennaStem, antennaTip);

  return { root, bodyGroup, leftLeg, rightLeg, leftArm, rightArm, head };
}

/**
 * Composite 5-part Golden Alphabet Crest Monument
 */
export function buildLetterMonument(world: AlphabetWorld, anisotropy = 4): THREE.Group {
  const group = new THREE.Group();
  addContactShadow(group, 2.2);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.78,
    metalness: 0.05,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.2,
    metalness: 0.88,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: world.palette.accentHex,
    roughness: 0.3,
    metalness: 0.35,
  });

  // Stepped pedestal base
  const base1 = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.25, 0.36, 24), stoneMat);
  base1.position.y = 0.18;
  base1.receiveShadow = true;
  base1.castShadow = true;
  group.add(base1);

  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.75, 0.42, 24), accentMat);
  base2.position.y = 0.56;
  base2.castShadow = true;
  group.add(base2);

  // Outer golden torus medallion frame
  const medallionGroup = new THREE.Group();
  medallionGroup.position.y = 2.65;
  medallionGroup.name = 'spinning_crest';
  group.add(medallionGroup);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.14, 14, 36), goldMat);
  ring.castShadow = true;
  medallionGroup.add(ring);

  const crestTex = createLetterCrestTexture(
    world.letter,
    world.primaryWord,
    world.palette.accentHex,
    anisotropy,
  );
  const discMat = new THREE.MeshStandardMaterial({
    map: crestTex,
    roughness: 0.35,
    metalness: 0.08,
  });
  const coreDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.38, 0.18, 32), goldMat);
  coreDisc.rotation.x = Math.PI / 2;
  coreDisc.castShadow = true;
  medallionGroup.add(coreDisc);

  const faceGeo = new THREE.CircleGeometry(1.36, 32);
  const frontFace = new THREE.Mesh(faceGeo, discMat);
  frontFace.position.z = 0.095;
  const backFace = new THREE.Mesh(faceGeo, discMat);
  backFace.position.z = -0.095;
  backFace.rotation.y = Math.PI;
  medallionGroup.add(frontFace, backFace);

  // Crown jewel spire on top
  const spire = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), goldMat);
  spire.position.y = 1.72;
  medallionGroup.add(spire);

  return group;
}

/**
 * Custom 3–12 Part Procedural Hero 3D Sculpture tailored to each of the 26 A-Z Worlds!
 */
export function buildWorldHeroLandmark(world: AlphabetWorld): THREE.Group {
  const g = new THREE.Group();
  addContactShadow(g, 2.4);

  const matPrimary = new THREE.MeshStandardMaterial({
    color: world.palette.primary,
    roughness: 0.38,
    metalness: 0.15,
  });
  const matSecondary = new THREE.MeshStandardMaterial({
    color: world.palette.secondary,
    roughness: 0.55,
    metalness: 0.2,
  });
  const matDark = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.65,
    metalness: 0.1,
  });
  const matWhite = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.42,
    metalness: 0.05,
  });
  const matWood = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.8,
    metalness: 0.04,
  });
  const matLeaf = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.6,
    metalness: 0.05,
  });
  const matGold = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.2,
    metalness: 0.88,
  });

  // Pedestal platter
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 0.35, 24), matWhite);
  plinth.position.y = 0.175;
  plinth.receiveShadow = true;
  g.add(plinth);

  const hero = new THREE.Group();
  hero.position.y = 0.35;
  hero.name = 'hero_prop';
  g.add(hero);

  switch (world.propType) {
    case 'apple':
    case 'orange': {
      const fruitMat = new THREE.MeshPhysicalMaterial({
        color: world.propType === 'apple' ? 0xe11d48 : 0xf97316,
        roughness: world.propType === 'apple' ? 0.22 : 0.48,
        clearcoat: world.propType === 'apple' ? 0.7 : 0.15,
      });
      const body = new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 20), fruitMat);
      body.scale.set(1.05, 0.94, 1.05);
      body.position.y = 1.25;
      body.castShadow = true;
      hero.add(body);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.65, 10), matWood);
      stem.position.set(0, 2.55, 0);
      stem.rotation.z = -0.18;
      hero.add(stem);

      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, 0);
      leafShape.quadraticCurveTo(0.45, 0.35, 0.9, 0);
      leafShape.quadraticCurveTo(0.45, -0.35, 0, 0);
      const leaf = new THREE.Mesh(
        new THREE.ExtrudeGeometry(leafShape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }),
        matLeaf,
      );
      leaf.position.set(0.05, 2.65, 0);
      leaf.rotation.set(0.4, 0.2, 0.3);
      hero.add(leaf);

      // Side mini fruits
      for (let i = 0; i < 2; i++) {
        const mini = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14), fruitMat);
        mini.position.set(i === 0 ? -1.4 : 1.4, 0.42, 0.6);
        mini.castShadow = true;
        hero.add(mini);
      }
      break;
    }

    case 'ball': {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.3, 24, 20), matWhite);
      sphere.position.y = 1.35;
      sphere.castShadow = true;
      hero.add(sphere);

      // Pentagon dark patches
      const patchGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.08, 5);
      const dirs = [
        [0, 1, 0],
        [0, -1, 0],
        [1, 0.3, 0],
        [-1, 0.3, 0],
        [0, 0.3, 1],
        [0, 0.3, -1],
      ];
      dirs.forEach(([dx, dy, dz]) => {
        const p = new THREE.Mesh(patchGeo, matPrimary);
        const v = new THREE.Vector3(dx, dy, dz).normalize();
        p.position.copy(v.clone().multiplyScalar(1.27)).add(new THREE.Vector3(0, 1.35, 0));
        p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
        hero.add(p);
      });

      // Goalpost arch behind
      const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.6, 10);
      const pL = new THREE.Mesh(postGeo, matGold);
      pL.position.set(-1.6, 1.3, -1.2);
      const pR = new THREE.Mesh(postGeo, matGold);
      pR.position.set(1.6, 1.3, -1.2);
      const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.3, 10), matGold);
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.set(0, 2.6, -1.2);
      hero.add(pL, pR, crossbar);
      break;
    }

    case 'house': {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.7, 1.9), matWhite);
      wall.position.y = 0.85;
      wall.castShadow = true;
      hero.add(wall);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.85, 1.25, 4), matPrimary);
      roof.position.y = 2.3;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      hero.add(roof);

      const door = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.95, 0.1), matWood);
      door.position.set(0, 0.48, 0.96);
      hero.add(door);

      const winMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.35 });
      const winL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.1), winMat);
      winL.position.set(-0.68, 1.0, 0.96);
      const winR = winL.clone();
      winR.position.x = 0.68;
      hero.add(winL, winR);

      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.8, 0.32), matSecondary);
      chimney.position.set(0.6, 2.35, -0.35);
      hero.add(chimney);
      break;
    }

    case 'icecream': {
      const coneMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.78 });
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.9, 18), coneMat);
      cone.rotation.x = Math.PI;
      cone.position.y = 0.95;
      cone.castShadow = true;
      hero.add(cone);

      const scoop1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.88, 20, 16),
        new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.35 }),
      );
      scoop1.position.y = 2.05;
      scoop1.castShadow = true;
      const scoop2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 20, 16),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.35 }),
      );
      scoop2.position.y = 2.85;
      scoop2.castShadow = true;
      const cherry = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 14, 12),
        new THREE.MeshPhysicalMaterial({ color: 0xe11d48, clearcoat: 1, roughness: 0.15 }),
      );
      cherry.position.y = 3.58;
      hero.add(scoop1, scoop2, cherry);
      break;
    }

    case 'space':
    case 'universe': {
      // Composite Rocket + Ringed Planet
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 2.1, 18), matWhite);
      hull.position.y = 1.4;
      hull.castShadow = true;
      hero.add(hull);

      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.85, 18), matPrimary);
      nose.position.y = 2.85;
      hero.add(nose);

      const windowGlass = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 14, 14),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.5 }),
      );
      windowGlass.position.set(0, 1.7, 0.45);
      hero.add(windowGlass);

      for (let i = 0; i < 3; i++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.48), matPrimary);
        const ang = (i * Math.PI * 2) / 3;
        fin.position.set(Math.sin(ang) * 0.58, 0.65, Math.cos(ang) * 0.58);
        fin.rotation.y = ang;
        hero.add(fin);
      }

      // Orbiting Saturn sphere + ring
      const planet = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 16), matGold);
      planet.position.set(1.35, 2.35, 0.2);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.09, 10, 28), matSecondary);
      ring.position.copy(planet.position);
      ring.rotation.set(1.1, 0.3, 0.2);
      hero.add(planet, ring);
      break;
    }

    case 'xylophone': {
      const railL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.25, 2.8), matWood);
      railL.position.set(-0.75, 0.45, 0);
      const railR = railL.clone();
      railR.position.x = 0.75;
      hero.add(railL, railR);

      const barColors = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899];
      for (let i = 0; i < 8; i++) {
        const w = 1.9 - i * 0.1;
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(w, 0.14, 0.26),
          new THREE.MeshStandardMaterial({ color: barColors[i], roughness: 0.25, metalness: 0.2 }),
        );
        bar.position.set(0, 0.66, -1.1 + i * 0.31);
        bar.castShadow = true;
        hero.add(bar);
      }

      // Two mallets
      for (let m = -1; m <= 1; m += 2) {
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), matWood);
        stick.position.set(m * 0.5, 1.25, 0.8);
        stick.rotation.set(0.6, 0, m * 0.35);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), matGold);
        head.position.set(m * 0.25, 1.75, 0.25);
        hero.add(stick, head);
      }
      break;
    }

    case 'queen': {
      const cushion = new THREE.Mesh(
        new THREE.CylinderGeometry(1.25, 1.35, 0.45, 24),
        new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.8 }),
      );
      cushion.position.y = 0.22;
      hero.add(cushion);

      const crownBand = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.82, 0.5, 24), matGold);
      crownBand.position.y = 0.72;
      crownBand.castShadow = true;
      hero.add(crownBand);

      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6;
        const prong = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.72, 6), matGold);
        prong.position.set(Math.cos(ang) * 0.82, 1.25, Math.sin(ang) * 0.82);
        const gem = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.14, 0),
          new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xe11d48 : 0x38bdf8, roughness: 0.15, metalness: 0.3 }),
        );
        gem.position.set(Math.cos(ang) * 0.82, 1.65, Math.sin(ang) * 0.82);
        hero.add(prong, gem);
      }
      break;
    }

    case 'vehicle': {
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 2.7), matPrimary);
      chassis.position.y = 0.65;
      chassis.castShadow = true;
      hero.add(chassis);

      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.5, 1.25),
        new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.15, clearcoat: 1 }),
      );
      cabin.position.set(0, 1.15, -0.1);
      hero.add(cabin);

      const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 16);
      const wheelPositions = [
        [-0.75, 0.36, 0.85],
        [0.75, 0.36, 0.85],
        [-0.75, 0.36, -0.85],
        [0.75, 0.36, -0.85],
      ];
      wheelPositions.forEach(([wx, wy, wz]) => {
        const wheel = new THREE.Mesh(wheelGeo, matDark);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, wy, wz);
        wheel.castShadow = true;
        hero.add(wheel);
      });

      const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.1, 0.35), matGold);
      spoiler.position.set(0, 1.25, -1.2);
      hero.add(spoiler);
      break;
    }

    case 'kite': {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.5, 8), matWood);
      pole.position.y = 1.25;
      hero.add(pole);

      const kiteShape = new THREE.Shape();
      kiteShape.moveTo(0, 1.3);
      kiteShape.lineTo(0.95, 0.2);
      kiteShape.lineTo(0, -1.1);
      kiteShape.lineTo(-0.95, 0.2);
      kiteShape.closePath();

      const sail = new THREE.Mesh(
        new THREE.ExtrudeGeometry(kiteShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }),
        matPrimary,
      );
      sail.position.set(0, 2.45, 0.1);
      sail.rotation.set(-0.25, 0.2, 0.12);
      sail.castShadow = true;
      hero.add(sail);

      for (let i = 0; i < 4; i++) {
        const bow = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), matGold);
        bow.position.set(0.15 * Math.sin(i), 1.2 - i * 0.28, 0.25);
        hero.add(bow);
      }
      break;
    }

    case 'water': {
      // Lighthouse + waves ring
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.82, 2.4, 18), matWhite);
      tower.position.y = 1.2;
      tower.castShadow = true;
      hero.add(tower);

      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.65, 18), matPrimary);
      stripe.position.y = 1.2;
      hero.add(stripe);

      const lantern = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 0.45, 16),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.8 }),
      );
      lantern.position.y = 2.6;
      hero.add(lantern);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.55, 16), matDark);
      roof.position.y = 3.08;
      hero.add(roof);
      break;
    }

    case 'nature':
    case 'jungle': {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.52, 1.9, 12), matWood);
      trunk.position.y = 0.95;
      trunk.castShadow = true;
      hero.add(trunk);

      const tiers = [
        { y: 1.95, r: 1.35, h: 1.15 },
        { y: 2.7, r: 1.0, h: 1.0 },
        { y: 3.35, r: 0.65, h: 0.85 },
      ];
      tiers.forEach((t) => {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 14), matLeaf);
        cone.position.y = t.y;
        cone.castShadow = true;
        hero.add(cone);
      });
      break;
    }

    default: {
      // Rich stylized composite animal/creature sculpture tailored per propType (cat, dog, elephant, fish, giraffe, lion, monkey, penguin, rabbit, tiger, yak, zebra)
      const isTall = world.propType === 'giraffe';
      const isFish = world.propType === 'fish';

      if (isFish) {
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.95, 20, 16), matPrimary);
        body.scale.set(1.45, 0.9, 0.72);
        body.position.y = 1.45;
        body.castShadow = true;
        hero.add(body);

        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.9, 4), matSecondary);
        tail.rotation.z = -Math.PI / 2;
        tail.position.set(-1.5, 1.45, 0);
        hero.add(tail);

        const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 4), matSecondary);
        dorsal.position.set(0, 2.35, 0);
        hero.add(dorsal);

        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), matWhite);
        eye.position.set(0.85, 1.65, 0.52);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), matDark);
        pupil.position.set(0.92, 1.65, 0.6);
        hero.add(eye, pupil);
      } else {
        // Stylized 4-legged / 2-legged animal sculpture
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 0.95, 8, 16), matPrimary);
        body.rotation.x = world.propType === 'penguin' ? 0 : Math.PI / 2;
        body.position.set(0, isTall ? 1.5 : 1.05, 0);
        body.castShadow = true;
        hero.add(body);

        // Legs
        const legH = isTall ? 1.25 : 0.7;
        const legGeo = new THREE.CylinderGeometry(0.15, 0.13, legH, 10);
        const offsets =
          world.propType === 'penguin'
            ? [
                [-0.28, 0.25, 0.25],
                [0.28, 0.25, 0.25],
              ]
            : [
                [-0.38, legH / 2, 0.45],
                [0.38, legH / 2, 0.45],
                [-0.38, legH / 2, -0.45],
                [0.38, legH / 2, -0.45],
              ];
        offsets.forEach(([lx, ly, lz]) => {
          const leg = new THREE.Mesh(legGeo, world.propType === 'penguin' ? matSecondary : matPrimary);
          leg.position.set(lx, ly, lz);
          leg.castShadow = true;
          hero.add(leg);
        });

        // Neck & Head
        const headGroup = new THREE.Group();
        const neckH = isTall ? 1.35 : 0.2;
        if (isTall) {
          const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, neckH, 12), matPrimary);
          neck.position.set(0, 2.25, 0.48);
          neck.rotation.x = 0.15;
          hero.add(neck);
        }
        headGroup.position.set(0, isTall ? 3.15 : 1.75, world.propType === 'penguin' ? 0.1 : 0.72);
        hero.add(headGroup);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 16), matPrimary);
        head.castShadow = true;
        headGroup.add(head);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.08, 10, 10);
        const eL = new THREE.Mesh(eyeGeo, matWhite);
        eL.position.set(-0.18, 0.12, 0.4);
        const eR = new THREE.Mesh(eyeGeo, matWhite);
        eR.position.set(0.18, 0.12, 0.4);
        const pL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), matDark);
        pL.position.set(-0.18, 0.12, 0.46);
        const pR = pL.clone();
        pR.position.x = 0.18;
        headGroup.add(eL, eR, pL, pR);

        // Distinct species traits
        if (world.propType === 'elephant') {
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.95, 12), matPrimary);
          trunk.position.set(0, -0.35, 0.45);
          trunk.rotation.x = -0.35;
          headGroup.add(trunk);
          const earGeo = new THREE.SphereGeometry(0.45, 12, 12);
          const earL = new THREE.Mesh(earGeo, matSecondary);
          earL.scale.set(0.2, 1, 0.8);
          earL.position.set(-0.52, 0.05, -0.05);
          const earR = earL.clone();
          earR.position.x = 0.52;
          headGroup.add(earL, earR);
        } else if (world.propType === 'rabbit') {
          const earGeo = new THREE.CapsuleGeometry(0.1, 0.62, 6, 10);
          const earL = new THREE.Mesh(earGeo, matWhite);
          earL.position.set(-0.18, 0.65, 0);
          const earR = earL.clone();
          earR.position.x = 0.18;
          headGroup.add(earL, earR);
        } else if (world.propType === 'lion') {
          const mane = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.22, 10, 20), matSecondary);
          mane.position.z = -0.06;
          headGroup.add(mane);
        } else if (world.propType === 'penguin') {
          const belly = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 14), matWhite);
          belly.scale.set(0.82, 1.15, 0.55);
          belly.position.set(0, 1.0, 0.32);
          hero.add(belly);
          const beak = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 8), matSecondary);
          beak.rotation.x = Math.PI / 2;
          beak.position.set(0, -0.02, 0.54);
          headGroup.add(beak);
        } else {
          // Ears / Horns (cat, dog, tiger, zebra, yak, monkey, giraffe)
          const earGeo = new THREE.ConeGeometry(0.16, 0.34, 8);
          const earL = new THREE.Mesh(earGeo, matSecondary);
          earL.position.set(-0.28, 0.44, 0);
          earL.rotation.z = 0.25;
          const earR = earL.clone();
          earR.position.x = 0.28;
          earR.rotation.z = -0.25;
          headGroup.add(earL, earR);
        }
      }
      break;
    }
  }

  return g;
}
