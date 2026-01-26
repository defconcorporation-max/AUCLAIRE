// @ts-nocheck
import * as THREE from "three"

// Helper to compute normals manually if needed, but Three.js can compute from vertices.
// We will generate positions and indices.

// Helper to compute normals manually if needed, but Three.js can compute from vertices.
// We will generate positions and indices.

export interface ProceduralRingOptions {
    profileShape: THREE.Shape;
    radius: number;           // Inner radius (e.g. 10mm)
    width: number;            // Base Width (at bottom)
    thickness: number;        // Base Thickness (at bottom)
    taperTop?: number;        // Scale factor for width at top (default 1.0)
    taperSide?: number;       // Scale factor for thickness/width at side (default 1.0)

    // Advanced Props
    twistAmount?: number;     // Degrees of twist (e.g. 360)
    cathedralHeight?: number; // Additional height at top (mm)
    isSplit?: boolean;        // If true, generate split shank
    splitGap?: number;        // Gap size at top for split (mm)
}

/**
 * Advanced Procedural Ring Generator
 * Supports Tapering, Twisting, Cathedral Arches, and Split Shanks.
 */
export const createProceduralRingGeometry = (options: ProceduralRingOptions): THREE.BufferGeometry => {
    const {
        profileShape, radius,
        taperTop = 1.0,
        twistAmount = 0,
        cathedralHeight = 0,
        isSplit = false,
        splitGap = 1.0
    } = options;

    const geometry = new THREE.BufferGeometry()
    const radialSegments = 180 // Higher res for smooth twists
    const profilePoints = profileShape.getPoints(12)

    // For Split shank, we generate two distinct strands if isSplit is true?
    // Or we duplicate the loop logic. 
    // Easier approach: One loop that pushes vertices for 1 or 2 profiles.

    const vertices: number[] = []
    const indices: number[] = []

    // Number of "Strands". Normal = 1. Split = 2.
    const strands = isSplit ? [-1, 1] : [0];

    // We need to track vertex indices for face generation.
    // Format: [Strand][RadialSegment][ProfilePoint]
    // Flat index = (strandIndex * (segments+1) * pointsPerProfile) + (segmentIndex * pointsPerProfile) + pointIndex

    const pointsPerProfile = profilePoints.length

    strands.forEach((strandDir, strandIndex) => {
        // const strandOffset = ... // Unused in this loop

        for (let i = 0; i <= radialSegments; i++) {
            // Angle mapping: -PI/2 is Top (12 o'clock)? 
            // In standard ThreeJS RingGeometry, thetaStart is usually top if rotated.
            // Let's stick to: i=0 is Top (Angle 0). i=Max is Top (Angle 2PI).
            // Actually it's a closed loop. 0 and 2PI are same.

            const segmentAngle = (i / radialSegments) * Math.PI * 2

            // Normalized Angle for effects (0 at top, 1 at bottom... wait)
            // We want 0 at Top, PI at Bottom.
            // Angle moves 0 -> 2PI.
            // Distance from Top (0 or 2PI)
            let angleFromTop = segmentAngle;
            if (angleFromTop > Math.PI) angleFromTop = 2 * Math.PI - angleFromTop; // 0 to PI

            // 0 = Top, PI = Bottom.
            const taperFactor = (Math.cos(segmentAngle) + 1) / 2 // 1 at Top (0), 0 at Bottom (PI)? 
            // Cos(0)=1. Cos(PI)=-1. (1+1)/2 = 1. (-1+1)/2 = 0.
            // So taperFactor is 1.0 at TOP, 0.0 at BOTTOM.

            // Taper Logic (Width)
            const currentWidthScale = 1.0 + ((taperTop - 1.0) * taperFactor)

            // Cathedral Logic (Thickness Height)
            // Grows near top. Gaussian/Power curve.
            const cathedralFactor = Math.pow(Math.max(0, Math.cos(angleFromTop * 1.5)), 3) // Sharper peak at top
            const currentThicknessAdd = cathedralFactor * cathedralHeight

            // Twist Logic
            // Rotation based on angle
            const currentTwist = (segmentAngle / (Math.PI * 2)) * THREE.MathUtils.degToRad(twistAmount)

            // Split Logic
            // Offset Z (width axis)
            // 0 at bottom, max at top.
            // If standard split: triangular gap.
            const splitOffsetZ = isSplit ? (strandDir * (splitGap * 0.5 * taperFactor)) : 0
            // Also scale down strands if split? 
            const strandScale = isSplit ? 0.6 : 1.0 // Strands are thinner


            // Center Position on Ring Circle
            // Cathedral affects Radius?
            // "Cathedral" usually means the shank lifts UP off the finger (Radius increases).
            // So we add to radius.
            const currentRadius = radius + currentThicknessAdd

            const centerX = Math.cos(segmentAngle + Math.PI / 2) * currentRadius // Rotate to start at Top?
            // By default cos(0)=1, sin(0)=0 (Right). 
            // We want Top. (0, 1). So + PI/2.
            const centerY = Math.sin(segmentAngle + Math.PI / 2) * currentRadius
            const centerZ = splitOffsetZ // Move sideways for split

            // Local Basis
            // Normal = Position Vector (normalized)
            // Tangent = Perpendicular

            // Iterate Profile Points
            profilePoints.forEach((pt) => {
                // pt.x = Width, pt.y = Thickness (Radius dir)

                // 1. Transform Profile (Scale & Twist)
                let px = pt.x * currentWidthScale * strandScale
                let py = pt.y * strandScale // Thickness scale?

                // Twist Rotation
                if (twistAmount !== 0) {
                    const cosT = Math.cos(currentTwist)
                    const sinT = Math.sin(currentTwist)
                    const tx = px * cosT - py * sinT
                    const ty = px * sinT + py * cosT
                    px = tx; py = ty;
                }

                // 2. Map to 3D Space
                // Tangent Plane: defined by Angle.
                // Profile X -> World Z (Width axis)
                // Profile Y -> World Radial (In/Out)

                // We are at angle `A = segmentAngle + PI/2`.
                // Radial Vector R = (cos A, sin A, 0)
                // Z Vector Z = (0, 0, 1)

                // Point Position = Center + (py * R) + (px * Z)

                const angleA = segmentAngle + Math.PI / 2
                const cosA = Math.cos(angleA)
                const sinA = Math.sin(angleA)

                // Radial Offset from center
                const rX = cosA * py
                const rY = sinA * py

                const finalX = centerX + rX
                const finalY = centerY + rY
                const finalZ = centerZ + px // Width direction

                vertices.push(finalX, finalY, finalZ)
            })
        }
    })

    // Indices Generation
    strands.forEach((_, strandIndex) => {
        const strandOffset = strandIndex * (radialSegments + 1) * pointsPerProfile

        for (let i = 0; i < radialSegments; i++) {
            for (let j = 0; j < pointsPerProfile; j++) {
                // Current profile points
                const currRow = i
                const nextRow = i + 1

                const p1 = strandOffset + (currRow * pointsPerProfile) + j
                const p2 = strandOffset + (nextRow * pointsPerProfile) + j
                const p3 = strandOffset + (nextRow * pointsPerProfile) + ((j + 1) % pointsPerProfile)
                const p4 = strandOffset + (currRow * pointsPerProfile) + ((j + 1) % pointsPerProfile)

                // Faces
                indices.push(p1, p2, p4)
                indices.push(p2, p3, p4)
            }
        }
    })

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    return geometry
}

// Wrapper for backward compatibility (if needed)
export const createTaperedRingGeometry = (
    profileShape: THREE.Shape,
    radius: number,
    width: number,
    thickness: number,
    taperTop: number,
    taperSide: number
) => {
    return createProceduralRingGeometry({
        profileShape, radius, width, thickness, taperTop, taperSide
    })
}
