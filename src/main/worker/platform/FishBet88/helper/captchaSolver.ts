import { decode } from 'jpeg-js'

import { DIGIT_TEMPLATES_BASE64 } from '@/worker/platform/FishBet88/helper/captchaTemplates'

/**
 * Template-matching solver for the FishBet88 captcha.
 *
 * The captcha is always an 80x30 image with 4 digits in one fixed font, drawn at fixed positions
 * and crossed by thin random lines. So instead of a general OCR engine we crop each digit cell and
 * pick the digit whose average image (see captchaTemplates.ts) is closest (L1 distance).
 * The thin lines only add a little noise to that distance; leave-one-out on 75 labelled captchas
 * read 75/75 correctly.
 */

const IMAGE_WIDTH = 80
const IMAGE_HEIGHT = 30

/** Left edge of each digit as drawn by the site. */
const DIGIT_X = [6, 25, 44, 64]
/** Cell cropped around each digit (a small margin around the ~10x15 glyph). */
const CELL = { offsetX: -2, offsetY: 4, width: 14, height: 19 }
/** Also try the cell shifted by up to this many pixels, in case the site adds jitter. */
const MAX_SHIFT = 1
/** A cell with less total ink than this has no digit in it: the captcha format changed. */
const MIN_CELL_INK = CELL.width * CELL.height * 20

const TEMPLATES = Object.entries(DIGIT_TEMPLATES_BASE64).map(([digit, base64]) => ({
  digit,
  pixels: Uint8Array.from(Buffer.from(base64, 'base64'))
}))

function toBuffer(image: Buffer | string) {
  if (Buffer.isBuffer(image)) return image
  const base64 = image.startsWith('data:') ? image.slice(image.indexOf(',') + 1) : image
  return Buffer.from(base64, 'base64')
}

const isJpeg = (image: Buffer) => image.length > 3 && image[0] === 0xff && image[1] === 0xd8

/**
 * Ink map of the image: 255 - min(R, G, B), so coloured and black strokes both count as ink.
 * Returns null when the image is not an 80x30 JPEG (the known captcha format).
 */
function readInk(image: Buffer) {
  if (!isJpeg(image)) return null

  // Pure-JS decoder (no native binaries); the limits only guard against a bogus huge image.
  const { width, height, data } = decode(image, {
    useTArray: true,
    formatAsRGBA: true,
    maxResolutionInMP: 1,
    maxMemoryUsageInMB: 16
  })
  if (width !== IMAGE_WIDTH || height !== IMAGE_HEIGHT) return null

  const ink = new Uint8Array(IMAGE_WIDTH * IMAGE_HEIGHT)
  for (let i = 0; i < ink.length; i++) {
    const p = i * 4
    ink[i] = 255 - Math.min(data[p], data[p + 1], data[p + 2])
  }
  return ink
}

function inkAt(ink: Uint8Array, x: number, y: number) {
  return x < 0 || y < 0 || x >= IMAGE_WIDTH || y >= IMAGE_HEIGHT ? 0 : ink[y * IMAGE_WIDTH + x]
}

/** L1 distance between the template and the cell whose top-left corner is (left, top). */
function distance(ink: Uint8Array, template: Uint8Array, left: number, top: number) {
  let sum = 0
  for (let y = 0; y < CELL.height; y++) {
    for (let x = 0; x < CELL.width; x++) {
      sum += Math.abs(inkAt(ink, left + x, top + y) - template[y * CELL.width + x])
    }
  }
  return sum
}

function cellInk(ink: Uint8Array, left: number, top: number) {
  let sum = 0
  for (let y = 0; y < CELL.height; y++) {
    for (let x = 0; x < CELL.width; x++) sum += inkAt(ink, left + x, top + y)
  }
  return sum
}

function readDigit(ink: Uint8Array, digitX: number) {
  const left = digitX + CELL.offsetX
  const top = CELL.offsetY
  if (cellInk(ink, left, top) < MIN_CELL_INK) return null

  let best: string | null = null
  let bestDistance = Infinity

  for (const { digit, pixels } of TEMPLATES) {
    for (let dy = -MAX_SHIFT; dy <= MAX_SHIFT; dy++) {
      for (let dx = -MAX_SHIFT; dx <= MAX_SHIFT; dx++) {
        const d = distance(ink, pixels, left + dx, top + dy)
        if (d < bestDistance) {
          bestDistance = d
          best = digit
        }
      }
    }
  }

  return best
}

/**
 * Reads the 4 captcha digits. `image` is a Buffer, a base64 string or a data URL.
 * Returns null when the image does not look like the known captcha format (not an 80x30 JPEG,
 * or an empty digit cell); the caller should then fall back to manual input.
 * Throws only on a corrupt JPEG.
 */
export function recognizeCaptcha(image: Buffer | string): string | null {
  const ink = readInk(toBuffer(image))
  if (!ink) return null

  let captcha = ''
  for (const digitX of DIGIT_X) {
    const digit = readDigit(ink, digitX)
    if (digit === null) return null
    captcha += digit
  }
  return captcha
}
