// Exports a CS2 map's baked environment cubemap to a Radiance .hdr equirect.
//
//   bun run export-inspect-env.ts \
//     "$STEAM/Counter-Strike Global Offensive/game/csgo/maps/ui/icon_generation_basic.vpk" \
//     environment.hdr 0.8311
//
// The output is an environment map for image-based lighting — the probe the game lights its OWN
// inspect view with, so a renderer using it matches CS2 rather than approximating it.
// `icon_generation_basic` is the map Valve renders inventory icons in; other maps are worth trying
// (`maps/ui/inspect_weapons.vpk`, `inspect_item`, `inspect_gloves`), but note that `inspect_melee`
// ships NO cubemap at all — knives in game reflect the sky, not a baked probe.
//
// Two things the older note in README.md got wrong: the cubemaps are NOT undecodable, and
// `default_cube_pfm_*` was never the asset worth decoding.
//
//  - BC6H is decoded by the BROWSER's own BPTC decoder rather than a hand-written one: the faces
//    are uploaded as COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT, drawn to an RGBA32F target and read back
//    as float. Headless Chromium's SwiftShader exposes EXT_texture_compression_bptc, so this needs
//    no GPU. Correctness is self-checked: the decoded solid-angle mean RGB is printed against the
//    vtex resource's own `reflectivity` field, and they agree to <0.5%.
//  - Source 2 stores mip levels SMALLEST-FIRST, with all six cube faces contiguous inside each mip.
//    Getting that backwards yields a plausible-looking 4x4 image, so the size assertion is loud.
//  - `COMPRESSED_MIP_SIZE` (extra type 4) on a cubemap records sizes only; the chain is stored raw.
//
// playwright is declared in package.json but the BROWSER is not installed by `bun install`:
// `bunx playwright install chromium` fetches it, and this is the only file that needs it.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { chromium } from 'playwright'

export type VpkEntry = {
	path: string
	crc: number
	archiveIndex: number
	offset: number
	length: number
	preload: Buffer
}

export class Vpk {
	entries = new Map<string, VpkEntry>()
	private dirPath: string
	private headerSize = 0
	private treeSize = 0
	private buf: Buffer

	constructor(dirPath: string) {
		this.dirPath = dirPath
		this.buf = readFileSync(dirPath)
		const b = this.buf
		const sig = b.readUInt32LE(0)
		if (sig !== 0x55aa1234) throw new Error('bad vpk sig ' + sig.toString(16))
		const version = b.readUInt32LE(4)
		this.treeSize = b.readUInt32LE(8)
		this.headerSize = version === 2 ? 28 : 12
		let p = this.headerSize
		const readStr = () => {
			const s = p
			while (b[p] !== 0) p++
			const out = b.toString('latin1', s, p)
			p++
			return out
		}
		for (;;) {
			const ext = readStr()
			if (!ext) break
			for (;;) {
				const dir = readStr()
				if (!dir) break
				for (;;) {
					const name = readStr()
					if (!name) break
					const crc = b.readUInt32LE(p)
					p += 4
					const preloadBytes = b.readUInt16LE(p)
					p += 2
					const archiveIndex = b.readUInt16LE(p)
					p += 2
					const offset = b.readUInt32LE(p)
					p += 4
					const length = b.readUInt32LE(p)
					p += 4
					p += 2 // terminator
					const preload = b.subarray(p, p + preloadBytes)
					p += preloadBytes
					const full = (dir === ' ' ? '' : dir + '/') + name + '.' + ext
					this.entries.set(full, { path: full, crc, archiveIndex, offset, length, preload: Buffer.from(preload) })
				}
			}
		}
	}

	read(path: string): Buffer {
		const e = this.entries.get(path)
		if (!e) throw new Error('not in vpk: ' + path)
		if (e.length === 0) return e.preload
		let data: Buffer
		if (e.archiveIndex === 0x7fff) {
			const base = this.headerSize + this.treeSize
			data = this.buf.subarray(base + e.offset, base + e.offset + e.length)
		} else {
			const idx = String(e.archiveIndex).padStart(3, '0')
			const ap = join(dirname(this.dirPath), basename(this.dirPath).replace(/_dir\.vpk$/, `_${idx}.vpk`))
			if (!existsSync(ap)) throw new Error('missing archive ' + ap)
			const ab = readFileSync(ap)
			data = ab.subarray(e.offset, e.offset + e.length)
		}
		return e.preload.length ? Buffer.concat([e.preload, data]) : Buffer.from(data)
	}
}

