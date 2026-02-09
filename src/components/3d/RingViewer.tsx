// @ts-nocheck
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import RingModel from "./RingModel"
import { useEffect, useRef, useMemo } from "react"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import * as THREE from "three"

// --- PROCEDURAL SOFTBOX GENERATOR ---
const createGradientTexture = (width: number, height: number, stop1: string, stop2: string) => {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")!
    const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2)
    const color = new THREE.Color(stop1)
    const style = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`
    grad.addColorStop(0, style)
    grad.addColorStop(1, "black")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
}

// --- MASTERPIECE STUDIO ---
function LuxuryStudio({ intensity = 1 }: { intensity?: number }) {
    const { gl, scene } = useThree()
    useEffect(() => {
        const pmremGenerator = new THREE.PMREMGenerator(gl)
        pmremGenerator.compileEquirectangularShader()
        const studioScene = new THREE.Scene()
        // studioScene.background = new THREE.Color("#f5f5f5") // Light gray for reflections

        // 1. KEY LIGHT - Soft White Top
        const texKey = createGradientTexture(512, 512, "#ffffff", "#ffffff")
        const keyLight = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshBasicMaterial({ map: texKey, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, transparent: true })
        )
        keyLight.position.set(0, 10, 0)
        keyLight.rotation.x = Math.PI / 2
        studioScene.add(keyLight)

        // 2. FILL LIGHT - Neutral (No Warmth)
        const texFill = createGradientTexture(256, 256, "#ffffff", "#ffffff")
        const fillLight = new THREE.Mesh(
            new THREE.PlaneGeometry(15, 10),
            new THREE.MeshBasicMaterial({ map: texFill, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.5 })
        )
        fillLight.position.set(10, 0, 5)
        fillLight.lookAt(0, 0, 0)
        studioScene.add(fillLight)

        // 3. RIM LIGHT - Neutral (No Cool Blue)
        const texRim = createGradientTexture(256, 512, "#ffffff", "#ffffff")
        const rimLight = new THREE.Mesh(
            new THREE.PlaneGeometry(5, 15),
            new THREE.MeshBasicMaterial({ map: texRim, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.8 })
        )
        rimLight.position.set(-10, 2, -5)
        rimLight.lookAt(0, 0, 0)
        studioScene.add(rimLight)

        // Generate Environment
        const envMap = pmremGenerator.fromScene(studioScene).texture
        scene.environment = envMap
        // scene.background = new THREE.Color("#000000") // Keep background black

        return () => {
            envMap.dispose()
            pmremGenerator.dispose()
        }
    }, [gl, scene])

    return (
        <group>
            <ambientLight intensity={0.5 * intensity} />
            <spotLight position={[5, 15, 5]} intensity={20 * intensity} angle={0.2} penumbra={1} castShadow />
            {/* Removed colored point lights ("Sparkle Storm") */}
            <pointLight position={[-5, 5, -5]} intensity={10 * intensity} color="white" />
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
        controlsRef.current = controls
        return () => controls.dispose()
    }, [camera, gl])

    useFrame(() => controlsRef.current?.update())
    return null
}

export default function RingViewer({ config, intensity = 1.2 }: { config: any, intensity?: number }) {
    return (
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-gray-100 to-gray-200 flex items-center justify-center">
            <Canvas shadows camera={{ position: [0, 5, 5], fov: 45 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: intensity }}>
                <LuxuryStudio intensity={intensity} />
                <RingModel config={config} />

                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
                    <shadowMaterial opacity={0.2} />
                    {/* <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial color="#f5f5f5" metalness={0.1} roughness={0.8} envMapIntensity={intensity} /> */}
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.01, 0]} receiveShadow>
                    <planeGeometry args={[100, 100]} />
                    <meshBasicMaterial color="#f0f0f0" />
                </mesh>
                <CameraController />
            </Canvas>
        </div>
    )
}
