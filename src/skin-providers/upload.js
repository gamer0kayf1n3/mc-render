import path from "path"
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads'); // adjust once, here, correctly

import { getSlimUsernameStatus } from "./is-slim.js";

import fs from 'node:fs/promises';


export async function uploadSkinFetchHandler(username) {
    console.log(import.meta.dirname);
    var username = username.slice(1)
    const safeFolder = UPLOADS_DIR
    const safeName = path.basename(username)
    const finalPath = path.join(safeFolder, path.format({name: safeName, ext: ".png"}))

    try {
        var skinData = await fs.readFile(finalPath)
    }
    catch (err) {
        throw new Error(err.message)
    } 

    const is_slim = getSlimUsernameStatus(safeName)
    return {skin: skinData, is_slim }

}