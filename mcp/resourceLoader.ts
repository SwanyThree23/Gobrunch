import { promises as fs } from 'fs';
import path from 'path';

const cache = new Map<string, string>();

export async function loadResource(name: string): Promise<string> {
    if (cache.has(name)) {
        return cache.get(name)!;
    }
    const filePath = path.join(process.cwd(), 'mcp', 'resources', `${name}.html`);
    const content = await fs.readFile(filePath, 'utf8');
    cache.set(name, content);
    return content;
}
