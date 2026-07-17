import {getbedrockXuidCache, setbedrockXuidCache } from '../cache.js'
import { updateSlimUsernameStatus } from './is-slim.js'
export async function bedrockSkinFetchHandler(username) {
    const cleanUsername = username.slice(1)

    let xuid = await getbedrockXuidCache(cleanUsername) 
    if (!xuid) {
        const xuidResponse = await fetch(`https://api.geysermc.org/v2/xbox/xuid/${cleanUsername}`, requestOptions)
        if (!xuidResponse.ok) throw new Error("Failed to fetch Xbox XUID")

        const xuidResponseJSON = await xuidResponse.json()
        xuid = xuidResponseJSON.xuid
        await setbedrockXuidCache(cleanUsername, xuid)
    }

    const skinDataResponse = await fetch(`https://api.geysermc.org/v2/skin/${xuid}`, requestOptions)
    if (!skinDataResponse.ok) throw new Error(`Failed to fetch Xbox skin ${xuid}`)
    
    const skinDataResponseJSON = await skinDataResponse.json()
    const tex_id = skinDataResponseJSON.texture_id
    const is_slim = !skinDataResponseJSON.is_steve
    await updateSlimUsernameStatus(username, is_slim)

    const skinResponse = await fetch(`https://textures.minecraft.net/texture/${tex_id}`)
    if (!skinResponse.ok) throw new Error("Failed to fetch skin")
    
    return {skin: Buffer.from(await skinResponse.arrayBuffer()), is_slim}
}
const headers = new Headers()
headers.append("Accept", "application/json")

const requestOptions = {
    method: "GET",
    headers: headers,
    redirect: "follow"
}