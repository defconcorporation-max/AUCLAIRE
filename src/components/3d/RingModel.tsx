import { useRef, useMemo, useState } from "react"
// import { useFrame } from "@react-three/fiber" // Unused
import * as THREE from "three"
import GemRail from "./GemRail"

const METALS: Record<string, string> = {
    "Gold (18k)": "#F0C050", // Rich Standard Gold
    "Rose Gold": "#E8A29A", // Warm Copper/Rose
    "Agrippa (White Gold)": "#E8E8E8", // Bright White metal
    "Platinum": "#E5E4E2"
}

// ... imports
import { getGemGeometry } from "./GemGeometryEngine"
import { getGemScaleVector } from "./GemPhysics"
import { getProfileShape, RingProfileType } from "./RingProfileEngine"
import { createProceduralRingGeometry } from "./RingGeometryEngine"
import { getHaloPositions } from "./HaloLogic"

export interface RingConfig {
    metal: string
    gem: string
    type: string // "Ring"
    shape?: string // Deprecated, use gemShape
    gemShape?: string
    sideGemShape?: string
    gemSize?: number
    settingStyle?: string
    headType?: string
    shankType?: string
    profile?: RingProfileType
    width?: number
    thickness?: number
    taper?: number
    coverage?: number
    prongStyle?: string
}

