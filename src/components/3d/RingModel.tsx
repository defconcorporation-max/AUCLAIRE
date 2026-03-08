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
    // Halo side gem (fixed round)
    const sideGemGeom = useMemo(() => getGemGeometry('Round'), [])


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
        color: 0xffffff,
        metalness: 0.2,
        roughness: 0.05,
        transmission: 0.5,
        ior: 2.4,
        thickness: 0.2,
        clearcoat: 1.0,
        envMapIntensity: 2.5
    }), [])

    // --- PRONG & HEAD LOGIC ---
    const prongStyle = config.head.prongStyle || 'Claw'
    const prongCount = config.head.prongCount || 4

    // Calculate Prong Positions
    const prongMeshes = useMemo(() => {
        if (config.head.style === 'Halo') return null; // Halo handles its own internal prongs or bezel usually

        const meshes: JSX.Element[] = []

        // Base angles for prongs
        let angles: number[] = []
        if (prongCount === 4) {
            const baseAngles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]
            angles = prongStyle === 'Compass' ? [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2] : baseAngles
        } else if (prongCount === 6) {
            angles = [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3]
        }

        // Tapered curve points for the stems
        const stemPoints = []
        const segments = 16
        for (let j = 0; j <= segments; j++) {
            const t = j / segments
            // x defines the radius (thickness) at height y. 
            // We want thicker at base (0.045), thinner at top (0.025).
            const r = 0.045 - (t * 0.02)
            // y goes from 0 to 1 (we scale later)
            stemPoints.push(new THREE.Vector2(r, t))
        }

        // Lathed shape forms the beautifully tapered vertical prong
        const taperedGeom = new THREE.LatheGeometry(stemPoints, 16)

        // Elegant Prong Tips
        // A polished teardrop claw that curves over the diamond girdle
        // `LatheGeometry` used sideways to make a teardrop
        const clawPoints = []
        for (let j = 0; j <= 16; j++) {
            const t = (j / 16) * Math.PI
            // Sine makes it fat in the middle, `(1 - j/16)` squishes the back end to a point.
            const r = Math.sin(t) * 0.035 * (1 + (16 - j) / 16 * 0.5)
            clawPoints.push(new THREE.Vector2(r, (j / 16) * 0.15))
        }
        const clawGeom = new THREE.LatheGeometry(clawPoints, 16)
        clawGeom.rotateX(Math.PI / 2) // point it forward 

        angles.forEach((angle, i) => {
            const girdleR = 0.35 * finalGemScale
            const x = Math.sin(angle) * girdleR
            const z = Math.cos(angle) * girdleR

            // Dynamic Curve Points
            // Start low on shank, curve up to girdle
            const startY = -0.15 // Higher, blending inside shank
            const endY = 0.45 * finalGemScale // Top of prong holding girdle

            // Calculate stem height and angle
            const height = endY - startY

            // To make a curved prong, we could manipulate vertices.
            // For a perfectly elegant clean prong, a straight tapering wire angled in looks best:
            // We place it at (x, startY, z) but the bottom roots in (x*0.6, startY, z*0.6)

            // Vector math for the slant:
            const bottom = new THREE.Vector3(x * 0.6, startY, z * 0.6)
            const top = new THREE.Vector3(x * 0.96, endY, z * 0.96) // Slightly inside girdle
            const direction = new THREE.Vector3().subVectors(top, bottom)
            const dist = direction.length()

            const position = new THREE.Vector3().addVectors(bottom, top).multiplyScalar(0.5)
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())

            // Clone and scale the Lathe to match height
            const customStem = taperedGeom.clone()
            customStem.scale(1, dist, 1) // Stretch Y only
            customStem.translate(0, -dist / 2, 0) // shift center

            meshes.push(
                <mesh key={`stem-${i}`} position={position} quaternion={quaternion} geometry={customStem} material={metalMaterial} castShadow />
            )

            // TIPS
            // Positioned exactly at the top of the prong stem
            if (prongStyle === 'Round' || prongStyle === 'Compass') {
                meshes.push(
                    <mesh key={`tip-${i}`} position={top} material={metalMaterial}>
                        <sphereGeometry args={[0.035, 16, 16]} />
                    </mesh>
                )
            } else if (prongStyle === 'Claw') {
                // Point inward towards the origin (0, height, 0)
                const inwardAngle = angle + Math.PI // Pointing directly away from the outward angle
                meshes.push(
                    <mesh key={`tip-${i}`} position={[top.x, top.y + 0.02, top.z]} rotation={[-0.2, inwardAngle, 0]} geometry={clawGeom} material={metalMaterial} castShadow />
                )
            } else if (prongStyle === 'Tab') {
                meshes.push(
                    <mesh key={`tip-${i}`} position={top} rotation={[0, angle, Math.PI / 4]} material={metalMaterial}>
                        <boxGeometry args={[0.06, 0.08, 0.025]} />
                    </mesh>
                )
            }
        })

        // --- GALLERY / UNDERCARRIAGE ---
        const galleryStyle = config.head.gallery || 'Rail'
        const railRadius = 0.3 * finalGemScale
        const railHeight = 0.15 * finalGemScale // Lower, tighter basket

        if (galleryStyle === 'Rail' || galleryStyle === 'Basket') {
            meshes.push(
                <mesh key="rail" position={[0, railHeight, 0]} rotation={[Math.PI / 2, 0, 0]} material={metalMaterial}>
                    <torusGeometry args={[railRadius, 0.025, 12, 48]} />
                </mesh>
            )

            if (galleryStyle === 'Basket') {
                // Delicate Vertical Struts (between prongs)
                for (let i = 0; i < prongCount; i++) {
                    const angle = (i / prongCount) * Math.PI * 2 + (Math.PI / prongCount) // Offset to be between prongs
                    const x = Math.sin(angle) * railRadius
                    const z = Math.cos(angle) * railRadius
                    meshes.push(
                        <mesh key={`strut-${i}`} position={[x, railHeight / 2, z]} material={metalMaterial}>
                            <cylinderGeometry args={[0.02, 0.02, railHeight, 12]} />
                        </mesh>
                    )
                }
            }
        } else if (galleryStyle === 'Trellis') {
            // Elegant Trellis Swoops
            for (let i = 0; i < prongCount; i++) {
                const angle = (i / prongCount) * Math.PI * 2
                const nextAngle = ((i + 1) / prongCount) * Math.PI * 2

                const r = railRadius * 0.95
                const h = 0.25 * finalGemScale

                const ax = Math.sin(angle) * r * 0.5
                const az = Math.cos(angle) * r * 0.5
                const bx = Math.sin(nextAngle) * r
                const bz = Math.cos(nextAngle) * r

                const dist = Math.sqrt((bx - ax) ** 2 + (bz - az) ** 2 + h ** 2)
                const midPos = new THREE.Vector3((ax + bx) / 2, h / 2, (az + bz) / 2)

                // Slightly curved tube
                const curve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(ax, 0, az),
                    new THREE.Vector3(midPos.x * 1.1, midPos.y * 0.8, midPos.z * 1.1), // outward swoop
                    new THREE.Vector3(bx, h, bz)
                ], false)

                const trellisGeom = new THREE.TubeGeometry(curve, 16, 0.022, 8, false)

                meshes.push(
                    <mesh key={`trellis-${i}`} geometry={trellisGeom} material={metalMaterial} />
                )
            }
        }

        return meshes
    }, [prongStyle, finalGemScale, config.head.style, config.head.gallery, prongCount, metalMaterial])

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


    // --- PAVE STONE DATA ---
    // Ring torus is in XY plane. Gem at (0, +0.825, 0) = top of ring.
    // Outer surface is at placeR = 0.825 + bandThickness*0.3.
    const paveStones = useMemo(() => {
        if (!config.sideStones?.active) return []

        const arcFraction = config.sideStones?.length ?? 0.5
        const totalArc = arcFraction * Math.PI * 2
        const sizeParam = Number(config.sideStones?.size) || 1.5
        const bandW = shankWidth * 0.1
        const stoneDiam = Math.min(sizeParam * 0.055, bandW * 0.88)
        const stoneR = Math.max(0.01, stoneDiam / 2)

        // The ring is a torus at R=0.825. 
        // The metal's radial thickness extends from 0.825 - (thickness/2) to 0.825 + (thickness/2).
        const bandHalfThick = (shankThickness * 0.1) / 2
        // We add the band half-thickness so it reaches the exact outer edge of the metal torus.
        // And we add half the diamond's size so its equator sits on the metal face, while the pavilion pierces it.
        const placeR = 0.825 + bandHalfThick + (stoneDiam * 0.5)

        const count = Math.max(2, Math.round((totalArc * placeR) / stoneDiam))
        const step = totalArc / count

        // Half eternity: Top arc (center at +PI/2, where the gem is)
        const startAngle = arcFraction < 1.0
            ? (Math.PI / 2) - totalArc / 2
            : 0

        // Create ONE fresh geometry for this pave shape (avoid shared mutation)
        const shapeKey = config.sideStones?.shape || 'Round'
        const geom = getGemGeometry(shapeKey as any)

        const result = []
        for (let i = 0; i < count; i++) {
            const angle = startAngle + (i + 0.5) * step

            // Overlapping check - skip stones that would clip into the center stone head
            let normalizedAngle = angle % (Math.PI * 2)
            if (normalizedAngle < 0) normalizedAngle += Math.PI * 2

            // The head covers roughly an angle of 0.4 radians on each side of PI/2
            const distToTop = Math.min(
                Math.abs(normalizedAngle - Math.PI / 2),
                Math.abs(normalizedAngle - (Math.PI / 2 + Math.PI * 2))
            )

            if (distToTop < 0.4) continue // Skip rendering stone here

            const z = 0 // Center of the band exactly on the XY plane for torus
            const x = Math.cos(angle) * placeR
            const y = Math.sin(angle) * placeR

            // Outward normal vector from center of ring to the surface
            const outward = new THREE.Vector3(x, y, 0).normalize()

            // The default gem geometry faces +Y. We want its flat table (top surface) 
            // to point outward from the ring along `outward`.
            // Because our geometry is +Y up, we rotate +Y to map to `outward`.
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), outward)

            // We must also rotate the stone 45 degrees around the outward axis so it sits nicely (optional, but standard for round paved)
            // or we just leave it.

            const e = new THREE.Euler().setFromQuaternion(q)

            result.push({
                x, y, z,
                rx: e.x, ry: e.y, rz: e.z,
                stoneDiam, stoneR,
                crown: geom.crown, pavilion: geom.pavilion
            })
        }
        return result
    }, [
        config.sideStones?.active,
        config.sideStones?.length,
        config.sideStones?.size,
        config.sideStones?.shape,
        shankWidth, shankThickness
    ])

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

            {/* SIDE STONES (Pave / Eternity / Half-Eternity) */}
            {paveStones.length > 0 && (
                <group>
                    {paveStones.map(({ x, y, z, rx, ry, rz, stoneDiam, stoneR, crown, pavilion }, i) => (
                        <group key={`pave-${i}`} position={[x, y, z]} rotation={[rx, ry, rz]}>
                            <group scale={stoneDiam} position={[0, stoneR * 0.4, 0]}>
                                <mesh geometry={crown} material={baseDiamondMaterial} castShadow />
                                <mesh geometry={pavilion} material={baseDiamondMaterial} />
                            </group>
                            <mesh position={[0, stoneR * 0.75, -stoneR * 0.8]} material={metalMaterial}>
                                <sphereGeometry args={[stoneR * 0.35, 8, 8]} />
                            </mesh>
                            <mesh position={[0, stoneR * 0.75, stoneR * 0.8]} material={metalMaterial}>
                                <sphereGeometry args={[stoneR * 0.35, 8, 8]} />
                            </mesh>
                        </group>
                    ))}
                </group>
            )}

        </group>
    )
}

