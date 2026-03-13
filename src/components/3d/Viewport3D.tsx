import { useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import * as THREE from "three"
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'

import RingModel from "./RingModel"
import { ErrorBoundary } from "./ErrorBoundary"
import { useRing } from "../../context/RingContext"

// --- MAIN VIEWPORT COMPONENT ---
export default function Viewport3D() {
    const { ringConfig, materials } = useRing()

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
                    <color attach="background" args={['#101010']} />
                    <ambientLight intensity={0.8} />
                    <spotLight position={[5, 10, 5]} angle={0.25} penumbra={1} intensity={1.2} castShadow shadow-bias={-0.0001} />
                    <spotLight position={[-5, 10, -5]} angle={0.25} penumbra={1} intensity={0.8} castShadow shadow-bias={-0.0001} />

                    <Environment preset="studio" />
                    <OrbitControls 
                        makeDefault
                        enableDamping
                        dampingFactor={0.1}
                        minDistance={3}
                        maxDistance={12}
                        maxPolarAngle={Math.PI / 2}
                    />

                    <RingModel config={activeConfig as any} />

                    <ContactShadows 
                        position={[0, -2, 0]} 
                        opacity={0.4} 
                        scale={20} 
                        blur={2.5} 
                        far={4} 
                    />
                </Canvas>

                <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#1a1a1a] border-t border-[#333] flex items-center px-4 justify-between text-[10px] text-gray-500 font-mono">
                    <div className="flex gap-4">
                        <span className="text-white">Perspective</span>
                        <span>Grid: 0.1mm</span>
                    </div>
                </div>
            </ErrorBoundary>
        </div>
    )
}
