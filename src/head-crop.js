import sharp from 'sharp'

const FACES = {
    front: {
        base: { left: 8, top: 8, width: 8, height: 8 },
        hat: { left: 40, top: 8, width: 8, height: 8 },
    },
    back: {
        base: { left: 24, top: 8, width: 8, height: 8 },
        hat: { left: 56, top: 8, width: 8, height: 8 },
    },
}

const clampInt = (value, fallback, min, max) =>
    Math.min(Math.max(parseInt(value) || fallback, min), max)

const getFace = (side) => FACES[side] ?? FACES.front

const nearest = (buf, size) =>
    sharp(buf)
        .resize({ width: size, height: size, kernel: sharp.kernel.nearest })
        .png()
        .toBuffer()

export async function cropHead(skinBuffer, { side = 'front', layer = 'both', scale = 8 } = {}) {
    const size = clampInt(scale, 8, 1, 64) * 8
    const face = getFace(side)

    const base = await sharp(skinBuffer).extract(face.base).toBuffer()
    const hat = await sharp(skinBuffer).extract(face.hat).toBuffer()

    let out
    if (layer === 'base') out = base
    else if (layer === 'overlay') out = hat
    else out = await sharp(base).composite([{ input: hat, blend: 'over' }]).toBuffer()

    return nearest(out, size)
}


export async function cropHeadSplit(skinBuffer, { side = 'front', scale = 1 } = {}) {
    const k = clampInt(scale, 1, 1, 16)
    const face = getFace(side)

    const base = await nearest(await sharp(skinBuffer).extract(face.base).toBuffer(), 64 * k)
    const hat = await nearest(await sharp(skinBuffer).extract(face.hat).toBuffer(), 72 * k)

    return sharp({
        create: {
            width: 136 * k,
            height: 72 * k,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite([
            { input: base, left: 0, top: 4 * k },
            { input: hat, left: 64 * k, top: 0 },
        ])
        .png()
        .toBuffer()
}
