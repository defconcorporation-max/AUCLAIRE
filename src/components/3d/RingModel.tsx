// @ts-nocheck
import { useRef, useMemo } from "react"
import * as THREE from "three"
import { RingConfig } from "../../context/RingContext"
import { getGemGeometry } from "./GemGeometryEngine"
import { getGemScaleVector } from "./GemPhysics"
import { getProfileShape } from "./RingProfileEngine"
import { createProceduralRingGeometry } from "./RingGeometryEngine"
import { getHaloPositions } from "./HaloLogic"

const METALS: Record<string, string> = {
    "Gold (18k)": "#F0C050",
    "Rose Gold": "#E8A29A",
    "Agrippa (White Gold)": "#E8E8E8",
    "Platinum": "#E5E4E2"
}

export default function RingModel({ config }: { config: RingConfig }) {
    const groupRef = useRef<THREE.Group>(null)

    // --- ACCURATE GEM SCALING ---
    const gemShape = config.gem.shape || "Round"
    const gemSize = config.gem.size || 1.0

    const gemScaleVector = useMemo(() => {
        return getGemScaleVector(gemShape, gemSize)
    }, [gemShape, gemSize])

    // Backward compatibility for Halo logic
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
    // Side Stones (Simple placeholder for now)
    const sideGemGeom = useMemo(() => getGemGeometry("Round"), [])

    // --- MATERIALS ---
    const metalColor = METALS[config.metal] || METALS["Gold (18k)"]

    const metalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: metalColor,
        metalness: 1.0,
        roughness: 0.15,
        envMapIntensity: 1.0,
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

                {/* HEAD / SETTING Logic */}
                {config.head.style === 'Solitaire' && (
                    <group>
                        {[45, 135, 225, 315].map(a => (
                            <mesh key={a} material={metalMaterial} position={[
                                Math.sin(a * Math.PI / 180) * 0.35 * finalGemScale,
                                0.25 * finalGemScale,
                                Math.cos(a * Math.PI / 180) * 0.35 * finalGemScale
                            ]} rotation={[0.1, 0, 0.1]}>
                                <cylinderGeometry args={[0.04, 0.05, 0.6 * finalGemScale, 8]} />
                            </mesh>
                        ))}
                    </group>
                )}
                {/* Placeholder for other styles */}
            </group>
        </group>
    )

    return (
        <group key={i} rotation={[0, -rad, 0]}>
            <group scale={[sFactor, 1, 1]}>
                {/* The Prong Shaft */}
                <mesh material={goldMaterial}>
                    <tubeGeometry args={[curve, 32, 0.045, 8, false]} />
                </mesh>

                {/* The Prong Tip Logic */}
                <group position={[wTip, tipY, 0]} rotation={[0, 0, -Math.PI / 4.5]}>

                    {/* STYLE SWITCHER */}
                    {pStyle === 'Claw' && (
                        <mesh material={goldMaterial} position={[0, 0.06, 0]}>
                            <coneGeometry args={[0.042, 0.18, 16]} />
                        </mesh>
                    )}
                    {pStyle === 'Round' && (
                        <mesh material={goldMaterial} position={[0, 0.02, 0]}>
                            <sphereGeometry args={[0.048, 16, 16]} />
                        </mesh>
                    )}
                    {pStyle === 'Tab' && (
                        <mesh material={goldMaterial} position={[0, 0.04, 0]} rotation={[0, 0, Math.PI / 4]}>
                            <boxGeometry args={[0.08, 0.12, 0.03]} />
                        </mesh>
                    )}
                    {pStyle === 'Double' && (
                        <group>
                            <mesh material={goldMaterial} position={[0, 0.06, 0.03]} rotation={[0, 0.2, 0]}>
                                <coneGeometry args={[0.03, 0.16, 16]} />
                            </mesh>
                            <mesh material={goldMaterial} position={[0, 0.06, -0.03]} rotation={[0, -0.2, 0]}>
                                <coneGeometry args={[0.03, 0.16, 16]} />
                            </mesh>
                        </group>
                    )}
                    {/* Default Fallback / Compass Tip */}
                    {pStyle === 'Compass' && (
                        <mesh material={goldMaterial} position={[0, 0.06, 0]}>
                            <coneGeometry args={[0.042, 0.18, 16]} />
                        </mesh>
                    )}

                </group>
            </group>
        </group>
    )
})}
                                </group >
                            )
                        }) ()
                    )}
                </group >
            )}

