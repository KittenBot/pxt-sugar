/**
 * Sugar thermal printer UART protocol, ported from sugar_thermal_printer.py.
 * Uses the shared micro:bit serial port.
 */
class SugarThermalPrinter {
    heatUs: number;
    lineGap: number;
    lineHeight: number;

    constructor(tx: SerialPin = SerialPin.P0, rx: SerialPin = SerialPin.P1,
        baudrate: BaudRate = BaudRate.BaudRate115200, heatUs: number = 3000,
        lineGap: number = 8, lineHeight: number = 24) {
        this.configure(heatUs, lineGap, lineHeight)
        serial.setRxBufferSize(128)
        serial.redirect(tx, rx, baudrate)
    }

    private integer(value: number): number {
        // Reject NaN and infinities before converting, as Python int() does.
        if (value - value != 0) control.panic(909)
        return value < 0 ? Math.ceil(value) : Math.floor(value)
    }

    private checkRange(value: number, minimum: number, maximum: number): number {
        value = this.integer(value)
        if (value < minimum || value > maximum) control.panic(909)
        return value
    }

    configure(heatUs: number = 3000, lineGap: number = 8, lineHeight: number = 24): void {
        heatUs = this.checkRange(heatUs, 0, 65535)
        lineGap = this.checkRange(lineGap, 0, 64)
        lineHeight = this.integer(lineHeight)
        if (lineHeight <= 0) control.panic(909)
        this.heatUs = heatUs
        this.lineGap = lineGap
        this.lineHeight = lineHeight
    }

    private sendFrame(command: number, payload: Buffer): void {
        const length = payload.length
        if (length > 48 * 64) control.panic(909)
        const frame = pins.createBuffer(length + 6)
        frame[0] = 0xA5
        frame[1] = 0x5A
        frame[2] = command
        frame[3] = length & 0xFF
        frame[4] = (length >> 8) & 0xFF
        let checksum = command + frame[3] + frame[4]
        for (let i = 0; i < length; i++) {
            frame[5 + i] = payload[i]
            checksum += payload[i]
        }
        frame[length + 5] = checksum & 0xFF
        // PXT writeBuffer sends the entire buffer and does not return a count.
        serial.writeBuffer(frame)
    }

    private readResponse(timeoutMs: number): string {
        const start = input.runningTime()
        let response = ""
        while (input.runningTime() - start < timeoutMs) {
            // readString is nonblocking; readBuffer with a positive size is not.
            const chunk = serial.readString()
            if (chunk.length) {
                response += chunk
                if (response.indexOf("DONE") >= 0 || response.indexOf("ERR") >= 0) break
            } else {
                basic.pause(5)
            }
        }
        return response
    }

    private run(command: number, payload: Buffer, wait: boolean, timeoutMs: number): string {
        while (serial.readString().length) { }
        this.sendFrame(0x06, Buffer.fromArray([0x01]))
        this.sendFrame(command, payload)
        const response = wait ? this.readResponse(timeoutMs) : ""
        // Keep the original power-off sequence, including when wait is false.
        this.sendFrame(0x07, pins.createBuffer(0))
        return response
    }

    feed(pixels: number = 24, wait: boolean = true): string {
        pixels = this.integer(pixels)
        if (pixels < 0) control.panic(909)
        let response = ""
        while (pixels > 0) {
            const part = Math.min(pixels, 16383)
            const payload = pins.createBuffer(2)
            payload.setNumber(NumberFormat.UInt16LE, 0, part * 2)
            response += this.run(0x01, payload, wait, 1000 + part * 10)
            pixels -= part
        }
        return response
    }

    newline(count: number = 1, scale: number = 1, wait: boolean = true): string {
        count = this.integer(count)
        if (count < 0) control.panic(909)
        scale = this.checkRange(scale, 1, 4)
        return this.feed(count * (this.lineHeight * scale + this.lineGap), wait)
    }

