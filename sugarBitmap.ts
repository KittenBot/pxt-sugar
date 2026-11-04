/**
 * A monochrome bitmap literal. MakeCode packs it as a static 1-bit buffer:
 * 0/. are paper; all other supported pixel symbols are black ink.
 * The built-in sprite editor still uses its usual 0-f pixel symbols.
 */
//% shim=@f4 blockIdentity="Sugar.thermalPrinterBitmap"
//% groups=["0.","123456789abcdefABCDEF#"]
function bmp(lits: any, ...args: any[]): Buffer { return null }

namespace Sugar {
    /**
     * Edit a black and white bitmap. Erase to leave white paper.
     */
    //% blockId=thermalPrinterBitmap block="black and white bitmap %bitmap" shim=TD_ID
    //% bitmap.fieldEditor="sprite" bitmap.fieldOptions.taggedTemplate="bmp"
    //% bitmap.fieldOptions.decompileArgumentAsString="true"
    //% bitmap.fieldOptions.initColor=15 bitmap.fieldOptions.initWidth=32 bitmap.fieldOptions.initHeight=32
    //% blockSetVariable=picture
    //% subcategory=Advanced group="Thermal Printer" weight=59 color=#499AF7
    export function thermalPrinterBitmap(bitmap: Buffer): Buffer {
        return bitmap
    }

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
     * Draw 32x32 pixels and print them at their original size, centered.
     * Waits for completion, stopping on a printer error or response timeout.
     */
    //% blockId=thermalPrinterPrintBitmap32x32 block="thermal printer print 32x32 bitmap"
    //% gridLiteral=1 imageLiteralColumns=32 imageLiteralRows=32 imageLiteralScale=0.6
    //% subcategory=Advanced group="Thermal Printer" weight=57 color=#499AF7
    export function thermalPrinterPrintBitmap32x32(leds: string): void {
        thermalPrinterPrintBits(packBitmap(leds, 1024))
    }
}
