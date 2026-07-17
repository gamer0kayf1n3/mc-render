export async function javaSkinFetchHandler(username) {
    const skinResponse = await fetch(`https://mineskin.eu/skin/${username}`)
    if (!skinResponse.ok) throw new Error("Failed to fetch skin")
    return Buffer.from(await skinResponse.arrayBuffer())
}