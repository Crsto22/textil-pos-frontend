/**
 * Generates a 13-digit numeric barcode string starting with "775".
 *
 * Uses `crypto.getRandomValues` for better randomness than `Math.random`.
 */
export function generateBarcode(): string {
  const prefix = "775"
  const remainingDigits = 13 - prefix.length
  const array = new Uint8Array(remainingDigits)
  crypto.getRandomValues(array)

  let code = prefix
  for (let i = 0; i < remainingDigits; i++) {
    code += (array[i] % 10).toString()
  }

  return code
}