    /**
     * Decode MakeCode's 1-bit bitmap literal: 8-byte header, then columns of
     * LSB-first vertical pixels. Convert to the printer's MSB-first rows.
     */
    printBitmapData(image: Buffer): string {
        if (image == null || image.length < 8 || image[0] != 0x87 || image[1] != 1) control.panic(909)
        const width = image.getNumber(NumberFormat.UInt16LE, 2)
        const height = image.getNumber(NumberFormat.UInt16LE, 4)
        this.checkRange(width, 1, 384)
        if (height < 1) control.panic(909)
        const columnBytes = Math.ceil(height / 8)
        if (image.length != 8 + width * columnBytes) control.panic(909)
        const rowBytes = Math.ceil(width / 8)
        const bitmap = pins.createBuffer(rowBytes * height)
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (image[8 + x * columnBytes + (y >> 3)] & (1 << (y & 7))) {
                    bitmap[y * rowBytes + (x >> 3)] |= 0x80 >> (x & 7)
                }
            }
        }
        return this.printBitmap(bitmap, width)
    }

    private printBitmap(bitmap: Buffer, width: number): string {
        if (bitmap.length == 0) return ""
        const bytesPerRow = Math.ceil(width / 8)
        const height = Math.ceil(bitmap.length / bytesPerRow)
        const left = Math.floor((384 - width) / 2)
        const heat = this.checkRange(this.heatUs, 0, 65535)
        let response = ""

        while (serial.readString().length) { }
        this.sendFrame(0x06, Buffer.fromArray([0x01]))
        for (let startRow = 0; startRow < height; startRow += 16) {
            const rows = Math.min(16, height - startRow)
            const payload = pins.createBuffer(2 + 48 * rows)
            payload.setNumber(NumberFormat.UInt16LE, 0, heat)
            for (let row = 0; row < rows; row++) {
                const sourceRow = (startRow + row) * bytesPerRow
                for (let column = 0; column < width; column++) {
                    const sourceByte = sourceRow + (column >> 3)
                    if (sourceByte < bitmap.length && (bitmap[sourceByte] & (0x80 >> (column & 7)))) {
                        const pixel = left + column
                        payload[2 + row * 48 + (pixel >> 3)] |= 0x80 >> (pixel & 7)
                    }
                }
            }
            this.sendFrame(0x04, payload)
            const part = this.readResponse(3000 + rows * 1000)
            response += part
            if (part.indexOf("ERR") >= 0) break
            if (part.indexOf("DONE") < 0) {
                response += "ERR bitmap timeout"
                break
            }
        }
        this.sendFrame(0x07, pins.createBuffer(0))
        return response
    }

    printText(text: string, align: Sugar.ThermalPrinterAlign = Sugar.ThermalPrinterAlign.Left,
        scale: number = 1, lineGap?: number,
        heatUs?: number, wait: boolean = true): string {
        if (align != 0 && align != 1 && align != 2) control.panic(909)
        scale = this.checkRange(scale, 1, 4)
        const gap = this.checkRange(lineGap == null ? this.lineGap : lineGap, 0, 64)
        const heat = this.checkRange(heatUs == null ? this.heatUs : heatUs, 0, 65535)
        if (text == null) control.panic(909)

        // Normalize CRLF and CR without relying on JavaScript RegExp support.
        const lines = text.split("\r\n").join("\n").split("\r").join("\n").split("\n")
        let response = ""
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index]
            if (line.length) {
                const encoded = Buffer.fromUTF8(line)
                if (encoded.length + 7 > 48 * 64) control.panic(909)
                const payload = pins.createBuffer(encoded.length + 7)
                payload.setNumber(NumberFormat.UInt16LE, 0, heat)
                payload[2] = 0xFD
                payload[3] = scale
                payload[4] = align
                payload.setNumber(NumberFormat.UInt16LE, 5, gap * 2)
                for (let i = 0; i < encoded.length; i++) payload[7 + i] = encoded[i]
                response += this.run(0x03, payload, wait, 3000 + encoded.length * 50)
            } else if (index < lines.length - 1) {
                response += this.feed(this.lineHeight * scale + gap, wait)
            }
        }
        return response
    }
}
