namespace Sugar {
    function packBitmap(text: string, expectedPixels: number): Buffer {
        if (text == null) return pins.createBuffer(0)
        let count = 0
        for (let i = 0; i < text.length; i++) {
            const ch = text.charAt(i)
            if (ch == " " || ch == "\t" || ch == "\r" || ch == "\n") continue
            if (ch != "#" && ch != ".") return pins.createBuffer(0)
            count++
        }
        if (expectedPixels > 0 && count != expectedPixels) return pins.createBuffer(0)

        const data = pins.createBuffer(Math.ceil(count / 8))
        let pixel = 0
        for (let i = 0; i < text.length; i++) {
            const ch = text.charAt(i)
            if (ch == "#" || ch == ".") {
                if (ch == "#") data[pixel >> 3] |= 0x80 >> (pixel & 7)
                pixel++
            }
        }
        return data
    }

    /**
     * Convert #/. bitmap text into packed bytes at runtime (#=1, .=0).
     * Spaces, tabs and line endings are ignored. Bits are packed MSB first.
     * Rows are concatenated; only the last byte is padded with zero bits.
     * Empty input or an invalid character returns an empty buffer.
     */
    export function str2bits(text: string): Buffer {
        return packBitmap(text, 0)
    }

    /**
     * Draw 32x32 pixels and print them as a centered 256x256 image (8x scale).
     * Waits for completion, stopping on a printer error or response timeout.
     */
    //% blockId=thermalPrinterPrintBitmap32x32 block="thermal printer print 32x32 bitmap enlarged to 256x256"
    //% gridLiteral=1 imageLiteralColumns=32 imageLiteralRows=32 imageLiteralScale=0.6
    //% subcategory=Advanced group="Thermal Printer" weight=57 color=#499AF7
    export function thermalPrinterPrintBitmap32x32(leds: string): void {
        thermalPrinterPrintBits(packBitmap(leds, 1024))
    }

    /**
     * Pack a 32x32 monochrome grid into 128 bytes, returned as 256 HEX characters.
     * Rows run top to bottom; pixels run left to right, most significant bit first.
     * A selected pixel is 1. Each row occupies four bytes, with no header.
     * This experiment returns data at runtime; it does not rewrite source code.
     */
    //% blockId=sugarBitmap32x32ToBits block="32x32 bitmap to bits (HEX)"
    //% gridLiteral=1 imageLiteralColumns=32 imageLiteralRows=32 imageLiteralScale=0.6
    //% subcategory=Advanced group="Bitmap Experiment" weight=54 color=#499AF7
    export function bitmap32x32ToBits(leds: string): string {
        return packBitmap(leds, 1024).toHex()
    }
}
