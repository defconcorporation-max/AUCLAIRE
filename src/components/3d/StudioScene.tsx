import { useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"

export default function StudioScene({ children }: { children: React.ReactNode }) {
    const reflectionRef = useRef<THREE.Mesh>(null)

    // Slowly rotate the reflection environment to make the metal "shimmer"
    useFrame((_, delta) => {
        if (reflectionRef.current) {
            reflectionRef.current.rotation.y += delta * 0.1
        }
    })

    // Create a striped texture for the reflection cylinder
    const reflectionTexture = new THREE.CanvasTexture(
        (() => {
            const canvas = document.createElement("canvas")
            canvas.width = 512
            canvas.height = 512
            const ctx = canvas.getContext("2d")!

            // Background: Dark Gray
            ctx.fillStyle = "#202020"
            ctx.fillRect(0, 0, 512, 512)

            // Strip: Soft White Horizon
            const gradient = ctx.createLinearGradient(0, 200, 0, 312)
            gradient.addColorStop(0, "#000000")
            gradient.addColorStop(0.5, "#ffffff")
            gradient.addColorStop(1, "#000000")
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, 512, 512)

            // Strip: Vertical Studio Lights (Soft Boxes)
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(100, 50, 50, 400) // Light 1
            ctx.fillRect(360, 50, 50, 400) // Light 2

            return canvas
        })()
    )

    return (
        <group>
            {/* 1. PHYSICAL REFLECTION ENVIRONMENT (The "Light Box") 
                This mesh is visible to rays (reflections) but can be hidden from camera or kept as background.
                We make it BackSide so we are inside it.
            */}
            <mesh ref={reflectionRef} scale={[10, 10, 10]}>
                <cylinderGeometry args={[1, 1, 1, 32, 1, true]} />
                <meshBasicMaterial
                    map={reflectionTexture}
                    side={THREE.BackSide}
                    transparent
                    opacity={0.15} // Visible enough to tint background, strong enough for reflection
                />
            </mesh>

            {/* 2. LIGHTING RIG (Standard Objects, Crash-Proof) */}
            <ambientLight intensity={0.5} />
            <spotLight position={[5, 10, 5]} angle={0.25} penumbra={1} intensity={2} castShadow color="white" />
            <spotLight position={[-5, 8, -5]} angle={0.25} penumbra={1} intensity={2} color="#ffdcae" />
            <pointLight position={[0, 2, 0]} intensity={1} distance={5} /> {/* Gem Sparkle */}

            {/* 3. GRID FLOOR (CAD Style) */}
            <gridHelper args={[20, 20, "#404040", "#202020"]} position={[0, -0.01, 0]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <planeGeometry args={[100, 100]} />
                <meshBasicMaterial color="#101010" />
            </mesh>

            {/* THE APP CONTENT */}
            {children}
        </group>
    )
}