// Source 2 compiled-resource block reader + VTEX header parser.
export type Block = { type: string; offset: number; size: number }

export function readBlocks(buf: Buffer): Block[] {
	const blockOffset = buf.readUInt32LE(8)
	const blockCount = buf.readUInt32LE(12)
	const out: Block[] = []
	let p = 16 + blockOffset - 8
	for (let i = 0; i < blockCount; i++) {
		const type = buf.toString('latin1', p, p + 4)
		const off = p + 4 + buf.readUInt32LE(p + 4)
		const size = buf.readUInt32LE(p + 8)
		out.push({ type, offset: off, size })
		p += 12
	}
	return out
}

export const VTEX_FORMAT = [
	'UNKNOWN',
	'DXT1',
	'DXT5',
	'I8',
	'RGBA8888',
	'R16',
	'RG1616',
	'RGBA16161616',
	'R16F',
	'RG1616F',
	'RGBA16161616F',
	'R32F',
	'RG3232F',
	'RGB323232F',
	'RGBA32323232F',
	'JPEG_RGBA8888',
	'PNG_RGBA8888',
	'JPEG_DXT5',
	'PNG_DXT5',
	'BC6H',
	'BC7',
	'ATI2N',
	'IA88',
	'ETC2',
	'ETC2_EAC',
	'BC5',
	'BC4',
	'ATI1N',
	'JPEG_DXT1',
	'PNG_DXT1',
	'BGRA8888',
	'RGBA1010102',
]

export function parseVtex(buf: Buffer) {
	const blocks = readBlocks(buf)
	const data = blocks.find(b => b.type === 'DATA')!
	let p = data.offset
	const version = buf.readUInt16LE(p)
	p += 2
	const flags = buf.readUInt16LE(p)
	p += 2
	const reflectivity = [0, 1, 2, 3].map(i => buf.readFloatLE(p + i * 4))
	p += 16
	const width = buf.readUInt16LE(p)
	p += 2
	const height = buf.readUInt16LE(p)
	p += 2
	const depth = buf.readUInt16LE(p)
	p += 2
	const format = buf.readUInt8(p)
	p += 1
	const numMips = buf.readUInt8(p)
	p += 1
	const picmip0 = buf.readUInt32LE(p)
	p += 4
	const extraOffset = buf.readUInt32LE(p)
	const extraCount = buf.readUInt32LE(p + 4)
	const extraBase = p
	p += 8
	const extras: { type: number; offset: number; size: number }[] = []
	let ep = extraBase + extraOffset
	for (let i = 0; i < extraCount; i++) {
		const type = buf.readUInt32LE(ep)
		const off = ep + 4 + buf.readUInt32LE(ep + 4)
		const size = buf.readUInt32LE(ep + 8)
		extras.push({ type, offset: off, size })
		ep += 12
	}
	const pixelsStart = data.offset + data.size - imageDataSize(width, height, depth, format, numMips)
	return {
		blocks,
		version,
		flags,
		reflectivity,
		width,
		height,
		depth,
		format,
		formatName: VTEX_FORMAT[format] ?? String(format),
		numMips,
		picmip0,
		extras,
		dataBlock: data,
		pixelsStart,
	}
}

export function blockSizeFor(format: number) {
	// bytes per 4x4 block for compressed, or bytes per pixel for uncompressed (returned negative)
	switch (format) {
		case 1:
			return 8 // DXT1
		case 2:
			return 16 // DXT5
		case 19:
			return 16 // BC6H
		case 20:
			return 16 // BC7
		case 25:
			return 16 // BC5
		case 26:
			return 8 // BC4
		default:
			return 0
	}
}

