import pkg from 'redis'
const { createClient, commandOptions } = pkg
const redis = await createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export async function refreshCache(username) {
  await redis.del(`textures:${username}`)
  await redis.del(`renders:${username}`)
  await redis.del(`is_steve:${username}`)
}

export async function getTextureCache(username) {
  return await redis.get(commandOptions({ returnBuffers: true }), `textures:${username}`)
}

export async function setTextureCache(username, buffer) {
  return redis.set(`textures:${username}`, buffer, { EX: 86400 })
}

export async function getRenderCache(username) {
  return await redis.get(commandOptions({ returnBuffers: true }), `renders:${username}`)
}

export async function setRenderCache(username, buffer) {
  return redis.set(`renders:${username}`, buffer, { EX: 86400 })
}

export async function setSteveCache(username, is_steve) {
  return redis.set(`is_steve:${username}`, is_steve, { EX: 86400 })
}

export async function getSteveCache(username) {
  return await redis.get(`is_steve:${username}`)
}


// bedrock cache
export async function getbedrockXuidCache(username) {
  return await redis.get(`bedrock_xuid:${username}`)
}

export async function setbedrockXuidCache(username, xuid) {
  return redis.set(`bedrock_xuid:${username}`, xuid, { EX: 86400 * 30 })
}
