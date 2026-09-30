import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MapNode, ClarityStatus } from '../../types';
import { RotateCcw, Box, Compass } from 'lucide-react';

interface LivingMap3DProps {
  nodes: MapNode[];
  onSelectNode: (node: MapNode) => void;
  selectedNodeId: string | null;
  currentFocusId: string;
}

// 3D Landmark Positions in Displaced 3D Space (X, Y elevation, Z)
const NODE_3D_COORDINATES: { [id: string]: [number, number, number] } = {
  current_life: [-9.8, 1.2, 2.8],
  relationships: [-3.8, 2.5, -4.8],
  work: [0.8, 3.8, -3.5],
  experience: [-0.6, 1.1, 1.6],
  learning: [-5.6, 1.6, 4.8],
  money: [1.2, 1.4, 5.8],
  values_tradeoffs: [7.2, 2.2, 5.5],
  the_gap: [6.4, 0.4, -3.0],
  desired_difference: [9.8, 4.8, -4.8],
  current_focus: [10.2, 2.8, 0.2],
};

export const LivingMap3D: React.FC<LivingMap3DProps> = ({
  nodes,
  onSelectNode,
  selectedNodeId,
  currentFocusId,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [screenPositions, setScreenPositions] = useState<{ [id: string]: { x: number; y: number; visible: boolean } }>({});
  const [displacementScale, setDisplacementScale] = useState<number>(3.5);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const lighthouseBeamRef = useRef<THREE.Group | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameRef = useRef<number>(0);

  // Initialize 3D Displaced Terrain Engine
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x16191d);
    scene.fog = new THREE.FogExp2(0x16191d, 0.015);

    // 2. Camera with Isometric initial perspective
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 200);
    camera.position.set(16, 20, 22);
    camera.lookAt(0, 1.5, 0);
    cameraRef.current = camera;

    // 3. High-Quality WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls (Full 360° 3D navigation)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 8;
    controls.maxDistance = 55;
    controls.target.set(0, 1.5, 0);
    controlsRef.current = controls;

    // 5. Dynamic Lighting & Shadows
    const ambientLight = new THREE.AmbientLight(0x7a8a99, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8ea, 2.5);
    sunLight.position.set(22, 30, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 70;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    const blueSkyLight = new THREE.DirectionalLight(0x406085, 1.0);
    blueSkyLight.position.set(-20, 15, -18);
    scene.add(blueSkyLight);

    // Warm heavenly sun point for Desired Difference
    const goldenSun = new THREE.PointLight(0xffdf88, 4.0, 30);
    goldenSun.position.set(10, 9, -6);
    scene.add(goldenSun);

    // 6. 3D Ocean Water Mesh Underneath
    const oceanGeo = new THREE.PlaneGeometry(120, 120, 64, 64);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x141f26,
      roughness: 0.15,
      metalness: 0.8,
      flatShading: true,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.05;
    ocean.receiveShadow = true;
    scene.add(ocean);

    // 7. Load Texture & Construct 3D Elevation Terrain Mesh
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/assets/map-layer.png', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;

      // Create high-density grid for 3D elevation displacement
      const gridW = 30;
      const gridH = 20;
      const segmentsX = 320;
      const segmentsY = 220;
      const terrainGeo = new THREE.PlaneGeometry(gridW, gridH, segmentsX, segmentsY);

      // Create an offscreen canvas to sample luminance for displacement
      const img = texture.image;
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 220;
      const ctx = canvas.getContext('2d');
      if (ctx && img) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        // Displace vertices in 3D space
        const posAttr = terrainGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const u = (posAttr.getX(i) + gridW / 2) / gridW;
          const v = 1 - (posAttr.getY(i) + gridH / 2) / gridH; // invert v

          const px = Math.floor(Math.min(Math.max(u, 0), 0.999) * canvas.width);
          const py = Math.floor(Math.min(Math.max(v, 0), 0.999) * canvas.height);
          const idx = (py * canvas.width + px) * 4;

          const r = imgData[idx] / 255;
          const g = imgData[idx + 1] / 255;
          const b = imgData[idx + 2] / 255;

          // Perceived brightness
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

          // Multi-zone Gaussian 3D Elevation Height calculations
          // 1. Castle Mountain (Work)
          const dCastle = Math.hypot(u - 0.53, v - 0.31);
          const hCastle = Math.exp(-(dCastle * dCastle) / 0.015) * 3.8;

          // 2. Mountain Ridge (behind castle and values)
          const dMtn1 = Math.hypot(u - 0.42, v - 0.25);
          const hMtn1 = Math.exp(-(dMtn1 * dMtn1) / 0.02) * 3.4;

          const dMtn2 = Math.hypot(u - 0.75, v - 0.75);
          const hMtn2 = Math.exp(-(dMtn2 * dMtn2) / 0.018) * 2.2;

          // 3. Desired Difference Floating Island
          const dDream = Math.hypot(u - 0.845, v - 0.25);
          const hDream = Math.exp(-(dDream * dDream) / 0.012) * 4.8;

          // 4. University (Learning)
          const dUni = Math.hypot(u - 0.305, v - 0.72);
          const hUni = Math.exp(-(dUni * dUni) / 0.012) * 1.5;

          // 5. Lighthouse Cape (Current Focus)
          const dLight = Math.hypot(u - 0.84, v - 0.53);
          const hLight = Math.exp(-(dLight * dLight) / 0.012) * 2.4;

          // Base Island Plateau
          const dIsland = Math.hypot(u - 0.48, v - 0.52);
          const isIsland = dIsland < 0.42;
          const islandBase = isIsland ? (1 - dIsland / 0.42) * 1.0 : 0;

          // Water Mask: suppress dark water corners
          const isWater = brightness < 0.18 && dDream > 0.15 && dIsland > 0.45;
          const finalZ = isWater ? -0.1 : islandBase + hCastle + hMtn1 + hMtn2 + hDream + hUni + hLight + brightness * 0.6;

          posAttr.setZ(i, finalZ);
        }

        terrainGeo.computeVertexNormals();
      }

      // Material applying original 4K hand-painted texture onto the 3D surface
      const terrainMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.75,
        metalness: 0.1,
        flatShading: false,
        side: THREE.DoubleSide,
      });

      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      terrainMesh.rotation.x = -Math.PI / 2; // lay flat in X-Z plane
      terrainMesh.position.y = 0;
      terrainMesh.receiveShadow = true;
      terrainMesh.castShadow = true;
      scene.add(terrainMesh);
      terrainMeshRef.current = terrainMesh;
    });

    // 8. 3D Volumetric Lighthouse Light Cone Beam
    const beamGroup = new THREE.Group();
    beamGroup.position.set(10.2, 2.6, 0.2);

    const beamGeo = new THREE.ConeGeometry(3.6, 12.0, 24, 1, true);
    beamGeo.translate(0, 6.0, 0);
    beamGeo.rotateX(Math.PI / 2);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfffaab,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamGroup.add(beamMesh);

    const lightBulb = new THREE.PointLight(0xffea78, 4.5, 18);
    beamGroup.add(lightBulb);

    lighthouseBeamRef.current = beamGroup;
    scene.add(beamGroup);

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Rotate Lighthouse Volumetric Light in 3D
      if (lighthouseBeamRef.current) {
        lighthouseBeamRef.current.rotation.y = elapsed * 0.65;
      }

      // Update Controls
      controls.update();

      // Render Scene
      renderer.render(scene, camera);

      // Project 3D Coordinates to 2D UI Badges
      const newPos: { [id: string]: { x: number; y: number; visible: boolean } } = {};
      nodes.forEach((node) => {
        const coords3D = NODE_3D_COORDINATES[node.id] || [0, 1, 0];
        const v = new THREE.Vector3(...coords3D);
        v.y += 0.9; // badge hover offset above 3D mountain/building peak
        v.project(camera);

        const isBehind = v.z > 1;
        const x = ((v.x + 1) * width) / 2;
        const y = ((-v.y + 1) * height) / 2;

        newPos[node.id] = {
          x,
          y,
          visible: !isBehind && x >= -80 && x <= width + 80 && y >= -40 && y <= height + 40,
        };
      });
      setScreenPositions(newPos);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Camera Fly-to on Node Selection
  useEffect(() => {
    if (!selectedNodeId || !controlsRef.current || !cameraRef.current) return;
    const coords3D = NODE_3D_COORDINATES[selectedNodeId];
    if (coords3D) {
      const [nx, ny, nz] = coords3D;
      const controls = controlsRef.current;
      controls.target.set(nx, ny, nz);
      cameraRef.current.position.set(nx + 10, ny + 11, nz + 12);
    }
  }, [selectedNodeId]);

  // Reset to Isometric
  const resetIsometric = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    controlsRef.current.target.set(0, 1.5, 0);
    cameraRef.current.position.set(16, 20, 22);
  };

  // Dot color helper
  const getDotColor = (status: ClarityStatus) => {
    switch (status) {
      case 'UNCLEAR':
        return '#8a8d91';
      case 'EXPLORING':
        return '#eab308';
      case 'DEFINED':
        return '#3b82f6';
      case 'GROUNDED':
        return '#22c55e';
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#16191d] select-none">
      {/* 1. Full 3D Displaced WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 2. Floating 3D Node UI Pins (Linked to 3D Vertex Heights) */}
      <div className="absolute inset-0 pointer-events-none">
        {nodes.map((node) => {
          const pos = screenPositions[node.id];
          if (!pos || !pos.visible) return null;

          const isSelected = selectedNodeId === node.id;
          const isFocus = node.id === currentFocusId;

          return (
            <div
              key={node.id}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: 'translate(-50%, -100%)',
              }}
              className="absolute pointer-events-auto transition-transform duration-200 hover:scale-110"
            >
              <button
                onClick={() => onSelectNode(node)}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                {/* Current Focus Compass Icon */}
                {isFocus && (
                  <div className="mb-1.5 flex items-center justify-center w-9 h-9 rounded-full bg-[#3d3224] border-2 border-[#d4af37] shadow-xl shadow-amber-500/50 animate-bounce">
                    <svg
                      className="w-5 h-5 text-amber-300 transform -rotate-45"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="12,2 15,10 22,12 15,14 12,22 9,14 2,12 9,10" />
                    </svg>
                  </div>
                )}

                {/* Badge Container */}
                <div
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-2xl transition-all duration-200 ${
                    isSelected
                      ? 'bg-amber-100 text-amber-950 ring-2 ring-amber-400 scale-110 shadow-amber-400/40'
                      : isFocus
                      ? 'bg-[#d8c7b0] text-[#2c2419] ring-2 ring-[#c5a880]'
                      : 'bg-[#cfc0ab]/95 text-[#332a1e] hover:bg-[#ded2c0]'
                  }`}
                  style={{
                    boxShadow: '0 4px 14px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.6)',
                  }}
                >
                  <span className="font-serif-title">{node.label}</span>
                </div>

                {/* Clarity Status Dots */}
                {node.dots && node.dots.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1 bg-black/80 px-2.5 py-0.5 rounded-full backdrop-blur-xs shadow-md border border-white/10">
                    {node.dots.map((dot, idx) => (
                      <span
                        key={idx}
                        className="w-2.5 h-2.5 rounded-full ring-1 ring-black/50 shadow-xs"
                        style={{ backgroundColor: getDotColor(dot) }}
                      />
                    ))}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 3. Camera Quick Controls (Top Right of Map) */}
      <div className="absolute top-5 right-6 flex items-center gap-2 z-30">
        <button
          onClick={resetIsometric}
          className="bg-[#25282c]/90 hover:bg-[#34383e] border border-stone-600/60 text-stone-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xl backdrop-blur-md cursor-pointer transition-all active:scale-95"
          title="Trở về góc nhìn Isometric chuẩn"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Góc Isometric chuẩn</span>
        </button>
      </div>

      {/* 4. Map Header Title */}
      <div className="absolute top-5 left-6 pointer-events-none z-30">
        <h1 className="text-3xl font-serif-title tracking-wide text-[#e3ded4] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          The Living Map
        </h1>
        <p className="text-xs text-stone-400 mt-1 font-medium drop-shadow-md">
          Giữ chuột trái để xoay 3D 360° • Chuột phải để Pan • Lăn chuột để Zoom chiều sâu 3D
        </p>
      </div>

      {/* 5. Clarity Key Legend (Bottom Left) */}
      <div className="absolute bottom-5 left-6 bg-[#25282c]/95 border border-stone-600/60 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs z-30">
        <div className="font-semibold text-stone-300 mb-2 uppercase tracking-wider text-[10px]">
          Clarity Key
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8a8d91] ring-1 ring-black/40" />
            <span className="text-stone-300 font-medium text-[11px]">UNCLEAR</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] ring-1 ring-black/40" />
            <span className="text-stone-300 font-medium text-[11px]">EXPLORING</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] ring-1 ring-black/40" />
            <span className="text-stone-300 font-medium text-[11px]">DEFINED</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] ring-1 ring-black/40" />
            <span className="text-stone-300 font-medium text-[11px]">GROUNDED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
