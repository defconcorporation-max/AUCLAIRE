import * as THREE from "three"

// --- RING PROFILE ENGINE (HYPER-REALISM V3) ---
// Now with Micro-Fillets on ALL edges to catch specular highlights.
// No sharp edges allowed.

export type RingProfileType = "Court" | "D-Shape" | "Flat" | "Knife-Edge"

export const getProfileShape = (type: RingProfileType, width: number, thickness: number): THREE.Shape => {
    const shape = new THREE.Shape()

    // Width is centrally symmetric
    const w2 = width / 2

    // FILLET RADIUS (Small but visible)
    const r = 0.05 // 0.05mm fillet for that "manufactured" look

    switch (type) {
        case "Flat":
            // Rect from 0 to thickness with rounded corners
            // Top Right
            shape.moveTo(w2 - r, thickness)
            shape.quadraticCurveTo(w2, thickness, w2, thickness - r)
            // Bottom Right
            shape.lineTo(w2, 0 + r)
            shape.quadraticCurveTo(w2, 0, w2 - r, 0)
            // Bottom Left
            shape.lineTo(-w2 + r, 0)
            shape.quadraticCurveTo(-w2, 0, -w2, 0 + r)
            // Top Left
            shape.lineTo(-w2, thickness - r)
            shape.quadraticCurveTo(-w2, thickness, -w2 + r, thickness)
            break

        case "D-Shape":
            // 10% vertical wall, 90% dome
            {
                const straightH = thickness * 0.1
                const domeH = thickness * 0.9

                // Bottom Right Corner
                shape.moveTo(w2 - r, 0)
                shape.lineTo(w2 - r, 0)
                // ... actually standard D-Shape has sharp bottom corners often? 
                // No, comfort fit means everything is smooth.

                // Start bottom center
                shape.moveTo(0, 0)
                // Line to right, curve up
                shape.lineTo(w2 - r, 0)
                shape.quadraticCurveTo(w2, 0, w2, r)

                // Up to split
                shape.lineTo(w2, straightH)

                // Dome
                // We use absellipse for the main dome
                // Control points? simpler to just use arc logic
                // Center is (0, straightH). Radius X = w2, Radius Y = domeH.
                // We need to match the start point (w2, straightH)
                shape.absellipse(0, straightH, w2, domeH, 0, Math.PI, false, 0)

                // Down left side
                shape.lineTo(-w2, r)
                // Bottom left curve
                shape.quadraticCurveTo(-w2, 0, -w2 + r, 0)
            }
            break

        case "Court":
            // Comfort Fit: Convex Inner, Convex Outer
            // We use a continuous curve mostly, but let's ensure the "Edge" (where inner meets outer) is smooth?
            // "Court" usually implies no hard edge at all. It's an oval.
            {
                // Top Dome (70% H)
                // Bottom Curve (30% H)
                const splitY = thickness * 0.3
                const topH = thickness * 0.7
                const botH = thickness * 0.3

                // Draw Top Half
                shape.absellipse(0, splitY, w2, topH, 0, Math.PI, false, 0)

                // Draw Bottom Half (Convex) - We need to reverse/continue
                // absellipse draws counter-clockwise by default? 
                // We are at (-w2, splitY). We need to go to (w2, splitY) via bottom.
                shape.absellipse(0, splitY, w2, botH, Math.PI, 2 * Math.PI, false, 0)
            }
            break

        case "Knife-Edge":
            // Flat inner, sharp outer (Rounded Peak!)

            // Bottom Right
            shape.moveTo(w2 - r, 0)
            shape.lineTo(w2 - r, 0) // Dummy

            // Start bottom center
            shape.moveTo(0, 0)

            // Bottom Right Corner
            shape.lineTo(w2 - r, 0)
            shape.quadraticCurveTo(w2, 0, w2, r)

            // Side Wall
            const sideH = thickness * 0.2
            shape.lineTo(w2, sideH)

            // To Peak (Rounded)
            // Peak is at (0, thickness). 
            // We stop short of it.
            // Vector from (w2, sideH) to (0, thickness)
            // Let's just create a small arc at top.
            const peakR = 0.1
            shape.lineTo(peakR, thickness - peakR * 0.5)
            shape.quadraticCurveTo(0, thickness, -peakR, thickness - peakR * 0.5)

            // Down to left side
            shape.lineTo(-w2, sideH)

            // Bottom Left Corner
            shape.lineTo(-w2, r)
            shape.quadraticCurveTo(-w2, 0, -w2 + r, 0)

            break

        default:
            // Fallback D
            shape.moveTo(-w2, 0)
            shape.lineTo(w2, 0)
            shape.lineTo(w2, 0)
            shape.absellipse(0, 0, w2, thickness, 0, Math.PI, false, 0)
            break
    }

    return shape
}