export function bytesPerPixel(format: number) {
	switch (format) {
		case 3:
			return 1 // I8
		case 4:
			return 4 // RGBA8888
		case 5:
			return 2 // R16
		case 6:
			return 4 // RG1616
		case 7:
			return 8 // RGBA16161616
		case 8:
			return 2 // R16F
		case 9:
			return 4 // RG1616F
		case 10:
			return 8 // RGBA16161616F
		case 11:
			return 4 // R32F
		case 12:
			return 8 // RG3232F
		case 13:
			return 12
		case 14:
			return 16
		case 22:
			return 2
		case 30:
			return 4
		default:
			return 0
	}
}

export function mipSize(w: number, h: number, depth: number, format: number, mip: number) {
	const mw = Math.max(1, w >> mip)
	const mh = Math.max(1, h >> mip)
	const bs = blockSizeFor(format)
	const d = Math.max(1, depth)
	if (bs) return Math.ceil(mw / 4) * Math.ceil(mh / 4) * bs * d
	return mw * mh * bytesPerPixel(format) * d
}

export function imageDataSize(w: number, h: number, depth: number, format: number, numMips: number) {
	let t = 0
	for (let m = 0; m < numMips; m++) t += mipSize(w, h, depth, format, m)
	return t
}

// Source 2 stores mips SMALLEST FIRST. Returns byte offset of `mip` within the pixel data.
export function mipOffset(w: number, h: number, depth: number, format: number, numMips: number, mip: number) {
	let t = 0
	for (let m = numMips - 1; m > mip; m--) t += mipSize(w, h, depth, format, m)
	return t
}

// ------------------------------------------------------------------------------------------ main
const [vpkPath, out, targetMeanArg, sliceArg_, sizeArg] = process.argv.slice(2)
if (!vpkPath || !out) {
	console.error('usage: export-inspect-env.ts <map.vpk> <out.hdr> [targetMeanLuminance] [arraySlice] [equirectWidth]')
	process.exit(1)
}
const targetMean = targetMeanArg ? Number(targetMeanArg) : 0
const sliceArg = Number(sliceArg_ ?? 0)
const W = Number(sizeArg ?? 1024)
const H = W / 2

const vpk = new Vpk(vpkPath)
const cubePath = [...vpk.entries.keys()].find(p => p.endsWith('cubemaps/env_cubemap_array.vtex_c'))
if (!cubePath) {
	console.error(`${vpkPath} ships NO baked cubemap (inspect_melee is like this). Nothing to export.`)
	process.exit(1)
}
const buf = vpk.read(cubePath)
console.error(`${cubePath}: ${buf.length} bytes`)

const t = parseVtex(buf)
if (t.formatName !== 'BC6H') throw new Error('not BC6H: ' + t.formatName)
const faces = 6 * Math.max(1, t.depth)
const dataEnd = t.dataBlock.offset + t.dataBlock.size
// Source 2 stores mips SMALLEST FIRST; each mip holds all faces contiguously.
const perMip = (m: number) => Math.ceil(Math.max(1, t.width >> m) / 4) * Math.ceil(Math.max(1, t.height >> m) / 4) * 16
let total = 0
for (let m = 0; m < t.numMips; m++) total += perMip(m) * faces
if (dataEnd + total !== buf.length) {
	console.error(`WARN size mismatch: dataEnd ${dataEnd} + ${total} != ${buf.length}`)
}
const mip0Off = dataEnd + total - perMip(0) * faces
const faceBytes = perMip(0)
const S = t.width
const faceBufs: number[][] = []
for (let f = 0; f < 6; f++) {
	const o = mip0Off + (sliceArg * 6 + f) * faceBytes
	faceBufs.push([...buf.subarray(o, o + faceBytes)])
}
console.error(`${cubePath}: ${S}x${S} BC6H, ${t.numMips} mips, ${faces} faces, slice ${sliceArg}, mip0@${mip0Off}`)

