// @ts-nocheck
import * as THREE from "three"
import { useMemo } from "react"

// --- LUXURY GEM RAIL ---
// Features:
// 1. Sunk settings
// 2. Physical Prongs (Shared)
// 3. Fake "Drilled Hole" (Black cylinder) for contrast
export default function GemRail({
    radius,
    width,
    startAngle = 0,
    endAngle = Math.PI,
    gemSize = 0.5,
    coverage = 0.5
}: {
    radius: number,
    width: number,
    startAngle?: number,
    endAngle?: number,
    gemSize?: number,
    coverage?: number
}) {

    // 1. DIAMOND GEOMETRY (Optimized High Poly)
    const gemGeom = useMemo(() => {
        const segments = 24 // Balanced
        const crown = new THREE.CylinderGeometry(gemSize * 0.35, gemSize * 0.52, gemSize * 0.25, segments, 1)
        crown.translate(0, gemSize * 0.125, 0)
        const pavilion = new THREE.CylinderGeometry(gemSize * 0.52, 0.05, gemSize * 0.4, segments, 1)
        pavilion.translate(0, -gemSize * 0.2, 0)
        return { crown, pavilion }
    }, [gemSize])

    // 2. PRONG GEOMETRY (Dome)
    const prongGeom = useMemo(() => new THREE.SphereGeometry(gemSize * 0.12, 12, 8), [gemSize])

    // 3. CUTTER GEOMETRY (Visual Trick: Absolute Black Cylinder to simulate depth)
    const cutterGeom = useMemo(() => new THREE.CylinderGeometry(gemSize * 0.35, gemSize * 0.1, gemSize * 0.6, 16), [gemSize])

    // MATERIALS
    const diamondMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        metalness: 0.0,
        roughness: 0.0,
        transmission: 1.0,
        ior: 2.417,
        thickness: 0.8, // Slightly lower for sparkle
        clearcoat: 1.0,
        side: THREE.FrontSide
    }), [])

    const prongMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: "#E6B85E", // Gold
        metalness: 1.0,
        roughness: 0.05
    }), [])

    const cutterMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: "#000000" }), [])

    // LAYOUT LOGIC
    const gems = useMemo(() => {
        const spacing = gemSize * 1.05 // Tight packing (Eternity style)
        const gemCount = Math.floor((Math.PI * 2 * radius * coverage) / spacing)

        if (gemCount === 0) return []

        const totalArc = Math.PI * 2 * coverage
        const startRad = (Math.PI / 2) - (totalArc / 2)
        const step = totalArc / gemCount

        const items = []
        for (let i = 0; i < gemCount; i++) {
            const angle = startRad + (i * step) + (step / 2)
            const x = Math.cos(angle) * (radius)
            const y = Math.sin(angle) * (radius)
            const rotZ = angle - Math.PI / 2

            items.push({ pos: [x, y, 0] as [number, number, number], rot: [0, 0, rotZ] as [number, number, number] })
        }
        return items
    }, [radius, width, coverage, gemSize])

    return (
        <group>
            {gems.map((g, i) => (
                <group key={i} position={g.pos} rotation={g.rot}>

                    {/* A. CUTTER - The subtle black hole beneath */}
                    <mesh geometry={cutterGeom} material={cutterMaterial} position={[0, -gemSize * 0.3, 0]} />

                    {/* B. GEM - Sunk */}
                    <group position={[0, -gemSize * 0.1, 0]}>
                        <mesh geometry={gemGeom.crown} material={diamondMaterial} />
                        <mesh geometry={gemGeom.pavilion} material={diamondMaterial} />
                    </group>

                    {/* C. PRONGS - 4 Bead Set */}
                    <mesh geometry={prongGeom} material={prongMaterial} position={[gemSize * 0.35, gemSize * 0.15, gemSize * 0.32]} />
                    <mesh geometry={prongGeom} material={prongMaterial} position={[gemSize * 0.35, gemSize * 0.15, -gemSize * 0.32]} />
                    <mesh geometry={prongGeom} material={prongMaterial} position={[-gemSize * 0.35, gemSize * 0.15, gemSize * 0.32]} />
                    <mesh geometry={prongGeom} material={prongMaterial} position={[-gemSize * 0.35, gemSize * 0.15, -gemSize * 0.32]} />

                </group>
            ))}
        </group>
    )
}