{/* 2. HALO HEAD */ }
{
    config.headType === 'Halo' && (
        <group>
            {/* Dynamic Halo Logic */}
            {(() => {
                // Calculate Halo Positions
                const stoneSize = 0.12 // Halo stone size
                // Use actual gem scale for dimensions
                const haloItems = getHaloPositions(
                    (config.gemShape || config.shape) as any || "Round",
                    gemScale[0], // Width
                    gemScale[2], // Length
                    stoneSize,
                    0.05 // Gap
                )

                // Halo Rail (Metal under stones)
                // We can build a tube from the positions
                const railPoints = haloItems.map(h => h.position)
                // Close loop
                if (railPoints.length > 0) railPoints.push(railPoints[0])

                return (
                    <group position={[0, 0.1, 0]}>
                        {/* Metal Rail */}
                        {railPoints.length > 2 && (
                            <mesh material={goldMaterial}>
                                <tubeGeometry args={[
                                    new THREE.CatmullRomCurve3(railPoints),
                                    64,
                                    0.1, // Thickness
                                    8,
                                    true
                                ]} />
                            </mesh>
                        )}

                        {/* Halo Stones */}
                        {haloItems.map((item, i) => (
                            <group key={'g' + i} position={item.position} rotation={item.rotation} scale={stoneSize}>
                                <mesh geometry={sideGemGeom.crown} material={baseDiamondMaterial} />
                                <mesh geometry={sideGemGeom.pavilion} material={baseDiamondMaterial} />
                                {/* Tiny Prongs */}
                                <mesh position={[0.4, 0, 0.4]} material={goldMaterial}><cylinderGeometry args={[0.1, 0.1, 0.8, 6]} /></mesh>
                                <mesh position={[-0.4, 0, -0.4]} material={goldMaterial}><cylinderGeometry args={[0.1, 0.1, 0.8, 6]} /></mesh>
                            </group>
                        ))}
                    </group>
                )
            })()}

            {/* Center Prongs for Halo - keep standard logic but ensure they penetrate rail */}
            {[45, 135, 225, 315].map(a => (
                <mesh key={a} material={goldMaterial} position={[
                    Math.sin(a * Math.PI / 180) * 0.25 * finalGemScale, 0.2, Math.cos(a * Math.PI / 180) * 0.25 * finalGemScale
                ]}><cylinderGeometry args={[0.04, 0.04, 0.5, 8]} /></mesh>
            ))}
        </group>
    )
}

{/* 3. THREE-STONE HEAD */ }
{
    config.headType === 'Three-Stone' && (
        <group>
            {/* Main Center (Simple 4 prong) */}
            <mesh position={[0, -0.05, 0]} material={goldMaterial}><cylinderGeometry args={[0.25 * finalGemScale, 0.15, 0.2, 32]} /></mesh>
            {[45, 135, 225, 315].map(a => <mesh key={a} material={goldMaterial} position={[Math.sin(a * Math.PI / 180) * 0.25 * finalGemScale, 0.25, Math.cos(a * Math.PI / 180) * 0.25 * finalGemScale]}><cylinderGeometry args={[0.04, 0.04, 0.6, 16]} /></mesh>)}

            {/* Side Stones */}
            {[-1, 1].map((dir) => (
                <group key={dir} position={[dir * 0.8 * finalGemScale, -0.2, 0]} rotation={[0, 0, -dir * 0.3]} scale={0.6}>
                    <mesh geometry={sideGemGeom.crown} material={baseDiamondMaterial} position={[0, 0.3, 0]} />
                    <mesh geometry={sideGemGeom.pavilion} material={baseDiamondMaterial} position={[0, 0.3, 0]} />
                    {/* Basket */}
                    <mesh position={[0, 0, 0]} material={goldMaterial}><cylinderGeometry args={[0.3, 0.1, 0.3, 16]} /></mesh>
                    <mesh position={[0.2, 0.3, 0]} material={goldMaterial}><cylinderGeometry args={[0.04, 0.04, 0.5]} /></mesh>
                    <mesh position={[-0.2, 0.3, 0]} material={goldMaterial}><cylinderGeometry args={[0.04, 0.04, 0.5]} /></mesh>
                </group>
            ))}
        </group>
    )
}
        </group >

    {/* MAIN GEM */ }
    < group position = { [0, 1.35, 0]} scale = { gemScale } >
            <mesh geometry={currentGemGeom.crown} material={gemMaterial} />
            <mesh geometry={currentGemGeom.pavilion} material={gemMaterial} />
        </group >
    </group >
)
}