const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage()
await p.goto('about:blank')
const decoded: number[][] = await p.evaluate(
	({ faceBufs, S }) => {
		const c = document.createElement('canvas')
		c.width = S
		c.height = S
		const gl = c.getContext('webgl2') as WebGL2RenderingContext
		gl.getExtension('EXT_texture_compression_bptc')
		gl.getExtension('EXT_color_buffer_float')
		const COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT = 0x8e8f
		const vs = `#version 300 es
in vec2 a; out vec2 uv; void main(){ uv = a*0.5+0.5; gl_Position = vec4(a,0,1); }`
		const fs = `#version 300 es
precision highp float; uniform sampler2D t; in vec2 uv; out vec4 o;
void main(){ o = vec4(texture(t, vec2(uv.x, 1.0-uv.y)).rgb, 1.0); }`
		const mk = (type: number, s: string) => {
			const sh = gl.createShader(type)!
			gl.shaderSource(sh, s)
			gl.compileShader(sh)
			if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)!)
			return sh
		}
		const pr = gl.createProgram()!
		gl.attachShader(pr, mk(gl.VERTEX_SHADER, vs))
		gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, fs))
		gl.linkProgram(pr)
		if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr)!)
		gl.useProgram(pr)
		const vb = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, vb)
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
		gl.enableVertexAttribArray(0)
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
		const rt = gl.createTexture()
		gl.bindTexture(gl.TEXTURE_2D, rt)
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, S, S)
		const fb = gl.createFramebuffer()
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rt, 0)
		const outFaces: number[][] = []
		for (const fb2 of faceBufs) {
			const tex = gl.createTexture()
			gl.activeTexture(gl.TEXTURE0)
			gl.bindTexture(gl.TEXTURE_2D, tex)
			gl.compressedTexImage2D(gl.TEXTURE_2D, 0, COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT, S, S, 0, new Uint8Array(fb2))
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
			gl.uniform1i(gl.getUniformLocation(pr, 't'), 0)
			gl.viewport(0, 0, S, S)
			gl.drawArrays(gl.TRIANGLES, 0, 3)
			const px = new Float32Array(S * S * 4)
			gl.readPixels(0, 0, S, S, gl.RGBA, gl.FLOAT, px)
			const e = gl.getError()
			if (e) throw new Error('gl error ' + e)
			// readPixels origin is bottom-left; the shader already flipped, so this comes back top-left.
			outFaces.push(Array.from(px))
		}
		return outFaces
	},
	{ faceBufs, S },
)
await b.close()

const face = decoded.map(a => Float32Array.from(a))
const px = (f: number, x: number, y: number) => {
	const i = (Math.min(S - 1, Math.max(0, y)) * S + Math.min(S - 1, Math.max(0, x))) * 4
	return [face[f][i], face[f][i + 1], face[f][i + 2]] as [number, number, number]
}

// GL cube-face direction convention (u,v in [-1,1], v downward in the face image).
function sampleCube(d: [number, number, number]): [number, number, number] {
	const [x, y, z] = d
	const ax = Math.abs(x),
		ay = Math.abs(y),
		az = Math.abs(z)
	let f: number, sc: number, tc: number, ma: number
	if (ax >= ay && ax >= az) {
		if (x > 0) {
			f = 0
			sc = -z
			tc = -y
		} else {
			f = 1
			sc = z
			tc = -y
		}
		ma = ax
	} else if (ay >= az) {
		if (y > 0) {
			f = 2
			sc = x
			tc = z
		} else {
			f = 3
			sc = x
			tc = -z
		}
		ma = ay
	} else {
		if (z > 0) {
			f = 4
			sc = x
			tc = -y
		} else {
			f = 5
			sc = -x
			tc = -y
		}
		ma = az
	}
	const u = ((sc / ma + 1) * S) / 2 - 0.5
	const v = ((tc / ma + 1) * S) / 2 - 0.5
	const x0 = Math.floor(u),
		y0 = Math.floor(v)
	const fx = u - x0,
		fy = v - y0
	const a = px(f, x0, y0),
		bb = px(f, x0 + 1, y0),
		c = px(f, x0, y0 + 1),
		dd = px(f, x0 + 1, y0 + 1)
	const o: [number, number, number] = [0, 0, 0]
	for (let k = 0; k < 3; k++)
		o[k] = a[k] * (1 - fx) * (1 - fy) + bb[k] * fx * (1 - fy) + c[k] * (1 - fx) * fy + dd[k] * fx * fy
	return o
}

