// @ts-nocheck
import React, { useRef, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from "three"
import { RingConfig } from "../../context/RingContext"
import { getGemGeometry } from "./GemGeometryEngine"
import { getGemScaleVector, getGemDimensionsMM } from "./GemPhysics"
import { getProfileShape } from "./RingProfileEngine"
import { createProceduralRingGeometry } from "./RingGeometryEngine"
import { getHaloPositions } from "./HaloLogic"

const METALS: Record<string, string> = {
    "Yellow Gold": "#F0C050",
    "Rose Gold": "#E8A29A",
    "White Gold": "#E8E8E8",
    "Platinum": "#E5E4E2"
}

export default function RingModel({ config }: { config: RingConfig }) {
    const groupRef = useRef<THREE.Group>(null)

    // --- ACCURATE GEM SCALING ---
    const gemShape = config.gem.shape || "Round"
    const gemSize = config.gem.size || 1.0

    // Get Real Dimensions for Logic
    const gemDims = useMemo(() => getGemDimensionsMM(gemShape as any, gemSize), [gemShape, gemSize])

    const gemScaleVector = useMemo(() => {
        return getGemScaleVector(gemShape as any, gemSize)
    }, [gemShape, gemSize])

    const finalGemScale = gemScaleVector[0]
    const gemScale: [number, number, number] = gemScaleVector

    // --- GEOMETRY MEMOIZATION ---
    // Shank Geometry
    const shankWidth = config.shank.width
    const shankThickness = config.shank.thickness
    const profileType = config.shank.profile

    const shankGeometry = useMemo(() => {
        const scale = 0.1 // Scene scale factor
        const shape = getProfileShape(profileType, shankWidth * scale, shankThickness * scale)
        const radius = 0.825

        let twist = 0
        let cathedral = 0
        let split = false

        switch (config.shank.style) {
            case 'Twist': twist = 360; break;
            case 'Cathedral': cathedral = 1.5 * scale; break;
            case 'Split': split = true; break;
            default: break;
        }

        return createProceduralRingGeometry({
            profileShape: shape,
            radius,
            width: shankWidth * scale,
            thickness: shankThickness * scale,
            taperTop: config.shank.taper,
            twistAmount: twist,
            cathedralHeight: cathedral,
            isSplit: split,
            splitGap: 0.8 * scale
        })
    }, [profileType, shankWidth, shankThickness, config.shank.taper, config.shank.style])

    // Gem Geometry
    const currentGemGeom = useMemo(() => getGemGeometry(gemShape as any), [gemShape])
    // Side Stones Geometry
    const sideGemGeom = useMemo(() => getGemGeometry("Round"), [])

    // --- MATERIALS ---
    const metalColor = METALS[config.metal] || METALS["Yellow Gold"]

    const metalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: metalColor,
        metalness: 1.0,
        roughness: 0.15,
        envMapIntensity: 1.0,
        side: THREE.DoubleSide
    }), [metalColor])

    const gemMaterial = useMemo(() => {
        const type = config.gem.type
        switch (type) {
            case 'Sapphire':
                return new THREE.MeshPhysicalMaterial({
                    color: "#0f52ba", metalness: 0.0, roughness: 0.0, transmission: 0.6, ior: 1.77,
                    thickness: 2.0, clearcoat: 1.0, side: THREE.DoubleSide
                })
            case 'Ruby':
                return new THREE.MeshPhysicalMaterial({
                    color: "#e0115f", metalness: 0.0, roughness: 0.0, transmission: 0.6, ior: 1.76,
                    thickness: 2.0, clearcoat: 1.0, side: THREE.DoubleSide
                })
            case 'Emerald':
                return new THREE.MeshPhysicalMaterial({
                    color: "#50c878", metalness: 0.0, roughness: 0.0, transmission: 0.7, ior: 1.57,
                    thickness: 2.0, clearcoat: 1.0, side: THREE.DoubleSide
                })
            case 'Diamond':
            default:
                return new THREE.MeshPhysicalMaterial({
                    color: "white", metalness: 0.0, roughness: 0.0, transmission: 0.98, ior: 2.4,
                    thickness: 1.5, dispersion: 0.04, clearcoat: 1.0, side: THREE.DoubleSide
                })
        }
    }, [config.gem.type])

    const baseDiamondMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: "white", metalness: 0.0, roughness: 0.0, transmission: 0.98, ior: 2.4,
        thickness: 0.5, clearcoat: 1.0
    }), [])

    // --- PRONG & HEAD LOGIC ---
    const prongStyle = config.head.prongStyle || 'Claw'

    // Calculate Prong Positions
    const prongMeshes = useMemo(() => {
        if (config.head.style === 'Halo') return null; // Halo handles its own internal prongs or bezel usually

        const meshes: JSX.Element[] = []

        // Base angles for 4 prongs
        const baseAngles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]
        // Compass rotates by 45deg
        const angles = prongStyle === 'Compass' ? [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2] : baseAngles

        // Trellis / Cathedral Curves
        angles.forEach((angle, i) => {
            const x = Math.sin(angle) * 0.35 * finalGemScale
            const z = Math.cos(angle) * 0.35 * finalGemScale

            // Dynamic Curve Points
            // Start low on shank, curve up to girdle
            const startY = -0.2 // Below shank top
            const midY = 0.2 * finalGemScale
            const endY = 0.5 * finalGemScale // Top of prong

            // Curve Path for "Trellis" style
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(x * 0.5, startY, z * 0.5), // Base rooted in shank
                new THREE.Vector3(x * 0.9, midY * 0.5, z * 0.9), // Bulge out
                new THREE.Vector3(x, endY, z) // Tip
            ], false, 'catmullrom', 0.5)

            const tubeGeom = new THREE.TubeGeometry(curve, 16, 0.045, 8, false)

            meshes.push(
                <mesh key={`stem-${i}`} geometry={tubeGeom} material={metalMaterial} />
            )

            // TIPS
            const tipPos = new THREE.Vector3(x, endY, z)
            if (prongStyle === 'Round') {
                meshes.push(
                    <mesh key={`tip-${i}`} position={tipPos} material={metalMaterial}>
                        <sphereGeometry args={[0.048, 16, 16]} />
                    </mesh>
                )
            } else if (prongStyle === 'Claw' || prongStyle === 'Compass') {
                meshes.push(
                    <mesh key={`tip-${i}`} position={tipPos} rotation={[0.4, angle, 0]} material={metalMaterial}>
                        <coneGeometry args={[0.042, 0.15, 16]} />
                    </mesh>
                )
            } else if (prongStyle === 'Tab') {
                meshes.push(
                    <mesh key={`tip-${i}`} position={tipPos} rotation={[0, angle, Math.PI / 4]} material={metalMaterial}>
                        <boxGeometry args={[0.08, 0.12, 0.03]} />
                    </mesh>
                )
            }
        })

        // --- GALLERY / UNDERCARRIAGE ---
        const galleryStyle = config.head.gallery || 'Rail'
        const railRadius = 0.3 * finalGemScale
        const railHeight = 0.2 * finalGemScale

        if (galleryStyle === 'Rail') {
            meshes.push(
                <mesh key="rail" position={[0, railHeight, 0]} rotation={[Math.PI / 2, 0, 0]} material={metalMaterial}>
                    <torusGeometry args={[railRadius, 0.035, 8, 32]} />
                </mesh>
            )
        } else if (galleryStyle === 'Basket') {
            // Rail + Vertical Struts
            meshes.push(
                <mesh key="rail" position={[0, railHeight, 0]} rotation={[Math.PI / 2, 0, 0]} material={metalMaterial}>
                    <torusGeometry args={[railRadius, 0.035, 8, 32]} />
                </mesh>
            )
            // Vertical Struts (between prongs)
            const strutCount = prongCount
            for (let i = 0; i < strutCount; i++) {
                const angle = (i / strutCount) * Math.PI * 2 + (Math.PI / strutCount) // Offset to be between prongs
                const x = Math.sin(angle) * railRadius
                const z = Math.cos(angle) * railRadius
                meshes.push(
                    <mesh key={`strut-${i}`} position={[x, railHeight / 2, z]} material={metalMaterial}>
                        <cylinderGeometry args={[0.03, 0.03, railHeight, 8]} />
                    </mesh>
                )
            }
        } else if (galleryStyle === 'Trellis') {
            // Interwoven Curves (X-shape)
            // Ideally we use TubeGeometry with a curve
            const strutCount = prongCount
            for (let i = 0; i < strutCount; i++) {
                const angle = (i / strutCount) * Math.PI * 2
                // Curve from Prong Base (Bottom) to Next Prong Top?
                // Or easier: Just X shapes between prongs.
                // Let's do simple diagonals for now.
                const nextAngle = ((i + 1) / strutCount) * Math.PI * 2

                const r = railRadius * 0.9
                const h = railHeight

                // Point A (Bottom of i)
                const ax = Math.sin(angle) * r * 0.6
                const az = Math.cos(angle) * r * 0.6
                // Point B (Top of next)
                const bx = Math.sin(nextAngle) * r
                const bz = Math.cos(nextAngle) * r

                // Midpoint
                const mx = (ax + bx) / 2
                const mz = (az + bz) / 2

                // Curve logic is complex for procedural. 
                // Let's use simple straight bars for "X" effect for now.
                const dist = Math.sqrt((bx - ax) ** 2 + (bz - az) ** 2 + h ** 2)
                const midPos = new THREE.Vector3((ax + bx) / 2, h / 2, (az + bz) / 2)
                const orientation = new THREE.Vector3(bx - ax, h, bz - az).normalize()
                const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), orientation)

                meshes.push(
                    <mesh key={`trellis-${i}`} position={midPos} quaternion={quat} material={metalMaterial}>
                        <cylinderGeometry args={[0.03, 0.03, dist, 8]} />
                    </mesh>
                )
                // We need the other diagonal for a true X, but let's stick to this "Swoop" for now.
            }
        }

        return meshes
    }, [prongStyle, finalGemScale, config.head.style, metalMaterial])

    // --- HALO LOGIC ---
    const haloItems = useMemo(() => {
        if (config.head.style !== 'Halo') return []

        // Convert gemDims (mm) to Scene Units
        const w = gemDims.width * 0.1
        const l = gemDims.length * 0.1
        const stoneSize = 0.15 // 1.5mm stones default
        const gap = 0.02

        // Get positions from Logic
        const positions = getHaloPositions(gemShape, w, l, stoneSize, gap)
        return positions
    }, [config.head.style, gemDims, gemShape])


    // --- RENDERING ---
    return (
        <group ref={groupRef} rotation={[Math.PI / 8, Math.PI / 4, 0]}>
            {/* SHANK */}
            <mesh geometry={shankGeometry} material={metalMaterial} castShadow receiveShadow />

            {/* GEM GROUP (Includes Head/Prongs) */}
            <group position={[0, 0.825 + (shankThickness * 0.1), 0]}>
                {/* Main Gem */}
                <group position={[0, 0.4 * finalGemScale, 0]} scale={gemScale}>
                    <mesh geometry={currentGemGeom.crown} material={gemMaterial} castShadow />
                    <mesh geometry={currentGemGeom.pavilion} material={gemMaterial} />
                </group>

                {/* HEAD: Solitaire / Custom Prongs */}
                {(config.head.style === 'Solitaire' || config.head.style === 'Vintage') && (
                    <group>{prongMeshes}</group>
                )}

                {/* HEAD: Three-Stone */}
                {config.head.style === 'Three-Stone' && (
                    <group>
                        {[-1, 1].map(dir => {
                            const sideGemSize = config.threeStone?.size || 0.5
                            const sideScale = sideGemSize // A bit simplistic, but works for scale factor relative to 1.0
                            const sideShape = config.threeStone?.shape || 'Round'
                            const sideGeom = getGemGeometry(sideShape)

                            // Position: Sides of the main stone, angled down slightly
                            // Gap from center: Main Radius + Side Radius
                            const offset = (0.35 * finalGemScale) + (0.2 * sideScale)
                            const angle = 0.3 // Radians tilt
                            const x = dir * offset
                            const y = -0.1 * finalGemScale // Lower than main

                            return (
                                <group key={`side-gem-${dir}`} position={[x, y, 0]} rotation={[0, 0, -dir * angle]} scale={sideScale}>
                                    <mesh geometry={sideGeom.crown} material={baseDiamondMaterial} castShadow />
                                    <mesh geometry={sideGeom.pavilion} material={baseDiamondMaterial} />

                                    {/* Side Prongs (Simplified 3-prong per side stone) */}
                                    {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((rad, i) => (
                                        <mesh key={i} position={[Math.sin(rad) * 0.35, 0.1, Math.cos(rad) * 0.35]} material={metalMaterial}>
                                            <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
                                            <mesh position={[0, 0.2, 0]}>
                                                <sphereGeometry args={[0.045, 8, 8]} />
                                            </mesh>
                                        </mesh>
                                    ))}

                                    {/* Basket Rail */}
                                    <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]} material={metalMaterial}>
                                        <torusGeometry args={[0.35, 0.03, 8, 16]} />
                                    </mesh>
                                </group>
                            )
                        })}
                    </group>
                )}

                {/* HEAD: Halo */}
                {config.head.style === 'Halo' && (
                    <group>
                        {/* Render Halo Stones */}
                        {haloItems.map((item, i) => (
                            <group key={i} position={item.position} rotation={item.rotation}>
                                {/* Stones face UP by default */}
                                <group scale={0.6}>
                                    <mesh geometry={sideGemGeom.crown} material={baseDiamondMaterial} />
                                    <mesh geometry={sideGemGeom.pavilion} material={baseDiamondMaterial} />
                                </group>
                                {/* Small Prong for Halo */}
                                <mesh position={[0.05, 0, 0]} material={metalMaterial}>
                                    <sphereGeometry args={[0.02, 8, 8]} />
                                </mesh>
                            </group>
                        ))}

                        {/* Inner Bezel / Seat for Main Stone (simplified) */}
                        <mesh position={[0, 0.1 * finalGemScale, 0]} material={metalMaterial}>
                            <cylinderGeometry args={[0.25 * finalGemScale, 0.25 * finalGemScale, 0.2, 16, 1, true]} />
                            {/* Or just a rail */}
                        </mesh>
                    </group>
                )}

                {/* Side Stones — Pavé (eternity / half-eternity) */}
                {config.sideStones?.active && (() => {
                    const paveShape = config.sideStones?.shape || 'Round'
                    const paveGeom = getGemGeometry(paveShape)
                    const arcFraction = config.sideStones?.length ?? 0.5   // 0.5 = half, 1.0 = full
                    const totalArcAngle = arcFraction * Math.PI * 2

                    // Stone size in scene units — clamped so it fits the band width
                    const sizeParam = config.sideStones?.size || 1.5        // 0.5 – 3.0 from slider
                    const bandWidth = shankWidth * 0.1                       // band width in scene units
                    const stoneDiam = Math.min(sizeParam * 0.055, bandWidth * 0.92) // diameter
                    const stoneRadius = stoneDiam / 2

                    // Ring outer surface: center-line radius + half band thickness
                    const ringCenterRadius = 0.825
                    const bandThick = shankThickness * 0.1
                    const stoneOuterRadius = ringCenterRadius + bandThick / 2 // sits on outer edge

                    // Pack stones tight: count = arc length / stone diameter
                    const arcLength = totalArcAngle * stoneOuterRadius
                    const stoneCount = Math.max(1, Math.round(arcLength / stoneDiam))
                    const actualAngleStep = totalArcAngle / stoneCount

                    // Arc starts facing front (z+), centered
                    const startAngle = Math.PI / 2 - totalArcAngle / 2

                    const stones = []
                    for (let i = 0; i < stoneCount; i++) {
                        const angle = startAngle + (i + 0.5) * actualAngleStep

                        // Position: ON the outer ring surface
                        const x = Math.cos(angle) * stoneOuterRadius
                        const z = Math.sin(angle) * stoneOuterRadius
                        const y = 0  // Mid-band height (group is already offset to shank top)

                        stones.push(
                            <group
                                key={`pave-${i}`}
                                position={[x, y, z]}
                                // Rotate so stone faces outward from ring center
                                rotation={[0, -(angle - Math.PI / 2), 0]}
                            >
                                {/* Stone faces up (table up), scale to diameter */}
                                <group scale={stoneRadius} rotation={[-Math.PI / 2, 0, 0]}>
                                    <mesh geometry={paveGeom.crown} material={baseDiamondMaterial} castShadow />
                                    <mesh geometry={paveGeom.pavilion} material={baseDiamondMaterial} />
                                </group>
                                {/* 4 micro prong dots at cardinal points */}
                                {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((r, pi) => {
                                    const px = Math.sin(r) * stoneRadius * 0.88
                                    const pz = Math.cos(r) * stoneRadius * 0.88
                                    return (
                                        <mesh key={pi} position={[px, stoneRadius * 0.4, pz]} material={metalMaterial}>
                                            <sphereGeometry args={[stoneRadius * 0.15, 5, 5]} />
                                        </mesh>
                                    )
                                })}
                            </group>
                        )
                    }
                    return <group>{stones}</group>
                })()}




                {/* ENGRAVING */}
                {config.engraving?.text && (
                    <group rotation={[Math.PI, 0, Math.PI]}>
                        {/* Text Logic: Simple flat text for now, positioned inside bottom shank */}
                        <Text
                            font="https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff"
                            fontSize={0.25 * (config.engraving.size || 0.5)}
                            maxWidth={2}
                            lineHeight={1}
                            letterSpacing={0.05}
                            textAlign="center"
                            anchorX="center"
                            anchorY="middle"
                            position={[0, 0.82, 0]} // Just inside the band (Radius ~0.825)
                            rotation={[Math.PI / 2, 0, 0]} // Resting on inner surface?
                            // Actually:
                            // Inner surface normal points inwards (towards 0,0,0).
                            // At bottom (angle PI), normal is UP (0,1,0).
                            // Surface is at y = -0.825? No.
                            // Ring is centered. Inner radius ~0.825.
                            // If we want text at BOTTOM inside:
                            // Pos = (0, -0.82, 0).
                            // Normal = (0, 1, 0).
                            // Text up-vector should be Z?
                            color={metalMaterial.color} // Engraving matches metal (or slightly darker?)
                        >
                            {config.engraving.text}
                            <meshStandardMaterial
                                color={new THREE.Color(METALS[config.metal]).offsetHSL(0, 0, -0.2)}
                                roughness={0.8}
                                metalness={0.5}
                            />
                        </Text>
                    </group>
                )}

            </group>
        </group>
    )
}
