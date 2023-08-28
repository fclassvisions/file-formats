const fs = require("fs");

const FILE_HEADER = "BM";
const DIB_SIZE = 40; // BITMAPINFOHEADER is 40 bytes long
const PIXEL_DATA_OFFSET = 14 + DIB_SIZE; // 14 byte file header + 40 byte DIB header
const OUTPUT_FILE_NAME = "auto.bmp";

// Main function for generating a square image
function generateSquareBmp(width, height, bitsPerPixel) {
  // Get the bytes for the file header
  const fileHeaderBytes = createFileHeader(PIXEL_DATA_OFFSET + width * height);

  // Get the bytes for the DIB header
  const DIBHeader = createDIBInfoHeader(width, height, bitsPerPixel);

  // Get the bytes for the pixel data
  const pixelData = createPixelArray(width, height);

  // Write the all the bytes to disk
  fs.writeFileSync(
    OUTPUT_FILE_NAME,
    new Uint8Array([...fileHeaderBytes, ...DIBHeader, ...pixelData]),
    "binary"
  );
}

function createFileHeader(fileSize) {
  return new Uint8Array([
    ...new Uint8Array(stringToCharCode(FILE_HEADER)), // File Header Bytes
    /**
     * Reverse the array because BMP uses little endian
     * https://www.baeldung.com/cs/big-endian-vs-little-endian
     */
    ...new Uint8Array(toBytesInt32(fileSize)).reverse(), // File Size Bytes
    ...new Uint8Array(toBytesInt16(0)), // Reserved Bytes
    ...new Uint8Array(toBytesInt16(0)), // Reserved Bytes
    ...new Uint8Array(toBytesInt32(PIXEL_DATA_OFFSET)).reverse(), // Pixel Offset Bytes
  ]);
}

function createDIBInfoHeader(bitmapWidth, bitmapHeight, bitsPerPixel) {
  return new Uint8Array([
    ...new Uint8Array(toBytesInt32(DIB_SIZE)).reverse(), // the size of this header, in bytes (40)
    ...new Int8Array(toBytesInt32(bitmapWidth)).reverse(), // Width of the bitmap in pixels
    ...new Int8Array(toBytesInt32(bitmapHeight)).reverse(), // Height of the bitmap in pixels
    ...new Uint8Array(toBytesInt16(1)).reverse(), // Number of color planes being used (must be 1)
    ...new Uint8Array(toBytesInt16(bitsPerPixel)).reverse(), // Number of bits per pixel
    ...new Uint8Array(toBytesInt32(0)), // BI_RGB, no pixel array compression used
    ...new Uint8Array(toBytesInt32(bitmapWidth * bitmapHeight)).reverse(), // Size of the raw bitmap data (including padding)
    ...new Int8Array(toBytesInt32(2835)).reverse(), // Print resolution of the image (width)
    ...new Int8Array(toBytesInt32(2835)).reverse(), // Print resolution of the image (height)
    ...new Uint8Array(toBytesInt32(0)), // Number of colors in the palette (0 is all colors available in bit range)
    ...new Uint8Array(toBytesInt32(0)), // Number of important colors (0 means all colors are important)
  ]);
}

function createPixelArray(width, height) {
  // Create Pixel Data Buffer
  const pixelData = new Uint32Array(width * height);
  const xBound = width / 4;
  const yBound = height / 4;

  //   // Populate Pixel Data Buffer
  for (let i = 0; i < pixelData.length; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    if (
      x < width - xBound &&
      x >= xBound &&
      y < height - yBound &&
      y >= yBound
    ) {
      /** If you change the bits per pixel (bpp) to something other than 32
       *  make sure you are following the padding rules. The length of each
       *  row must be rounded up to a multiple of 4 bytes by padding.
       */
      pixelData[i] = 0xff0000ff;
    } else pixelData[i] = 0xffffffff;
  }

  return new Uint8Array(pixelData.buffer);
}

// Helper Functions

function toBytesInt32(num) {
  arr = new ArrayBuffer(4);
  view = new DataView(arr);
  view.setUint32(0, num, false);
  return arr;
}

function toBytesInt16(num) {
  arr = new ArrayBuffer(2);
  view = new DataView(arr);
  view.setUint16(0, num, false);
  return arr;
}

function stringToCharCode([...string]) {
  const array = string.map((char) => {
    return char.charCodeAt(0);
  });
  // array of unicode values
  return array;
}

generateSquareBmp(128, 128, 32);
