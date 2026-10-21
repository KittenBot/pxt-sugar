namespace Sugar {
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
        if (leds == null) return ""
        const data = pins.createBuffer(128)
        let pixel = 0
        for (let i = 0; i < leds.length; i++) {
            const ch = leds.charAt(i)
            if (ch == " " || ch == "\t" || ch == "\r" || ch == "\n") continue
            if (pixel >= 1024 || (ch != "#" && ch != ".")) return ""
            if (ch == "#") data[pixel >> 3] |= 0x80 >> (pixel & 7)
            pixel++
        }
        if (pixel != 1024) return ""
        return data.toHex()
    }
}
