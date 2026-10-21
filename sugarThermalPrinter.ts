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
     * Print packed 32x32 MSB-first bits at their original size, centered.
     * The existing FutureBoard Lite Sugar driver uses command 0x04 with a
     * UInt16LE heating time followed by 48-byte rows, at most 16 rows per batch.
     * Always wait between batches so the printer can finish before more data arrives.
     */
    printBits(bitmap: Buffer): string {
        if (bitmap == null || bitmap.length != 128) control.panic(909)
        const heat = this.checkRange(this.heatUs, 0, 65535)
        let response = ""

        while (serial.readString().length) { }
        this.sendFrame(0x06, Buffer.fromArray([0x01]))
        for (let startRow = 0; startRow < 32; startRow += 16) {
            const payload = pins.createBuffer(2 + 48 * 16)
            payload.setNumber(NumberFormat.UInt16LE, 0, heat)
            for (let row = 0; row < 16; row++) {
                for (let columnByte = 0; columnByte < 4; columnByte++) {
                    // Center 32 pixels in a 384-pixel row: 176 blank pixels
                    // (22 bytes) on each side, with no pixel scaling.
                    payload[2 + row * 48 + 22 + columnByte] = bitmap[(startRow + row) * 4 + columnByte]
                }
            }
            this.sendFrame(0x04, payload)
            const part = this.readResponse(3000 + 16 * 1000)
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