// Source 2 world is Z-up; three is Y-up. three = (s2.x, s2.z, -s2.y) keeps handedness.
// The cube faces are indexed in the *source* (Z-up) space, so map the three-space
// sample direction back to Source 2 before picking a face.
const toS2 = (d: [number, number, number]): [number, number, number] => [d[0], -d[2], d[1]]

const eq = new Float32Array(W * H * 3)
for (let j = 0; j < H; j++) {
	const el = (0.5 - (j + 0.5) / H) * Math.PI
	const sy = Math.sin(el),
		r = Math.cos(el)
	for (let i = 0; i < W; i++) {
		const phi = ((i + 0.5) / W - 0.5) * 2 * Math.PI
		const d: [number, number, number] = [r * Math.cos(phi), sy, r * Math.sin(phi)]
		const c = sampleCube(toS2(d))
		const o = (j * W + i) * 3
		eq[o] = c[0]
		eq[o + 1] = c[1]
		eq[o + 2] = c[2]
	}
}

// stats
let sw = 0,
	sr = 0,
	sg = 0,
	sb = 0
for (let j = 0; j < H; j++) {
	const el = (0.5 - (j + 0.5) / H) * Math.PI
	const w = Math.cos(el)
	for (let i = 0; i < W; i++) {
		const o = (j * W + i) * 3
		sw += w
		sr += eq[o] * w
		sg += eq[o + 1] * w
		sb += eq[o + 2] * w
	}
}
const meanRGB: [number, number, number] = [sr / sw, sg / sw, sb / sw]
// SELF-CHECK. The vtex resource carries its own average colour in `reflectivity`. If the BC6H
// decode, the mip0 offset, the face order or the solid-angle weighting were wrong these two would
// not agree — they agree to <0.5% on every map tried, which is what makes this decode trustworthy
// without a reference decoder to diff against.
console.error(
	`solid-angle mean RGB ${meanRGB.map(v => v.toFixed(4)).join(' ')}  ` +
		`(vtex reflectivity ${t.reflectivity
			.slice(0, 3)
			.map(v => v.toFixed(4))
			.join(' ')})`,
)

// One global LUMINANCE gain, if asked. Deliberately not per-channel: leaving the map's own white
// point alone is what keeps an environment swap a change to DIRECTIONALITY only, which is the one
// variable the swap is meant to test.
if (targetMean > 0) {
	const meanL = 0.2126 * meanRGB[0] + 0.7152 * meanRGB[1] + 0.0722 * meanRGB[2]
	const gain = targetMean / meanL
	console.error(`mean luminance ${meanL.toFixed(4)} -> x${gain.toFixed(4)} -> ${targetMean}`)
	for (let i = 0; i < eq.length; i++) eq[i] *= gain
}

writeFileSync(out, encodeHDR(eq, W, H))
console.error('wrote', out)

function encodeHDR(data: Float32Array, w: number, h: number) {
	const header = Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${h} +X ${w}\n`, 'latin1')
	const body = Buffer.alloc(w * h * 4)
	for (let i = 0; i < w * h; i++) {
		let r = data[i * 3],
			g = data[i * 3 + 1],
			bl = data[i * 3 + 2]
		r = Math.max(0, r)
		g = Math.max(0, g)
		bl = Math.max(0, bl)
		const m = Math.max(r, g, bl)
		if (m < 1e-32) {
			body[i * 4] = 0
			body[i * 4 + 1] = 0
			body[i * 4 + 2] = 0
			body[i * 4 + 3] = 0
			continue
		}
		const e = Math.ceil(Math.log2(m))
		const s = 2 ** -e * 256
		body[i * 4] = Math.min(255, Math.floor(r * s))
		body[i * 4 + 1] = Math.min(255, Math.floor(g * s))
		body[i * 4 + 2] = Math.min(255, Math.floor(bl * s))
		body[i * 4 + 3] = e + 128
	}
	return Buffer.concat([header, body])
}
