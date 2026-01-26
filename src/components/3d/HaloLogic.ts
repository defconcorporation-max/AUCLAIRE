import * as THREE from 'three'

export interface HaloItem {
    position: THREE.Vector3
    rotation: THREE.Euler
}

/**
 * Generates positions for a halo of small stones around a center gem.
 * @param shape The shape of the center gem (Round, Princess, etc.)
 * @param width Width of the center gem (X axis)
 * @param length Length of the center gem (Z axis)
 * @param stoneSize Diameter of the halo stones
 * @param gap Spacing between halo stones
 */
export function getHaloPositions(
    shape: string,
    width: number,
    length: number,
    stoneSize: number,
    gap: number = 0.05
): HaloItem[] {
    const items: HaloItem[] = []

    // Offset is half width + half stone size + small metal lip
    // But actually we want the halo center to be at (Width/2 + StoneSize/2 + MetalThickness)
    const offset = 0.1 // Distance from gem girdle to halo stone center
    const rx = (width / 2) + (stoneSize / 2) + offset
    const rz = (length / 2) + (stoneSize / 2) + offset

    let curve: THREE.Curve<THREE.Vector3>

    switch (shape) {
        case 'Princess':
        case 'Asscher':
        case 'Emerald':
        case 'Radiant':
            // Rounded Rectangle
            // We'll use a path of lines and arcs
            {
                const cornerRadius = (shape === 'Princess') ? 0.2 : 0.5 * Math.min(rx, rz)
                const w = rx - cornerRadius
                const h = rz - cornerRadius

                const path = new THREE.CurvePath<THREE.Vector3>()

                // Top Right Corner
                path.add(new THREE.LineCurve3(new THREE.Vector3(w, 0, -rz), new THREE.Vector3(rx, 0, -h)))
                // path.add(new THREE.EllipseCurve(...)) // EllipseCurve is 2D, we need 3D args or map it.
                // Let's us QuadraticBezier for corners or just manual segments? 
                // Three.js curve path construction for rounded rect is a bit verbose.
                // Let's use a simpler parametric approach or pre-built points.

                // Simpler: CatmullRom through key points
                const pts = []
                // TR
                pts.push(new THREE.Vector3(w, 0, -rz))
                pts.push(new THREE.Vector3(rx, 0, -h))
                // BR
                pts.push(new THREE.Vector3(rx, 0, h))
                pts.push(new THREE.Vector3(w, 0, rz))
                // BL
                pts.push(new THREE.Vector3(-w, 0, rz))
                pts.push(new THREE.Vector3(-rx, 0, h))
                // TL
                pts.push(new THREE.Vector3(-rx, 0, -h))
                pts.push(new THREE.Vector3(-w, 0, -rz))

                // Close loop
                pts.push(pts[0])

                curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.1) // Low tension for tighter corners
            }
            break

        case 'Pear':
            {
                // Teardrop shape
                // Top is semi-circle (radius X)
                // Bottom is tapered point
                // Parametric equation for Pear?
                // x = a * cos(t)
                // y = b * sin(t) * (1 - 0.5 * sin(t)) ? 

                // Let's use a CatmullRom with shaped points
                const pts = []
                const steps = 32
                for (let i = 0; i < steps; i++) {
                    const t = (i / steps) * Math.PI * 2
                    // Proper Pear Equation
                    // x = A * sin(t)
                    // y = B * cos(t) - C * sin(t)^2 ... complicated to control exact dimensions

                    // Simple distortion:
                    // Standard ellipse: x = rx * cos, z = rz * sin
                    // Taper top (z < 0): Normal
                    // Taper bottom (z > 0): Scale X down as Z increases

                    const angle = t
                    const cx = Math.cos(angle)
                    const sz = Math.sin(angle)

                    let px = cx * rx
                    let pz = sz * rz

                    // Apply tapering for pear effect
                    // If pz > 0 (bottom tip), shrink x
                    if (pz > 0) {
                        px *= (1 - (pz / (rz * 1.5)))
                    }

                    pts.push(new THREE.Vector3(px, 0, pz))
                }
                curve = new THREE.CatmullRomCurve3(pts, true)
            }
            break

        case 'Marquise':
            {
                // Pointed Ellipse
                // Re-do Marquise as points
                const qPts = []
                // Top Tip
                qPts.push(new THREE.Vector3(0, 0, -rz))
                // Right Curve Mid
                qPts.push(new THREE.Vector3(rx, 0, 0))
                // Bottom Tip
                qPts.push(new THREE.Vector3(0, 0, rz))
                // Left Curve Mid
                qPts.push(new THREE.Vector3(-rx, 0, 0))

                // Add intermediates to force curve
                qPts.splice(1, 0, new THREE.Vector3(rx * 0.6, 0, -rz * 0.6))
                qPts.splice(3, 0, new THREE.Vector3(rx * 0.6, 0, rz * 0.6))
                qPts.splice(5, 0, new THREE.Vector3(-rx * 0.6, 0, rz * 0.6))
                qPts.splice(7, 0, new THREE.Vector3(-rx * 0.6, 0, -rz * 0.6))

                curve = new THREE.CatmullRomCurve3(qPts, true)
            }
            break

        case 'Oval':
            curve = new THREE.EllipseCurve(0, 0, rx, rz, 0, 2 * Math.PI, false, 0) as unknown as THREE.Curve<THREE.Vector3>
            // EllipseCurve is 2D (Vector2), we need to manually map or use it carefully.
            // Using logic below to handle 3D mapping.
            break

        case 'Round':
        case 'Cushion': // Cushion is circle-ish enough for now, or TODO improved cushion
        default:
            curve = new THREE.EllipseCurve(0, 0, rx, rz, 0, 2 * Math.PI, false, 0) as unknown as THREE.Curve<THREE.Vector3>
            break
    }

    // Generic Path Walker
    // Whether it came from EllipseCurve or CatmullRom, we sample it uniformly

    // Convert 2D Ellipse to 3D Curve if needed
    if (shape === 'Oval' || shape === 'Round' || shape === 'Cushion') {
        // Re-create as 3D path for consistency
        const ellipsePoints = (curve as any).getPoints(64).map((p: any) => new THREE.Vector3(p.x, 0, p.y))
        curve = new THREE.CatmullRomCurve3(ellipsePoints, true)
    }

    // Recalculate perimeter on the 3D curve
    const perimeterLength = curve.getLength()
    const count = Math.floor(perimeterLength / (stoneSize + gap))

    for (let i = 0; i < count; i++) {
        const t = i / count
        const pos = curve.getPointAt(t)
        const tangent = curve.getTangentAt(t)
        // Normal is cross product of tangent and UP (0,1,0) - Facing OUTWARD
        // Tangent points along the band. Up is Y. Cross(Tang, Up) = Normal Out.
        // Wait, Cross(Right, Up) = Forward. 
        // If we go counter-clockwise: Tangent is -Z. Up is Y. Cross(-Z, Y) = X (Right, Out). Correct.
        const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize()

        const dummy = new THREE.Object3D()
        dummy.position.copy(pos)
        dummy.lookAt(pos.clone().add(normal))

        items.push({ position: pos, rotation: dummy.rotation })
    }

    return items
}
