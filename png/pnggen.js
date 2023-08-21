const fs = require("fs");
const zlib = require("zlib");
const CRC32 = require("crc-32");

// File Signature
const PNG_SIGNATURE = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

// IHDR Chunk Type
const IHDR_CHUNK_TYPE = [0x49, 0x48, 0x44, 0x52];
const IHDR_LENGTH = 13;

// IDAT Chunk Type
const IDAT_CHUNK_TYPE = [0x49, 0x44, 0x41, 0x54];

// IEND Chunk Type
const IEND_CHUNK_TYPE = [0x49, 0x45, 0x4e, 0x44];

// IEND Chunk
const IEND = createChunk(0, IEND_CHUNK_TYPE);

function generateSquareImage(width, height) {
  // Create Pixel Data Buffer
  const pixelData = new Uint32Array(width * height);
  const xBound = width / 4;
  const yBound = height / 4;

  // Populate Pixel Data Buffer
  for (let i = 0; i < pixelData.length; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    if (x < width - xBound && x > xBound && y < height - yBound && y > yBound) {
      pixelData[i] = 0xff0000ff;
    } else pixelData[i] = 0xffffffff;
  }

  // Compress Pixel Data
  zlib.deflate(pixelData, (err, result) => {
    if (err) {
      console.error(err);
      return;
    }

    // Generate IHDR Chunk
    const IHDR = createChunk(
      IHDR_LENGTH,
      IHDR_CHUNK_TYPE,
      createIHDRData(width, height, 8, 6, 0, 0, 0)
    );

    // Generate IDAT Chunk
    const IDAT = createChunk(result.length, IDAT_CHUNK_TYPE, result);

    // Write PNG to file
    fs.writeFileSync(
      "auto.png",
      new Uint8Array([...PNG_SIGNATURE, ...IHDR, ...IDAT, ...IEND]),
      "binary"
    );
  });
}

function createIHDRData(
  width,
  height,
  bitDepth,
  colorType,
  compression,
  filter,
  interlace
) {
  const width32 = new Uint8Array(toBytesInt32(width));
  const height32 = new Uint8Array(toBytesInt32(height));
  const bitDepth8 = new Uint8Array(toByteInt8(bitDepth));
  const colorType8 = new Uint8Array(toByteInt8(colorType));
  const compression8 = new Uint8Array(toByteInt8(compression));
  const filter8 = new Uint8Array(toByteInt8(filter));
  const interlace8 = new Uint8Array(toByteInt8(interlace));

  return new Uint8Array([
    ...width32,
    ...height32,
    ...bitDepth8,
    ...colorType8,
    ...compression8,
    ...filter8,
    ...interlace8,
  ]);
}

function createChunk(dataLength, chunkTypeBuffer, dataBuffer = []) {
  const length = new Uint8Array(toBytesInt32(dataLength));
  const chunkType = new Uint8Array(chunkTypeBuffer);
  const crc = new Uint8Array(
    toBytesInt32(CRC32.buf([...chunkType, ...dataBuffer]))
  );
  return new Uint8Array([...length, ...chunkType, ...dataBuffer, ...crc]);
}

// Helper Functions

function toBytesInt32(num) {
  arr = new ArrayBuffer(4);
  view = new DataView(arr);
  view.setUint32(0, num, false);
  return arr;
}

function toByteInt8(num) {
  arr = new ArrayBuffer(1);
  view = new DataView(arr);
  view.setUint8(0, num);
  return arr;
}

generateSquareImage(128, 128);
