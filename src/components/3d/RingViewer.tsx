
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import RingModel from "./RingModel"
import { useEffect, useRef, useState } from "react"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import * as THREE from "three"

// --- ENVIRONMENT MAP ---
const createGradientTexture = (width: number, height: number, stop1: string) => {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")!
    const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2)
    const color = new THREE.Color(stop1)
    const style = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`
    grad.addColorStop(0, style)
    grad.addColorStop(1, "black")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
}

// --- LUXURY DARK STUDIO ---
function LuxuryStudio({ intensity = 1 }: { intensity?: number }) {
    const { gl, scene } = useThree()
    useEffect(() => {
        const pmremGenerator = new THREE.PMREMGenerator(gl)
        pmremGenerator.compileEquirectangularShader()
        const studioScene = new THREE.Scene()

        // Key light — warm jewelry studio warmth
        const texKey = createGradientTexture(512, 512, "#fff8f0")
        const keyLight = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshBasicMaterial({ map: texKey, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, transparent: true })
        )
        keyLight.position.set(0, 10, 0)
        keyLight.rotation.x = Math.PI / 2
        studioScene.add(keyLight)

        // Fill — neutral
        const texFill = createGradientTexture(256, 256, "#e8eaf0")
        const fillLight = new THREE.Mesh(
            new THREE.PlaneGeometry(15, 10),
            new THREE.MeshBasicMaterial({ map: texFill, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.4 })
        )
        fillLight.position.set(10, 0, 5)
        fillLight.lookAt(0, 0, 0)
        studioScene.add(fillLight)

        // Rim — cool blue accent for jewelry sparkle
        const texRim = createGradientTexture(256, 512, "#b0c8ff")
        const rimLight = new THREE.Mesh(
            new THREE.PlaneGeometry(5, 15),
            new THREE.MeshBasicMaterial({ map: texRim, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.6 })
        )
        rimLight.position.set(-10, 2, -5)
        rimLight.lookAt(0, 0, 0)
        studioScene.add(rimLight)

        const envMap = pmremGenerator.fromScene(studioScene).texture
        scene.environment = envMap

        return () => {
            envMap.dispose()
            pmremGenerator.dispose()
        }
    }, [gl, scene])

    return (
        <group>
            <ambientLight intensity={0.3 * intensity} color="#f5eedd" />
            <spotLight position={[4, 12, 4]} intensity={30 * intensity} angle={0.18} penumbra={1} castShadow color="#fff5e8" />
            <spotLight position={[-5, 8, -3]} intensity={12 * intensity} angle={0.3} penumbra={1} color="#c8d8ff" />
            <pointLight position={[0, 3, 6]} intensity={8 * intensity} color="white" />
        </group>
    )
}

// --- RING DISPLAY STAND (PRESENTOIR) ---
function RingStand({ metalColor = "#2a2a2a" }: { metalColor?: string }) {
    const velvetColor = "#1a0a1a" // Dark burgundy/purple velvet
    const baseColor = "#1c1c1c"  // Dark polished base
    const trimColor = "#c8a84b"  // Gold trim

    return (
        <group position={[0, -2, 0]}>
            {/* VELVET PILLOW / CUSHION */}
            <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.7, 0.65, 0.28, 32]} />
                <meshStandardMaterial color={velvetColor} roughness={0.95} metalness={0.0} />
            </mesh>
            {/* Cushion top dome (slight bulge) */}
            <mesh position={[0, 0.3, 0]} castShadow>
                <sphereGeometry args={[0.68, 32, 16, 0, Math.PI * 2, 0, Math.PI / 5]} />
                <meshStandardMaterial color={velvetColor} roughness={0.95} metalness={0.0} />
            </mesh>
            {/* Gold Ring groove on cushion top */}
            <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.28, 0.03, 8, 48]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} metalness={0.9} />
            </mesh>

            {/* PEDESTAL STEM */}
            <mesh position={[0, -0.22, 0]} castShadow>
                <cylinderGeometry args={[0.12, 0.18, 0.8, 24]} />
                <meshStandardMaterial color={baseColor} roughness={0.1} metalness={0.9} />
            </mesh>

            {/* BASE DISC */}
            <mesh position={[0, -0.65, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.9, 0.95, 0.12, 48]} />
                <meshStandardMaterial color={baseColor} roughness={0.05} metalness={0.95} />
            </mesh>
            {/* Gold rim on base */}
            <mesh position={[0, -0.60, 0]}>
                <torusGeometry args={[0.88, 0.02, 8, 64]} />
                <meshStandardMaterial color={trimColor} roughness={0.15} metalness={1.0} />
            </mesh>

            {/* REFLECTIVE SURFACE / FLOOR */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]} receiveShadow>
                <circleGeometry args={[6, 48]} />
                <meshStandardMaterial color="#0d0d0d" roughness={0.05} metalness={0.3} />
            </mesh>
        </group>
    )
}

const CameraController = () => {
    const { camera, gl } = useThree()
    const controlsRef = useRef<OrbitControls>()

    useEffect(() => {
        const controls = new OrbitControls(camera, gl.domElement)
        controls.minDistance = 2
        controls.maxDistance = 10
        controls.enableDamping = true
        controls.dampingFactor = 0.06
        controls.target.set(0, 0, 0)
        controlsRef.current = controls
        return () => controls.dispose()
    }, [camera, gl])

    useFrame(() => controlsRef.current?.update())
    return null
}

const PROFILES = ["Court", "D-Shape", "Flat", "Knife-Edge"]
const PAVE_SHAPES = ["Round", "Princess", "Emerald", "Marquise"]


type BandMode = 'solitaire' | 'half-eternity' | 'eternity'

const BAND_MODES: { value: BandMode; label: string }[] = [
    { value: 'solitaire', label: 'Solitaire' },
    { value: 'half-eternity', label: '½ Eternity' },
    { value: 'eternity', label: 'Eternity' },
]

export default function RingViewer({ config, intensity = 1.2 }: { config: RingConfig, intensity?: number }) {
    const [profile, setProfile] = useState("Court")
    const [prongStyle, setProngStyle] = useState("Round")
    const [bandMode, setBandMode] = useState<BandMode>('solitaire')
    const [paveShape, setPaveShape] = useState("Round")
    const [paveSize, setPaveSize] = useState(1.5) // 0.3 – 2.8

    const sideActive = bandMode !== 'solitaire'
    const sideLength = bandMode === 'eternity' ? 1.0 : 0.5

    const activeConfig = {
        ...config,
        shank: { ...config.shank, profile },
        head: { ...config.head, prongStyle },
        sideStones: { ...config.sideStones, active: sideActive, length: sideLength, shape: paveShape, size: paveSize }
    }

    const metalColor = { 'Yellow Gold': '#c8a848', 'Rose Gold': '#d4907a', 'White Gold': '#b0b0c0', 'Platinum': '#a0a0b0' }[config.metal] || '#c8a848'

    return (
        <div className="w-full h-full min-h-[600px] flex flex-col font-sans relative"
            style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1510 0%, #0a0a0a 100%)' }}
        >
            {/* TOP BAR UI */}
            <div className="absolute top-4 left-0 w-full z-10 flex flex-col gap-2 items-center pointer-events-none">

                {/* Band Mode */}
                <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-full shadow-lg pointer-events-auto flex gap-2 border border-white/10">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest py-1 pl-1">Style:</span>
                    {BAND_MODES.map(m => (
                        <button key={m.value} onClick={() => setBandMode(m.value)}
                            className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded-full transition-all ${bandMode === m.value ? 'bg-amber-600 text-white shadow-md' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* Pave Stone Shape + Size — visible when eternity mode active */}
                {sideActive && (
                    <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg pointer-events-auto flex flex-wrap gap-x-4 gap-y-2 items-center border border-amber-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Shape picker */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">Pavé:</span>
                            {PAVE_SHAPES.map(s => (
                                <button key={s} onClick={() => setPaveShape(s)}
                                    className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded-full transition-all ${paveShape === s ? 'bg-amber-600 text-white shadow-md' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        {/* Size slider */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest whitespace-nowrap">Taille:</span>
                            <input
                                type="range"
                                min={0.3}
                                max={2.8}
                                step={0.05}
                                value={paveSize}
                                onChange={e => setPaveSize(parseFloat(e.target.value))}
                                className="w-24 accent-amber-500 cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-amber-300/80 w-10">{(paveSize * 0.55).toFixed(1)}mm</span>
                        </div>
                    </div>
                )}

                {/* Shank Profile */}
                <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-full shadow-lg pointer-events-auto flex gap-2 border border-white/10">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest py-1 pl-1">Shank:</span>
                    {PROFILES.map(p => (
                        <button key={p} onClick={() => setProfile(p)}
                            className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded-full transition-all ${profile === p ? 'bg-neutral-100 text-neutral-900 shadow-md' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {/* Prongs — hidden in eternity mode */}
                {bandMode === 'solitaire' && (
                    <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-full shadow-lg pointer-events-auto flex gap-2 border border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest py-1 pl-1">Prongs:</span>
                        {["Round", "Claw", "Tab", "Double", "Compass"].map(s => (
                            <button key={s} onClick={() => setProngStyle(s)}
                                className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded-full transition-all ${prongStyle === s ? 'bg-rose-600 text-white shadow-md' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <Canvas
                shadows
                camera={{ position: [0, 4, 6], fov: 38 }}
                gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: intensity }}
            >
                <LuxuryStudio intensity={intensity} />
                <RingStand metalColor={metalColor} />
                <RingModel config={activeConfig} />
                <CameraController />
            </Canvas>
        </div>
    )
}

