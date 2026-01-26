import * as THREE from "three"

// --- GEM GEOMETRY ENGINE ---
// Procedural generation of standard diamond cuts.
// All gems are normalized to roughly 1.0 unit width for scaling.

export type GemShape = 'Round' | 'Princess' | 'Emerald' | 'Oval' | 'Pear' | 'Cushion' | 'Radiant' | 'Asscher' | 'Marquise' | 'Heart'

export const getGemGeometry = (shape: GemShape) => {
    switch (shape) {
        case 'Princess': return createPrincessGeometry()
        case 'Emerald': return createEmeraldGeometry()
        case 'Oval': return createOvalGeometry()
        case 'Pear': return createPearGeometry()
        case 'Cushion': return createCushionGeometry()
        case 'Radiant': return createRadiantGeometry()
        case 'Asscher': return createAsscherGeometry()
        case 'Marquise': return createMarquiseGeometry()
        case 'Heart': return createHeartGeometry()
        case 'Round':
        default: return createRoundGeometry()
    }
}

// 1. ROUND BRILLIANT (Standard)
const createRoundGeometry = () => {
    const segments = 48 // High quality
    const crown = new THREE.CylinderGeometry(0.3, 0.5, 0.2, segments, 1)
    crown.translate(0, 0.1, 0)
    const pavilion = new THREE.CylinderGeometry(0.5, 0.0, 0.4, segments, 1)
    pavilion.translate(0, -0.2, 0)
    return { crown, pavilion }
}

// 2. PRINCESS (Square Modified Brilliant)
const createPrincessGeometry = () => {
    // Sharp corners, step-like crown/pavilion mix
    // Manual geometry for better look:
    // Actually, box is okay for distance, but let's make it pyramidal.
    const cGeo = new THREE.CylinderGeometry(0.5, 0.707, 0.25, 4, 1) // 0.707 * 2 ~= 1.4 diagonal approx? no, width 1.
    cGeo.rotateY(Math.PI / 4)
    cGeo.translate(0, 0.125, 0)

    // Pavilion: Deep pyramid
    const pGeo = new THREE.CylinderGeometry(0.707, 0.0, 0.6, 4, 1)
    pGeo.rotateY(Math.PI / 4)
    pGeo.translate(0, -0.3, 0)

    return { crown: cGeo, pavilion: pGeo }
}

// 3. EMERALD (Step Cut Rectangular)
const createEmeraldGeometry = () => {
    // Octagonal prism (chamfered corners)
    // Normalized to 1x1 base for external scaling
    const crown = new THREE.CylinderGeometry(0.3, 0.5, 0.15, 8, 1)
    crown.translate(0, 0.075, 0)

    const pavilion = new THREE.CylinderGeometry(0.5, 0.1, 0.4, 8, 1) // Keel line bottom?
    pavilion.translate(0, -0.2, 0)

    return { crown, pavilion }
}

// 4. OVAL (Modified Brilliant)
const createOvalGeometry = () => {
    const segments = 48
    // Normalized to 1x1 base. Aspect ratio handled by RingModel scale.
    const crown = new THREE.CylinderGeometry(0.3, 0.5, 0.15, segments, 1)
    crown.translate(0, 0.075, 0)

    const pavilion = new THREE.CylinderGeometry(0.5, 0.0, 0.4, segments, 1)
    pavilion.translate(0, -0.2, 0)

    return { crown, pavilion }
}

// 5. PEAR (Teardrop)
const createPearGeometry = () => {
    // Normalized 1x1 base
    const { crown, pavilion } = createOvalGeometry()
    // We rely on simple Oval geometry for now, external scale will make it distinct if possible,
    // (Note: Transforming a cylinder to a pear requires vertex manipulation which is complex here, 
    // keeping Oval fallback but standardizing size)
    return { crown, pavilion }
}

// 6. CUSHION (Rounded Square)
const createCushionGeometry = () => {
    // Cylinder with 16 segments, scaled to look 'square-round'.
    const crown = new THREE.CylinderGeometry(0.35, 0.5, 0.2, 16, 1)
    crown.rotateY(Math.PI / 8) // Offset to align flat sides
    crown.translate(0, 0.1, 0)

    const pavilion = new THREE.CylinderGeometry(0.5, 0.05, 0.4, 16, 1)
    pavilion.rotateY(Math.PI / 8)
    pavilion.translate(0, -0.2, 0)

    return { crown, pavilion }
}

// 7. RADIANT (Cut Corner Rectangular)
const createRadiantGeometry = () => {
    // Like Emerald but brilliant style facets.
    // Normalized.
    return createEmeraldGeometry()
}

// 8. ASSCHER (Square Emerald)
const createAsscherGeometry = () => {
    const { crown, pavilion } = createEmeraldGeometry()
    // Normalized
    return { crown, pavilion }
}

// 9. MARQUISE (Football)
const createMarquiseGeometry = () => {
    // Very thin oval with pointed ends?
    // How to point the ends of a cylinder?
    // Scale X/Z is easy. Z = 0.5 * X.

    // To make it pointy (Navette):
    // Standard cylinder is round.
    // A customized shape extrusion is better?
    // Fallback: Thin Oval.
    const { crown, pavilion } = createOvalGeometry()
    crown.scale(1, 1, 1)
    pavilion.scale(1, 1, 1)

    crown.scale(1, 1, 0.5) // Narrow
    pavilion.scale(1, 1, 0.5)

    return { crown, pavilion }
}

// 10. HEART
const createHeartGeometry = () => {
    // Use Shape Extrusion
    const x = 0, y = 0
    const heartShape = new THREE.Shape()
    heartShape.moveTo(x + 0.25, y + 0.25)
    heartShape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.20, y, x, y)
    heartShape.bezierCurveTo(x - 0.30, y, x - 0.30, y + 0.35, x - 0.30, y + 0.35)
    heartShape.bezierCurveTo(x - 0.30, y + 0.55, x - 0.10, y + 0.77, x + 0.25, y + 0.95)
    heartShape.bezierCurveTo(x + 0.60, y + 0.77, x + 0.80, y + 0.55, x + 0.80, y + 0.35)
    heartShape.bezierCurveTo(x + 0.80, y + 0.35, x + 0.80, y, x + 0.50, y)
    heartShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25)

    heartShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25)

    // Center it
    const geometry = new THREE.ExtrudeGeometry(heartShape, { depth: 0.2, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 })
    geometry.center()
    geometry.rotateX(Math.PI / 2) // Flat
    geometry.scale(0.8, 0.8, 0.8) // Size adjust

    const crown = geometry
    // Pavilion? Inverted cone?
    const pavilion = new THREE.ConeGeometry(0.4, 0.5, 32)
    pavilion.scale(1, 1, 0.6) // Flatten
    pavilion.rotateX(Math.PI)
    pavilion.translate(0, -0.25, 0)

    return { crown, pavilion }
}
