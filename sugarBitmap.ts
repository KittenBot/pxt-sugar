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
}
