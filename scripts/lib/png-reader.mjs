/**
 * Minimal PNG decoder — enough to read a Chrome screenshot, nothing more.
 *
 * Written by hand rather than pulled from npm because the project ships no
 * image dependency and this needs exactly one thing: the RGBA bytes of a
 * non-interlaced 8-bit screenshot, so the QA scripts can measure painted ink
 * instead of trusting font metrics.
 *
 * Handles colour types 2 (RGB) and 6 (RGBA) at 8 bits, which is everything
 * Chrome's `Page.captureScreenshot` emits. Anything else throws rather than
 * quietly returning wrong pixels.
 */
import { inflateSync } from "node:zlib";

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

export const PNG = {
  /** @returns {{width:number,height:number,data:Buffer}} RGBA, 4 bytes per px */
  decode(buffer) {
    for (let i = 0; i < SIGNATURE.length; i++) {
      if (buffer[i] !== SIGNATURE[i]) throw new Error("not a PNG");
    }

    let width = 0;
    let height = 0;
    let depth = 0;
    let colorType = 0;
    const idat = [];

    let offset = 8;
    while (offset < buffer.length) {
      const length = buffer.readUInt32BE(offset);
      const type = buffer.toString("ascii", offset + 4, offset + 8);
      const body = buffer.subarray(offset + 8, offset + 8 + length);

      if (type === "IHDR") {
        width = body.readUInt32BE(0);
        height = body.readUInt32BE(4);
        depth = body[8];
        colorType = body[9];
        if (body[12] !== 0) throw new Error("interlaced PNG is not supported");
      } else if (type === "IDAT") {
        idat.push(body);
      } else if (type === "IEND") {
        break;
      }
      offset += 12 + length;
    }

    if (depth !== 8) throw new Error(`unsupported bit depth ${depth}`);
    if (colorType !== 2 && colorType !== 6) {
      throw new Error(`unsupported colour type ${colorType}`);
    }

    const channels = colorType === 6 ? 4 : 3;
    const raw = inflateSync(Buffer.concat(idat));
    const stride = width * channels;
    const out = Buffer.alloc(width * height * 4);
    const prior = Buffer.alloc(stride);
    const line = Buffer.alloc(stride);

    let pos = 0;
    for (let y = 0; y < height; y++) {
      const filter = raw[pos++];
      raw.copy(line, 0, pos, pos + stride);
      pos += stride;

      for (let i = 0; i < stride; i++) {
        const a = i >= channels ? line[i - channels] : 0;
        const b = prior[i];
        const c = i >= channels ? prior[i - channels] : 0;
        switch (filter) {
          case 0:
            break;
          case 1:
            line[i] = (line[i] + a) & 0xff;
            break;
          case 2:
            line[i] = (line[i] + b) & 0xff;
            break;
          case 3:
            line[i] = (line[i] + ((a + b) >> 1)) & 0xff;
            break;
          case 4:
            line[i] = (line[i] + paeth(a, b, c)) & 0xff;
            break;
          default:
            throw new Error(`unknown filter ${filter} on row ${y}`);
        }
      }

      for (let x = 0; x < width; x++) {
        const src = x * channels;
        const dst = (y * width + x) * 4;
        out[dst] = line[src];
        out[dst + 1] = line[src + 1];
        out[dst + 2] = line[src + 2];
        out[dst + 3] = channels === 4 ? line[src + 3] : 255;
      }
      line.copy(prior);
    }

    return { width, height, data: out };
  },
};
