
// モジュールに依存しない純粋なハッシュ関数群
// - `djb2` : シンプルな文字列ハッシュ（非暗号）
// - `fnv1a32` : FNV-1a 32-bit
// - `crc32` : CRC32
// - `murmurHash3_32` : MurmurHash3 x86 32-bit

const encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

function toBytes(str: string): Uint8Array {
	if (encoder) return encoder.encode(str);
	// フォールバック（簡易）: UTF-8 変換
	const bytes: number[] = [];
	for (let i = 0; i < str.length; i++) {
		let code = str.charCodeAt(i);
		if (code < 0x80) bytes.push(code);
		else if (code < 0x800) {
			bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
		} else if (code >= 0xd800 && code <= 0xdbff) {
			// surrogate pair
			const high = code;
			const low = str.charCodeAt(++i);
			const full = 0x10000 + ((high - 0xd800) << 10) + (low - 0xdc00);
			bytes.push(0xf0 | (full >> 18), 0x80 | ((full >> 12) & 0x3f), 0x80 | ((full >> 6) & 0x3f), 0x80 | (full & 0x3f));
		} else {
			bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
		}
	}
	return new Uint8Array(bytes);
}

export function toHex32(n: number) {
	return (n >>> 0).toString(16).padStart(8, "0");
}

export function djb2(input: string): number {
	let hash = 5381;
	const bytes = toBytes(input);
	for (let i = 0; i < bytes.length; i++) {
		// (hash * 33) + c
		hash = ((hash << 5) + hash + bytes[i]) | 0;
	}
	return hash >>> 0;
}

export function fnv1a32(input: string): number {
	const bytes = toBytes(input);
	let h = 0x811c9dc5 >>> 0; // 2166136261
	for (let i = 0; i < bytes.length; i++) {
		h ^= bytes[i];
		h = Math.imul(h, 0x01000193) >>> 0; // 16777619
	}
	return h >>> 0;
}

// CRC32 テーブルを一度だけ作る
const CRC32_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let c = i;
		for (let j = 0; j < 8; j++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table[i] = c >>> 0;
	}
	return table;
})();

export function crc32(input: string): number {
	const bytes = toBytes(input);
	let crc = 0xffffffff >>> 0;
	for (let i = 0; i < bytes.length; i++) {
		const b = bytes[i];
		crc = (CRC32_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8)) >>> 0;
	}
	return (crc ^ 0xffffffff) >>> 0;
}

// MurmurHash3 x86_32 実装（シード可）
export function murmurHash3_32(key: string, seed = 0): number {
	const data = toBytes(key);
	const length = data.length;
	let h1 = seed >>> 0;
	const c1 = 0xcc9e2d51 >>> 0;
	const c2 = 0x1b873593 >>> 0;

	let i = 0;
	while (i + 4 <= length) {
		let k1 = (data[i] & 0xff) | ((data[i + 1] & 0xff) << 8) | ((data[i + 2] & 0xff) << 16) | ((data[i + 3] & 0xff) << 24);
		i += 4;

		k1 = Math.imul(k1, c1) >>> 0;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = Math.imul(k1, c2) >>> 0;

		h1 ^= k1;
		h1 = (h1 << 13) | (h1 >>> 19);
		h1 = (Math.imul(h1, 5) + 0xe6546b64) >>> 0;
	}

	let k1 = 0;
	switch (length & 3) {
		case 3:
			k1 ^= (data[i + 2] & 0xff) << 16;
		case 2:
			k1 ^= (data[i + 1] & 0xff) << 8;
		case 1:
			k1 ^= data[i] & 0xff;
			k1 = Math.imul(k1, c1) >>> 0;
			k1 = (k1 << 15) | (k1 >>> 17);
			k1 = Math.imul(k1, c2) >>> 0;
			h1 ^= k1;
	}

	h1 ^= length;
	// fmix32
	h1 ^= h1 >>> 16;
	h1 = Math.imul(h1, 0x85ebca6b) >>> 0;
	h1 ^= h1 >>> 13;
	h1 = Math.imul(h1, 0xc2b2ae35) >>> 0;
	h1 ^= h1 >>> 16;

	return h1 >>> 0;
}

export default {
	djb2,
	fnv1a32,
	crc32,
	murmurHash3_32,
	toHex32,
};

// --- SHA-256 実装（純粋JS） ----------------------------------
function ROTR(n: number, x: number) {
	return (x >>> n) | (x << (32 - n));
}

function Sigma0(x: number) {
	return ROTR(2, x) ^ ROTR(13, x) ^ ROTR(22, x);
}

function Sigma1(x: number) {
	return ROTR(6, x) ^ ROTR(11, x) ^ ROTR(25, x);
}

function sigma0(x: number) {
	return ROTR(7, x) ^ ROTR(18, x) ^ (x >>> 3);
}

function sigma1(x: number) {
	return ROTR(17, x) ^ ROTR(19, x) ^ (x >>> 10);
}

const K256 = new Uint32Array([
	0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
	0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
	0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
	0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
	0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
	0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
	0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
	0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
]);

export function sha256(message: string): string {
	const msg = toBytes(message);
	const bitLen = msg.length * 8;

	// pad
	const padLen = ((56 - (msg.length + 1) % 64) + 64) % 64;
	const total = msg.length + 1 + padLen + 8;
	const buf = new Uint8Array(total);
	buf.set(msg, 0);
	buf[msg.length] = 0x80;
	// big-endian length
	for (let i = 0; i < 8; i++) {
		buf[buf.length - 1 - i] = (bitLen >>> (8 * i)) & 0xff;
	}

	// initial hash values
	const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);

	const w = new Uint32Array(64);

	for (let offset = 0; offset < buf.length; offset += 64) {
		// message schedule
		for (let t = 0; t < 16; t++) {
			const i = offset + t * 4;
			w[t] = ((buf[i] << 24) | (buf[i + 1] << 16) | (buf[i + 2] << 8) | (buf[i + 3])) >>> 0;
		}
		for (let t = 16; t < 64; t++) {
			const s0 = sigma0(w[t - 15]);
			const s1 = sigma1(w[t - 2]);
			w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
		}

		let a = H[0] >>> 0;
		let b = H[1] >>> 0;
		let c = H[2] >>> 0;
		let d = H[3] >>> 0;
		let e = H[4] >>> 0;
		let f = H[5] >>> 0;
		let g = H[6] >>> 0;
		let h = H[7] >>> 0;

		for (let t = 0; t < 64; t++) {
			const S1 = Sigma1(e);
			const ch = (e & f) ^ (~e & g);
			const temp1 = (h + S1 + ch + K256[t] + w[t]) >>> 0;
			const S0 = Sigma0(a);
			const maj = (a & b) ^ (a & c) ^ (b & c);
			const temp2 = (S0 + maj) >>> 0;

			h = g;
			g = f;
			f = e;
			e = (d + temp1) >>> 0;
			d = c;
			c = b;
			b = a;
			a = (temp1 + temp2) >>> 0;
		}

		H[0] = (H[0] + a) >>> 0;
		H[1] = (H[1] + b) >>> 0;
		H[2] = (H[2] + c) >>> 0;
		H[3] = (H[3] + d) >>> 0;
		H[4] = (H[4] + e) >>> 0;
		H[5] = (H[5] + f) >>> 0;
		H[6] = (H[6] + g) >>> 0;
		H[7] = (H[7] + h) >>> 0;
	}

	// hex
	let hex = "";
	for (let i = 0; i < H.length; i++) {
		hex += H[i].toString(16).padStart(8, "0");
	}
	return hex;
}

