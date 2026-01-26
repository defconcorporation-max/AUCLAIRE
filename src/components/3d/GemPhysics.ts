export type GemShape = 'Round' | 'Princess' | 'Emerald' | 'Oval' | 'Pear' | 'Cushion' | 'Radiant' | 'Asscher' | 'Marquise' | 'Heart'

// Reference dimensions for 1.0 carat stone (in mm)
// For non-round shapes, this usually refers to the longest dimension (Length) or an average?
// Standards vary, but we will use typical 'ideal' cut proportions.
// We will return { width, length, depthRatio }
// For simplicity in scaling, we return a "base scale factor" that represents the longest dimension in mm for 1ct.

const BASE_DIMENSIONS_1CT: Record<GemShape, { l: number, w: number, d_ratio: number }> = {
    'Round': { l: 6.5, w: 6.5, d_ratio: 0.61 },
    'Princess': { l: 5.5, w: 5.5, d_ratio: 0.7 }, // Square
    'Emerald': { l: 7.0, w: 5.0, d_ratio: 0.65 }, // Rectangular
    'Oval': { l: 7.7, w: 5.7, d_ratio: 0.63 },
    'Marquise': { l: 10.0, w: 5.0, d_ratio: 0.60 },
    'Pear': { l: 8.6, w: 5.6, d_ratio: 0.60 },
    'Heart': { l: 6.5, w: 6.5, d_ratio: 0.60 },
    'Cushion': { l: 6.0, w: 5.5, d_ratio: 0.65 },
    'Radiant': { l: 7.0, w: 5.0, d_ratio: 0.65 }, // Similar to Emerald
    'Asscher': { l: 5.5, w: 5.5, d_ratio: 0.68 }  // Square Emerald
}

/**
 * Returns the dimensions (Length, Width, Depth) in Millimeters for a given shape and carat weight.
 * Uses the Cube Root law: Dim_new = Dim_1ct * cbrt(Carat_new)
 */
export const getGemDimensionsMM = (shape: GemShape, carat: number) => {
    // Default to Round if shape not found
    const base = BASE_DIMENSIONS_1CT[shape] || BASE_DIMENSIONS_1CT['Round']

    // Scale factor based on volume/mass relationship
    const scale = Math.cbrt(carat)

    return {
        length: base.l * scale,
        width: base.w * scale,
        depth: (base.l * scale) * base.d_ratio // Approximation
    }
}

/**
 * Returns the 3D scene scale vector for the gem geometry.
 * Assumes the base geometry in GemGeometryEngine is normalized to roughly 1.0 width/length.
 */
export const getGemScaleVector = (shape: GemShape, carat: number): [number, number, number] => {
    // 1 Unit in ThreeJS Scene = 10 mm (based on Shank logic being 3mm = 0.3 units)
    // Therefore 1mm = 0.1 Units.
    const dimensions = getGemDimensionsMM(shape, carat);

    const scaleX = dimensions.width * 0.1
    // const scaleY = dimensions.width * 0.1 // Unused, using scaleX for depth ratio
    const scaleZ = dimensions.length * 0.1

    // Correction: GeometryEngine orientation.
    // Round: Circle on XZ.
    // Geometry is built with unit-ish dimensions.
    // If we pass these scales to the mesh:
    // For Round: W=6.5, L=6.5. ScaleX=0.65, ScaleZ=0.65.

    // For Oval: W=5.7, L=7.7.
    // If Geometry is normalized 1x1 circle, we stretch Z to get Oval.
    // But GemGeometryEngine ALREADY scales Oval geometries (scale(1,1,0.7) usually).
    // This is tricky. 

    // Strategy: Reset GeometryEngine to return UNIT primitives (1x1x1 approx) and handle ALL PROPORTIONS here?
    // OR: Compensate for GeometryEngine's built-in aspect ratios.

    // Let's assume we will normalize GemGeometryEngine to output 1.0 unit bounding box as much as possible,
    // Or we just calculate the target Absolute Dimensions and apply them.

    // If GeometryEngine.Oval is 1.0 width (X) and 1.4 length (approx),
    // and we want 5.7mm and 7.7mm.

    return [scaleX, scaleX, scaleZ]
    // Wait, Y (Depth) should be dependent on depth ratio? 
    // The geometry itself has depth. If we scale uniformly, depth scales with width.
    // Usually scaleX = Width, scaleZ = Length. ScaleY = (Width or Length)?
    // Let's simplify: Scale Y usually matches width scale for depth proportion, or we can fine tune.
    // For now: Uniform scaling for X/Y, stretch Z for length?
    // Better: [Width, Width, Length] if geometry is oriented along Z?
    // Actually standard orientation: Y is up. X/Z is plane.

    // We will return a scale vector [x, y, z] to apply to the mesh.
}