export default function RingModel({ config }: { config: RingConfig }) {
    const groupRef = useRef<THREE.Group>(null)

    // Configuration Defaults
    const shankWidth = config.width || 3.0
    const shankThickness = config.thickness || 1.8
    const profileType = config.profile || "Court"
    const taperScale = config.taper || 1.0
    const coverage = config.coverage || 0.0

    // --- GEOMETRY MEMOIZATION (High Res) ---
    const shankGeometry = useMemo(() => {
        const scale = 0.1
        const shape = getProfileShape(profileType, shankWidth * scale, shankThickness * scale)
        const radius = 0.825

        // Determine Procedural Options based on shankType
        let twist = 0
        let cathedral = 0
        let split = false

        switch (config.shankType) {
            case 'Twist':
                twist = 360 // Full turn
                break
            case 'Cathedral':
                cathedral = 1.5 * scale // Height increase
                break
            case 'Split':
                split = true
                break
            case 'Classic':
            default:
                break
        }

        return createProceduralRingGeometry({
            profileShape: shape,
            radius,
            width: shankWidth * scale,
            thickness: shankThickness * scale,
            taperTop: taperScale,
            twistAmount: twist,
            cathedralHeight: cathedral,
            isSplit: split,
            splitGap: 0.8 * scale
        })
    }, [profileType, shankWidth, shankThickness, taperScale, config.shankType])

    // Use the procedural engine
    const currentGemGeom = useMemo(() => getGemGeometry((config.gemShape || config.shape) as any || "Round"), [config.shape, config.gemShape])
    const sideGemGeom = useMemo(() => getGemGeometry((config.sideGemShape) as any || "Round"), [config.sideGemShape])

    // --- ACCURATE GEM SCALING ---
    // Calculate Real World Scale vector (Scene Units) based on Carat Weight
    const gemScaleVector = useMemo(() => {
        return getGemScaleVector((config.gemShape || config.shape) as any || "Round", config.gemSize || 1.0)
    }, [config.gemShape, config.shape, config.gemSize])

    // Backward compatibility for generic sizing (using width as reference)
    const finalGemScale = gemScaleVector[0]
    const gemScale: [number, number, number] = gemScaleVector
    const metalColor = METALS[config.metal] || METALS["Gold (18k)"]

    // --- PBR MATERIALS ---
    // NO MATCAPS. Real Physics.
    const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: new THREE.Color(metalColor),
        metalness: 1.0,
        roughness: 0.15, // Satin/Polished mix - safer for procedural env
        envMapIntensity: 1.0, // Natural reflection intensity
        side: THREE.DoubleSide // Fix for "see through" inside views
    }), [metalColor])

    // Fixed Diamond Material for Side Stones / Accents
    const baseDiamondMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        metalness: 0.0,
        roughness: 0.0,
        transmission: 0.98, // Slightly less than 1.0 to catch some specular
        ior: 2.42, // Accurate Diamond IOR
        thickness: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        side: THREE.DoubleSide // Ensure gems refract from all angles
    }), [])

    // ... (rest of gemMaterial logic)

    // Dynamic Center Stone Material
    const gemMaterial = useMemo(() => {
        const type = config.gem || 'Diamond'

        switch (type) {
            case 'Sapphire':
                return new THREE.MeshPhysicalMaterial({
                    color: "#0f52ba", // Royal Blue
                    metalness: 0.0,
                    roughness: 0.0,
                    transmission: 0.6, // Deep color, less transparent than diamond
                    ior: 1.77,
                    thickness: 2.0, // Absorb light depth
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.0,
                    side: THREE.FrontSide,
                    attenuationColor: new THREE.Color("#0f52ba"),
                    attenuationDistance: 5.0
                })
            case 'Ruby':
                return new THREE.MeshPhysicalMaterial({
                    color: "#e0115f", // Pigeon Blood Red
                    metalness: 0.0,
                    roughness: 0.0,
                    transmission: 0.6,
                    ior: 1.77,
                    thickness: 2.0,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.0,
                    side: THREE.FrontSide,
                    attenuationColor: new THREE.Color("#e0115f"),
                    attenuationDistance: 5.0
                })
            case 'Emerald':
                return new THREE.MeshPhysicalMaterial({
                    color: "#50c878", // Emerald Green
                    metalness: 0.0,
                    roughness: 0.0, // Emeralds are often oiled/included, but for "Ideal" we keep smooth
                    transmission: 0.6,
                    ior: 1.57, // Lower IOR
                    thickness: 2.0,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.1, // Slightly waxy luster
                    side: THREE.FrontSide,
                    attenuationColor: new THREE.Color("#50c878"),
                    attenuationDistance: 5.0
                })
            case 'Diamond':
            default:
                return baseDiamondMaterial
        }
    }, [config.gem, baseDiamondMaterial])

    // --- INTERACTIVE GEM ---
    const [extraGems, setExtraGems] = useState<{ pos: [number, number, number], rot: [number, number, number] }[]>([])
    const handleRingClick = (e: any) => {
        e.stopPropagation()
        if (!e.face) return;
        const point = e.point
        const normal = e.face.normal.clone().applyQuaternion(e.object.quaternion)
        setExtraGems([...extraGems, { pos: [point.x, point.y, point.z], rot: [normal.x, normal.y, normal.z] }])
    }

    return (
        <group ref={groupRef}>
            {/* SHANK */}
            <mesh geometry={shankGeometry} material={goldMaterial} onClick={handleRingClick} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'} />

            {/* GEM RAIL (Dynamic Pave) */}
            {coverage > 0.05 && (
                <GemRail
                    radius={0.825 + (shankThickness * 0.1)}
                    width={shankWidth * 0.1}
                    gemSize={0.15}
                    coverage={coverage}
                />
            )}

            {/* EXTRA GEMS */}
            {extraGems.map((gem, i) => (
                <group key={i} position={gem.pos} rotation={[gem.rot[0], gem.rot[1], gem.rot[2]]}>
                    <mesh geometry={currentGemGeom.crown} scale={0.2} material={baseDiamondMaterial} />
                    <mesh geometry={currentGemGeom.pavilion} scale={0.2} material={baseDiamondMaterial} />
                </group>
            ))}

            {/* CENTER SETTING GROUP - DYNAMIC HEAD */}
            <group position={[0, 1.02, 0]}>

                {/* 1. SOLITAIRE / VINTAGE / BEZEL HEAD (Standard Single Stone) */}
                {(config.headType === 'Solitaire' || config.headType === 'Vintage' || config.headType === 'Bezel Head' || !config.headType) && (
                    <group>
                        {/* TIFFANY BASE Removed by Request */}
                        {/* Prongs / Bezel Logic */}
                        {config.settingStyle === 'Bezel' ? (
                            <mesh material={goldMaterial} position={[0, 0.1, 0]}>
                                <tubeGeometry args={[
                                    (() => {
                                        const rX = 0.52 * gemScale[0]
                                        const rZ = 0.52 * gemScale[2]
                                        const curve = new THREE.EllipseCurve(0, 0, rX, rZ, 0, 2 * Math.PI, false, 0)
                                        const points = curve.getPoints(64).map(p => new THREE.Vector3(p.x, 0, p.y))
                                        return new THREE.CatmullRomCurve3(points, true)
                                    })(),
                                    64, 0.05, 8, true
                                ]} />
                            </mesh>
                        ) : (
                            // REALISTIC PRONG LOGIC (Talon / V-Shape)
                            // TRELLIS & PRONG STYLE LOGIC
                            (() => {
                                // 1. Config Extraction
                                // We cast to any to allow new 'prongStyle' property until typed
                                const conf = config as any
                                const pStyle = conf.prongStyle || 'Round' // 'Claw', 'Round', 'Tab', 'Double', 'Compass'
                                const style = config.settingStyle || '4-Prong'
                                const isSix = style === '6-Prong'
                                const isSquare = (config.gemShape === 'Princess' || config.gemShape === 'Emerald' || config.gemShape === 'Radiant' || config.gemShape === 'Asscher')

                                // 2. Angle Calc
                                let angles = [45, 135, 225, 315] // Default 4-prong
                                if (isSix) angles = [0, 60, 120, 180, 240, 300]
                                else if (isSquare) angles = [45, 135, 225, 315]
                                else if (pStyle === 'Compass') angles = [0, 90, 180, 270] // NSEW Orientation

                                // 3. Geometry Config (Trellis Profile)
                                // Standard trellis anchor
                                const startY = -0.22
                                const bulgeY = 0.08
                                const tipY = 0.42

                                const wBase = 0.12 * gemScale[0]
                                const wBulge = 0.46 * gemScale[0]
                                const wTip = 0.40 * gemScale[0]

                                const curve = new THREE.CatmullRomCurve3([
                                    new THREE.Vector3(wBase, startY, 0),
                                    new THREE.Vector3(wBase * 1.4, startY + 0.15, 0),
                                    new THREE.Vector3(wBulge, bulgeY, 0),
                                    new THREE.Vector3(wTip, tipY, 0)
                                ])

                                return (
                                    <group>
                                        {/* Gallery Rail (Bridge) */}
                                        <mesh position={[0, bulgeY - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} material={goldMaterial}>
                                            <torusGeometry args={[wBulge * 0.85, 0.035, 16, 32]} />
                                        </mesh>

                                        {angles.map((Ang, i) => {
                                            const rad = THREE.MathUtils.degToRad(Ang)
                                            let sFactor = 1.0
                                            if (isSquare && pStyle !== 'Compass') sFactor = 1.35

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
                                    </group>
                                )
                            })()
                        )}
                    </group>
                )}

                {/* 2. HALO HEAD */}
                {config.headType === 'Halo' && (
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
                )}

                {/* 3. THREE-STONE HEAD */}
                {config.headType === 'Three-Stone' && (
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
                )}
            </group>

            {/* MAIN GEM */}
            <group position={[0, 1.35, 0]} scale={gemScale}>
                <mesh geometry={currentGemGeom.crown} material={gemMaterial} />
                <mesh geometry={currentGemGeom.pavilion} material={gemMaterial} />
            </group>
        </group>
    )
}
