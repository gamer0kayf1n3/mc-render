import sharp from 'sharp'

export async function cropHead(skinBuffer) {
    try {
        const croppedHat = await sharp(skinBuffer)
            .extract({ left: 40, top: 8, width: 8, height: 8 }) 
            .toBuffer()
        const compositeHead = await sharp(skinBuffer)
            .extract({ left: 8, top: 8, width: 8, height: 8 })
            .composite([{ input: croppedHat, blend: 'over', top: 0, left: 0 }])
            .toBuffer()
        const croppedHead = await sharp(compositeHead)
            .resize({ width: 64, height: 64, kernel: sharp.kernel.nearest })
            .toBuffer()
        return croppedHead
    } catch (error) {
        throw error
    }
}