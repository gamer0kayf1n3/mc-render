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
  await redis.del(`is_slim:${username}`)
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

export async function setSlimCache(username, is_slim) {
  return redis.set(`is_slim:${username}`, is_slim ? 1:0, { EX: 86400 })
}

export async function getSlimCache(username) {
  return await redis.get(`is_slim:${username}`) == 1 ? true : false
}


// bedrock cache
export async function getbedrockXuidCache(username) {
  return await redis.get(`bedrock_xuid:${username}`)
}

export async function setbedrockXuidCache(username, xuid) {
  return redis.set(`bedrock_xuid:${username}`, xuid, { EX: 86400 * 30 })
}
