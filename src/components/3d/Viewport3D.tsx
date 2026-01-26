// @ts-nocheck
import { useRef, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber"
import * as THREE from "three"
// @ts-ignore
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
// @ts-ignore
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
// @ts-ignore
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
// @ts-ignore
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass'
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import RingModel from "./RingModel"
import { ErrorBoundary } from "./ErrorBoundary"
import { useRing } from "../../context/RingContext"

extend({ EffectComposer, RenderPass, UnrealBloomPass, OutputPass, OrbitControls })

// --- CONTROLS ---
function CameraController() {
    const { camera, gl } = useThree()
    const controls = useRef<any>(null)

    useFrame(() => controls.current?.update())

    return (
        // @ts-ignore
        <orbitControls
            ref={controls}
            args={[camera, gl.domElement]}
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={15}
            maxPolarAngle={Math.PI / 1.5} // Don't go too low underground
        />
    )
}

// --- BRIGHT STUDIO ENV ---
function ProStudio() {
    const { gl, scene } = useThree()

    useEffect(() => {
        const pmremGenerator = new THREE.PMREMGenerator(gl)
        pmremGenerator.compileEquirectangularShader()
        const studioScene = new THREE.Scene()
        studioScene.background = new THREE.Color("#d0d0d0") // Dimmmed White

        // 1. Main Overlay (Top Softbox)
        const topLight = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10),
            new THREE.MeshBasicMaterial({ color: "#d0d0d0", side: THREE.DoubleSide })
        )
        topLight.position.set(0, 10, 0)
        topLight.rotation.x = Math.PI / 2
        studioScene.add(topLight)

        // 2. Front Right Warm
        const frontRight = new THREE.Mesh(
            new THREE.PlaneGeometry(5, 10),
            new THREE.MeshBasicMaterial({ color: "#e0d0c0" }) // Dimmed Warm
        )
        frontRight.position.set(8, 2, 8)
        frontRight.lookAt(0, 0, 0)
        studioScene.add(frontRight)

        // 3. Front Left Cool
        const frontLeft = new THREE.Mesh(
            new THREE.PlaneGeometry(5, 10),
            new THREE.MeshBasicMaterial({ color: "#c0d0e0" }) // Dimmed Cool
        )
        frontLeft.position.set(-8, 2, 8)
        frontLeft.lookAt(0, 0, 0)
        studioScene.add(frontLeft)

        const envMap = pmremGenerator.fromScene(studioScene).texture
        scene.environment = envMap
        return () => { envMap.dispose(); pmremGenerator.dispose() }
    }, [gl, scene])

    return null
}

function PostProcessing() {
    const { gl, scene, camera, size } = useThree()
    const composer = useRef<any>()
    useEffect(() => {
        composer.current = new EffectComposer(gl)
        composer.current.addPass(new RenderPass(scene, camera))
        composer.current.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 0.05, 0.5, 1.0))
        composer.current.addPass(new OutputPass())
        return () => composer.current?.dispose()
    }, [gl, scene, camera, size])
    useFrame(() => composer.current?.render(), 1)
    return null
}

// --- MAIN VIEWPORT COMPONENT ---
// Replaces RingViewer, strictly active rendering only.
export default function Viewport3D() {
    const { ringConfig, materials } = useRing()

    // Combine config for the model props
    const activeConfig = useMemo(() => ({
        ...ringConfig,
        metal: materials.metal,
        gem: materials.gem,
        type: 'Solitaire'
    }), [ringConfig, materials])

    return (
        <div className="w-full h-full bg-[#111] relative overflow-hidden">
            <ErrorBoundary key="viewport">
                <Canvas dpr={[1, 2]} shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}>

                    {/* STUDIO ENVIRONMENT */}
                    <color attach="background" args={['#101010']} /> {/* Dark Luxury */}

                    {/* LIGHTING - KEY - REDUCED to stop GLOW */}
                    <ambientLight intensity={0.8} />
                    <spotLight position={[5, 10, 5]} angle={0.25} penumbra={1} intensity={1.2} castShadow shadow-bias={-0.0001} />
                    <spotLight position={[-5, 10, -5]} angle={0.25} penumbra={1} intensity={0.8} castShadow shadow-bias={-0.0001} />

                    {/* ENVIRONMENT MAP (For Metal Reflections) */}
                    {/* We create a procedural environment using simple geometries inside Environment or just separate meshes */}
                    {/* Using the existing ProStudio logic but updated for brightness */}
                    <ProStudio />

                    <CameraController />

                    {/* Pass combined config */}
                    <RingModel config={activeConfig} />

                    {/* SHADOWS - REPLACES GRID */}
                    {/* Note: ContactShadows is from @react-three/drei. Since we don't have it explicitly imported, we use a simple shadow plane or rely on castShadows */}
                    {/* Assuming we stick to vanilla three fiber for now without drei imports unless we add them */}
                    <mesh position={[0, -2.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[50, 50]} />
                        <shadowMaterial transparent opacity={0.2} color="#000000" />
                    </mesh>

                    {/* No PostProcessing for clean look initially */}
                    {/* Subtle Bloom to soften, not glow */}
                    <PostProcessing />
                </Canvas>

                {/* BOTTOM BAR OVERLAY */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#1a1a1a] border-t border-[#333] flex items-center px-4 justify-between text-[10px] text-gray-500 font-mono">
                    <div className="flex gap-4">
                        <span className="text-white">Perspective</span>
                        <span>Grid: 0.1mm</span>
                    </div>
                    {/* 
                    <div className="flex gap-2">
                        <span>X: 0.00</span>
                        <span>Y: 0.00</span>
                        <span>Z: 0.00</span>
                    </div>
                 */}
                </div>
            </ErrorBoundary>
        </div>
    )
}
