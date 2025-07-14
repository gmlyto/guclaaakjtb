import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';

interface Symbol {
  name: string;
  image: string;
}

const BauCuaGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const worldRef = useRef<CANNON.World>();
  const diceRef = useRef<THREE.Mesh[]>([]);
  const diceBodiesRef = useRef<CANNON.Body[]>([]);
  const synthRef = useRef<any>();

  const [isShaking, setIsShaking] = useState(false);
  const [isReadyToOpen, setIsReadyToOpen] = useState(false);
  const [isBowlOpen, setIsBowlOpen] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [results, setResults] = useState<number[]>([]);

  const symbols: Record<number, Symbol> = {
    1: { name: 'Rusa', image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzg3NWMzMyIgZD0iTTE5IDVWN0gxN1Y1SDE5TTUgN0g3VjVINTVNNyA5SDlWMTFIOFYxM0g5VjE1SDdWMTNINVYxNUg0VjlINVYxMUg3VjlNMTUgOUgxN1YxMUgxNlYxM0gxN1YxNUgxNVYxM0gxM1YxNUgxMlY5SDEzVjExSDE1VjlNMTIgMkM5LjUgMiA3LjQ3IDQuNDQgNy40NyA0LjQ0TDcgN0gxN0w3LjQ3IDQuNDRDNy40NyA0LjQ0IDkuNSAyIDEyIDJNMTIgMjJDMTQuNSAyMiAxNi41MyAxOS41NiAxNi41MyAxOS41NkwxNyAxN0gxNkwxNC41MyAxOS41NkMxNC41MyAxOS41NiAxMy41IDIxIDEyIDIxQzEwLjUgMjEgOS40NyAxOS41NiA5LjQ3IDE5LjU2TDggMTdIN1YxOUw5LjQ3IDE5LjU2QzkuNDcgMTkuNTYgOS41IDIyIDEyIDIyWiIvPjwvc3ZnPg==' },
    2: { name: 'Labu', image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2Y5NzQwMCIgZD0iTTE5IDguNUMxOSA1LjQ2IDE2LjU0IDMgMTMuNSAzUzggNS40NiA4IDguNVY5SDVWN0g3VjguNUExLjUgMS41IDAgMCAxIDguNSA3SDE4LjVBMi41IDIuNSAwIDAgMCAyMSA0LjVWMy41QTIuNSAyLjUgMCAwIDAgMTguNSAxaC01QzkuNDYgMSA1IDUuNDYgNSA4LjVWOUg0Yy0xLjEgMC0yIC45LTIgMnY4YzAgMS4xLjkgMiAyIDJoMThjMS4xIDAgMi0uOSAyLTJ2LThjMC0xLjEtLjktMi0yLTJoLTFWOEEyIDIgMCAwIDAgMTkgOC41ek0yMCAxOUg0di04aDE2djh6Ii8+PC9zdmc+' },
    3: { name: 'Ayam', image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2Q0YjE0MyIgZD0iTTIgMThWMjBIMjJWMTlMMjAgMTdMMTYgMjFIMTRMMTMgMThIMTlWMTZMMTMgMTBWMTRIMTJWMTZIMTFWMTRIMTBWMTAuNUExLjUgMS41IDAgMCAxIDExLjUgOVY4QTEuNSAxLjUgMCAwIDEgMTAgNi41VjVDMTAgMy45IDEwLjkgMyAxMiAzQzEzLjEgMyAxNCAzLjkgMTQgNVY3SDE1VjVDMTUgMy4zNCAxNi4zNCAyIDE4IDJIMjBWM0gyM1Y1SDIwVjlIMThWMjdIMTZWNkgxNVY4QzE1IDguNTUgMTQuNTUgOSAxNCA5LjVWMTNMMTIgMTFIOVYxM0g3VjlINVYxM0gzVjlIMVYxM0gyVjE4WiIvPjwvc3ZnPg==' },
    4: { name: 'Ikan', image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzQyYTBlMCIgZD0iTTEyIDEyLjVDMTIuMjIgMTIuNSAxMi40NCAxMi40NSAxMi42MyAxMi4zN0wxNyA5LjczVjguMjNMMTQuNSAxMC4yM0wxMiAxMS43M1YxMC4yM0wxNC41IDguMjNMMTMuMjUgNy4yM0wxMiA4LjIzVjYuNzNMMTMuMjUgNS43M0wxNC41IDYuNzNMMTcgNC43M1YySDRWNC43M0w2LjUgNi43M0w3Ljc1IDUuNzNMMTIgNi43M1Y4LjIzTDkuNSA3LjIzTDEwLjc1IDguMjNMNyA4LjIzVjkuNzNMMTEuMzcgMTIuMzdDMTEuNTYgMTIuNDUgMTEuNzggMTIuNSAxMiAxMi41VjEzLjIzTDcgMTUuNzVWMTcuMjVMOS41IDE1LjI1TDEyIDEzLjc1VjE1LjI1TDkuNSAxNy4yNUwxMC43NSAxOC4yNUwxMiAxNy4yNVYyMS43NUgxNFYyMC4yNUwxNi41IDE4LjI1TDE3Ljc1IDIwLjI1TDIwIDE4LjI1VjEzLjI1TDEyIDEzLjIzVjEyLjVaIi8+PC9zdmc+' },
    5: { name: 'Kepiting', image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2QxMzAyYSIgZD0iTTIgOS4yNkw1LjUgMTF2Mi41TDQgMTQuNzVWMTdMMiAxNS4yNVY5LjI1TTIyIDkuMjV2Ni4wMUwxOCAxN3YtMi4yNUwxOS41IDEzLjVWMTFMMjIgOS4yNU0yMiA3LjI1TDE5LjUgOVY3TDcุทธMTEuMjVMNyA5bC0yLjUtMS43NUw3IDVWN0gxN1Y1bDItMS43NUwxNyA3VjlMMjIgNy4yNU0xMiAxM2MtMi4yMSAwLTQgMS43OS00IDRzMS43OSA0IDQgNCA0LTEuNzkgNC00LTEuNzktNC00LTR6Ii8+PC9zdmc+' },
    6: { name: 'Udang', image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2Y0NzI3MiIgZD0iTTE4LjM2IDE2LjY4Yy0uMi0uNDUtLjQ4LS44NS0uODMtMS4yQTEwLjg3IDEwLjg3IDAgMCAwIDE5IDExYzAtMS4wMy0uMTgtMi4wMy0uNS0zSDIwdi0ySDYuNzVjLS4xNi0uMzQtLjM0LS42Ny0uNTQtMWgtMS4zMWMuMzggMS4yMS41OSAyLjQ5LjU5IDMuOEM1LjUgMTIuNjkgMy4zMSAxNi43MSAyIDE4aDJjLjY5LTEuNSAxLjcxLTIuNzggMy0zLjc1di43NWMwIDEuNjYgMS4zNCAzIDMgM2g0LjM2Yy41My42NyAxLjE0IDEuMjggMS44MSAxLjgxTDE3LjUgMjFsMS40MS0xLjQxTDE4LjM2IDE2Ljh6TTggMTFjLS4zOS0xLjA2LS41OC0yLjE5LS41OC0zLjM4YzAtLjUuMDYtLjk4LjE3LTEuNDZDNy4yNiA3LjA0IDggOC4wOCA4IDkuMjVWMTF6Ii8+PC9zdmc+' }
  };

  const setupAudio = useCallback(async () => {
    if (Tone && !synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "square" },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 },
        volume: -12
      }).toDestination();
    }
  }, []);

  const playShakeSound = useCallback(() => {
    if (!isSoundOn || !synthRef.current) return;
    const now = Tone.now();
    synthRef.current.triggerAttackRelease("C2", "8n", now);
    synthRef.current.triggerAttackRelease("G2", "8n", now + 0.1);
  }, [isSoundOn]);

  const playOpenSound = useCallback(() => {
    if (!isSoundOn || !synthRef.current) return;
    synthRef.current.triggerAttackRelease(["C4", "E4", "G4"], "8n", Tone.now());
  }, [isSoundOn]);

  const createDiceTextures = useCallback(() => {
    const textures: THREE.CanvasTexture[] = [];
    for (let i = 1; i <= 6; i++) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 128;
      canvas.height = 128;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = 'black';
      ctx.font = 'bold 80px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i.toString(), 64, 64);
      textures.push(new THREE.CanvasTexture(canvas));
    }
    return textures;
  }, []);

  const initializeThreeJS = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    camera.position.set(0, 4, 0);
    camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    sceneRef.current = scene;
    rendererRef.current = renderer;

    return { scene, camera, renderer };
  }, []);

  const initializePhysics = useCallback(() => {
    const world = new CANNON.World();
    world.gravity.set(0, -50, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    (world.solver as any).iterations = 10;

    // Ground
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // Walls
    const wallShapes = [
      { pos: [0, 0, -2.5], quat: [0, 0, 0, 1] },
      { pos: [0, 0, 2.5], quat: [0, 1, 0, 0] },
      { pos: [-2.5, 0, 0], quat: [0, 1, 0, 0.707] },
      { pos: [2.5, 0, 0], quat: [0, 1, 0, -0.707] }
    ];
    
    wallShapes.forEach(s => {
      const wall = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
      wall.position.set(s.pos[0], s.pos[1], s.pos[2]);
      wall.quaternion.set(s.quat[0], s.quat[1], s.quat[2], s.quat[3]);
      world.addBody(wall);
    });

    worldRef.current = world;
    return world;
  }, []);

  const createDice = useCallback(() => {
    if (!sceneRef.current || !worldRef.current) return;

    const diceTextures = createDiceTextures();
    const materials = diceTextures.map(t => new THREE.MeshLambertMaterial({ map: t }));
    const diceSize = 0.8;

    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.BoxGeometry(diceSize, diceSize, diceSize);
      const mesh = new THREE.Mesh(geometry, materials);
      mesh.castShadow = true;
      
      const body = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Box(new CANNON.Vec3(diceSize / 2, diceSize / 2, diceSize / 2)),
        sleepTimeLimit: 0.5
      });
      
      sceneRef.current.add(mesh);
      worldRef.current.addBody(body);
      diceRef.current.push(mesh);
      diceBodiesRef.current.push(body);
    }
  }, [createDiceTextures]);

  const handleShake = useCallback(async () => {
    if (isShaking || !worldRef.current) return;
    
    if (isBowlOpen) {
      // Reset game
      setIsBowlOpen(false);
      setIsReadyToOpen(false);
      setResults([]);
      return;
    }

    if (!synthRef.current && isSoundOn) {
      await Tone.start();
      setupAudio();
    }

    setIsShaking(true);
    setIsReadyToOpen(false);
    playShakeSound();
    
    diceBodiesRef.current.forEach(body => {
      body.position.set(Math.random() - 0.5, 2, Math.random() - 0.5);
      body.angularVelocity.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
      body.velocity.set(0, -1, 0);
      body.wakeUp();
    });

    setTimeout(() => {
      setIsShaking(false);
      setIsReadyToOpen(true);
    }, 2000);
  }, [isShaking, isBowlOpen, isSoundOn, setupAudio, playShakeSound]);

  const openBowl = useCallback(() => {
    if (!isReadyToOpen || isBowlOpen) return;
    
    setIsBowlOpen(true);
    playOpenSound();
    
    setTimeout(() => {
      const results: number[] = [];
      diceBodiesRef.current.forEach(body => {
        const upVector = new CANNON.Vec3(0, 1, 0);
        const faces = [
          new CANNON.Vec3(1, 0, 0), new CANNON.Vec3(-1, 0, 0),
          new CANNON.Vec3(0, 1, 0), new CANNON.Vec3(0, -1, 0),
          new CANNON.Vec3(0, 0, 1), new CANNON.Vec3(0, 0, -1)
        ];
        
        const faceVectors = faces.map(v => body.quaternion.vmult(v));
        const dots = faceVectors.map(v => v.dot(upVector));
        
        let maxDotIndex = 0;
        for (let i = 1; i < dots.length; i++) {
          if (dots[i] > dots[maxDotIndex]) {
            maxDotIndex = i;
          }
        }
        
        const faceMap = [1, 6, 2, 5, 3, 4];
        results.push(faceMap[maxDotIndex]);
      });
      setResults(results);
    }, 500);
  }, [isReadyToOpen, isBowlOpen, playOpenSound]);

  const handleMainButton = useCallback(() => {
    if (isShaking) return;
    if (!isReadyToOpen && !isBowlOpen) {
      handleShake();
    } else if (isReadyToOpen && !isBowlOpen) {
      openBowl();
    } else if (isBowlOpen) {
      handleShake();
    }
  }, [isShaking, isReadyToOpen, isBowlOpen, handleShake, openBowl]);

  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !worldRef.current) return;
    
    worldRef.current.step(1 / 60);
    
    for (let i = 0; i < diceRef.current.length; i++) {
      diceRef.current[i].position.copy(diceBodiesRef.current[i].position as any);
      diceRef.current[i].quaternion.copy(diceBodiesRef.current[i].quaternion as any);
    }
    
    rendererRef.current.render(sceneRef.current, new THREE.PerspectiveCamera());
    requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    initializeThreeJS();
    initializePhysics();
    createDice();
    animate();

    return () => {
      // Cleanup
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [initializeThreeJS, initializePhysics, createDice, animate]);

  const getButtonText = () => {
    if (isBowlOpen) return 'Tutup';
    if (isReadyToOpen) return 'Mở';
    return 'Xóc';
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--game-background))] text-white flex items-center justify-center p-4">
      <div className="bg-black/20 border-4 border-[hsl(var(--game-border))] rounded-xl p-4 w-full max-w-md h-[95vh] max-h-[800px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-['Lobster'] text-[hsl(var(--game-secondary))] text-3xl flex-1 text-center">
            Bầu Cua 3D
          </h1>
          <Button
            variant="outline"
            size="icon"
            className="border-[hsl(var(--game-border))] text-white hover:bg-white/10"
            onClick={() => setIsSoundOn(!isSoundOn)}
          >
            {isSoundOn ? '🔊' : '🔇'}
          </Button>
        </div>

        {/* Results History */}
        <div className="flex justify-center gap-2 mb-4 h-12">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-12 h-12 bg-white border-2 border-[hsl(var(--game-border))] rounded-lg p-1">
              {results[i] && (
                <img 
                  src={symbols[results[i]].image} 
                  alt={symbols[results[i]].name}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          ))}
        </div>

        {/* 3D Canvas */}
        <div className="relative w-full aspect-square max-w-[280px] mx-auto mb-4 rounded-full overflow-hidden bg-white border-4 border-gray-300">
          <canvas 
            ref={canvasRef}
            className="w-full h-full block"
          />
          {!isBowlOpen && (
            <div 
              className={`absolute inset-0 cursor-pointer transition-all duration-500 ${
                isBowlOpen ? 'opacity-0 translate-y-[-150%] pointer-events-none' : ''
              }`}
              style={{
                backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9ImJvd2xHcmFkaWVudCIgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNTAlIiBmeD0iNjUlIiBmeT0iMzUlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzAwYjRmZiI+PC9zdG9wPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwMDZkYmYiPjwvc3RvcD4KICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iOTUiIGZpbGw9InVybCgjYm93bEdyYWRpZW50KSIgc3Ryb2tlPSIjMDBjNmZmIiBzdHJva2Utd2lkdGg9IjEwIiAvPgogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjQwIiByPSIxNSIgZmlsbD0iIzAwNmRiZiIgc3Ryb2tlPSIjMDBjNmZmIiBzdHJva2Utd2lkdGg9IjMiIC8+Cjwvc3ZnPg==')`,
                backgroundSize: 'cover'
              }}
              onClick={handleMainButton}
            />
          )}
        </div>

        {/* Symbol Display Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {Object.values(symbols).map((symbol, index) => (
            <div key={index} className="bg-white rounded-xl p-2 border-2 border-[hsl(var(--game-border))]">
              <img 
                src={symbol.image} 
                alt={symbol.name}
                className="w-full max-w-[80px] object-contain mx-auto"
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="mt-auto">
          <Button
            className="w-full text-xl font-bold py-3 rounded-full border-3 border-[hsl(var(--game-button-shadow))] 
                     bg-gradient-to-b from-[hsl(var(--game-secondary))] to-[hsl(var(--game-gold))] 
                     text-[#4e342e] hover:scale-105 transition-transform
                     shadow-[0_5px_0_hsl(var(--game-button-shadow))] 
                     active:translate-y-1 active:shadow-[0_2px_0_hsl(var(--game-button-shadow))]
                     disabled:opacity-70 disabled:cursor-not-allowed font-['Roboto']"
            onClick={handleMainButton}
            disabled={isShaking}
          >
            {getButtonText()}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BauCuaGame;