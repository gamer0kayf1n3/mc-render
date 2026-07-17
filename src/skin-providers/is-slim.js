import { readFile, writeFile } from 'fs/promises';
import { getSlimCache, setSlimCache } from '../cache.js';
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SLIM_JSON_PATH = path.join(__dirname, '../../slim.json');

async function fetchUsernameDB() {
    let data = {};

    try {
        const rawData = await readFile(SLIM_JSON_PATH, 'utf8');
        data = JSON.parse(rawData);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Failed to read file:', error);
            return;
        }
        console.log('File not found. Creating a new one.');
    }
    return data
}

export async function getSlimUsernameStatus(username) {
    var is_slim = await getSlimCache(username);
    if (is_slim === null || is_slim === undefined) {
        let data = await fetchUsernameDB()
        is_slim = data[username]
        await setSlimCache(username, is_slim);
    }

}

export async function updateSlimUsernameStatus(username, is_slim) {
    let data = await fetchUsernameDB()
    data[username] = is_slim;
    await setSlimCache(username, is_slim);


    try {
        await writeFile(SLIM_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Failed to write file:', error);
    }
}
