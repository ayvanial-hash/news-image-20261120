import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

async function validateAndCopy() {
    const botDir = process.env.MAKEFUN_BOT_DIR || '/bot';
    const inputPath = join(botDir, 'entry.png');
    const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
    const outputPath = join(outputDir, 'entry.png');

    try {
        const buffer = await readFile(inputPath);
        
        // PNG signature: 89 50 4E 47 0D 0A 1A 0A
        const signature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        for (let i = 0; i < signature.length; i++) {
            if (buffer[i] !== signature[i]) throw new Error('Invalid PNG signature');
        }

        // Size cap: 1MB limit
        if (buffer.length > 1048576) throw new Error('File size exceeds 1MB limit');

        // Check IHDR for 1024x1024
        // IHDR chunk: 4 bytes length + 4 bytes type + 13 bytes data + 4 bytes CRC
        if (buffer.length < 33) throw new Error('Invalid PNG structure: missing or incomplete IHDR chunk');
        
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);

        if (width !== 1024 || height !== 1024) throw new Error(`Invalid dimensions: ${width}x${height} (expected 1024x1024)`);

        await mkdir(outputDir, { recursive: true });
        await writeFile(outputPath, buffer);
        console.log(`Validation passed. Successfully copied to ${outputPath}`);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

validateAndCopy();
