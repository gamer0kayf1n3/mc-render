import { texture } from "three/tsl"

export async function javaSkinFetchHandler(username) {
    const uuidResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
    if (!uuidResponse.ok) throw new Error("Failed to fetch UUID from Mojang")
    const uuidResponseJSON = await uuidResponse.json()
    const uuid = uuidResponseJSON.id

    const profileResponse = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)
    if (!profileResponse.ok) throw new Error("Failed to fetch profile from Mojang")
    const profileResponseJSON = await profileResponse.json()
    const textureDataB64 = profileResponseJSON.properties[0].value

    const textureData = JSON.parse(atob(textureDataB64))
    const skinURL = textureData.textures?.SKIN?.url
    const is_slim = textureData.textures?.SKIN?.metadata?.model == "slim"

    const skinResponse = await fetch(skinURL)
    if (!skinResponse.ok) throw new Error("Failed to fetch skin")
    return {skin: Buffer.from(await skinResponse.arrayBuffer()), is_slim}
}   