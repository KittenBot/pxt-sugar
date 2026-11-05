/**
 * Serial bus encoder motor protocol, ported from encoderMotor.py 1.3.0.
 * Replies arrive on the transmitting wire: swap UART pins for each query.
 */
class SugarEncoderMotor {
    private tx: SerialPin;
    private rx: SerialPin;
    private busy = false;

    constructor(tx: SerialPin = SerialPin.P2, rx: SerialPin = SerialPin.P12) {
        this.init(tx, rx)
    }

    private lock(): void {
        while (this.busy) basic.pause(1)
        this.busy = true
    }

    private validPin(pin: number): boolean {
        return pin == SerialPin.P0 || pin == SerialPin.P1 || pin == SerialPin.P2
            || pin == SerialPin.P8 || pin == SerialPin.P12 || pin == SerialPin.P13
            || pin == SerialPin.P14 || pin == SerialPin.P15 || pin == SerialPin.P16
    }

    init(tx: SerialPin, rx: SerialPin): void {
        if (!this.validPin(tx) || !this.validPin(rx) || tx == rx) control.panic(910)
        this.lock()
        this.tx = tx
        this.rx = rx
        serial.setRxBufferSize(128)
        this.transmitMode()
        this.busy = false
    }

    private integer(value: number, minimum: number, maximum: number): number {
        if (value - value != 0) control.panic(910)
        value = value < 0 ? Math.ceil(value) : Math.floor(value)
        if (value < minimum || value > maximum) control.panic(910)
        return value
    }

    private address(id: number, broadcast: boolean = true): number {
        if (broadcast && id == 0xFD) return id
        return this.integer(id, 1, 8)
    }

    private pullUpInput(pin: SerialPin): void {
        pins.digitalReadPin(<number>pin)
        pins.setPull(<number>pin, PinPullMode.PullUp)
    }

    private transmitMode(): void {
        this.pullUpInput(this.rx)
        serial.redirect(this.tx, this.rx, BaudRate.BaudRate115200)
    }

    private receiveMode(): void {
        // Release the bus before assigning the original TX as UART RX.
        this.pullUpInput(this.tx)
        this.pullUpInput(this.rx)
        serial.redirect(this.rx, this.tx, BaudRate.BaudRate115200)
    }

    private checksum(data: Buffer, start: number, end: number): number {
        let cks1 = 0xAB
        let cks2 = 0xAC
        for (let i = start; i < end; i++) {
            cks1 = (cks1 + data[i]) & 0xFF
            cks2 = (cks2 + cks1) & 0xFF
        }
        return (cks1 + cks2) & 0xFF
    }

    private send(id: number, command: number, payload: Buffer = null): void {
        this.transmitMode()
        // A zero length read is nonblocking and preserves arbitrary bytes.
        serial.readBuffer(0)
        const size = payload ? payload.length : 0
        const frame = pins.createBuffer(size + 5)
        frame[0] = 0xAB
        frame[1] = id
        frame[2] = frame.length
        frame[3] = command
        for (let i = 0; i < size; i++) frame[4 + i] = payload[i]
        frame[frame.length - 1] = this.checksum(frame, 0, frame.length - 1)
        // writeBuffer waits for transmission; switch immediately after it.
        serial.writeBuffer(frame)
    }

    private query(id: number, command: number, size: number): number {
        this.send(id, command)
        this.receiveMode()
        const response = pins.createBuffer(128)
        let count = 0
        let result = NaN
        const start = input.runningTime()
        while (input.runningTime() - start < 80) {
            const chunk = serial.readBuffer(0)
            for (let i = 0; i < chunk.length; i++) {
                if (count == response.length) {
                    for (let j = 1; j < count; j++) response[j - 1] = response[j]
                    count--
                }
                response[count++] = chunk[i]
            }
            // Scan all candidate headers; noise or a truncated frame must not
            // hide a later complete reply. Match both address and command.
            for (let i = 0; i + size + 5 <= count; i++) {
                const length = size + 5
                if (response[i] != 0xAC || response[i + 1] != id
                    || response[i + 2] != length || response[i + 3] != command) continue
                if (this.checksum(response, i, i + length - 1) != response[i + length - 1]) continue
                if (size == 0) result = 1
                else if (size == 1) result = response[i + 4]
                else result = response.getNumber(NumberFormat.Int32LE, i + 4)
                break
            }
            if (result == result) break
            basic.pause(1)
        }
        this.transmitMode()
        return result
    }

    private autoEnable(id: number): void {
        if (this.query(id, 0x40, 1) != 3) this.send(id, 0x40, Buffer.fromArray([3]))
    }

    changeId(id: number): void {
        id = this.address(id, false)
        this.lock()
        this.send(0xFD, 0x10, Buffer.fromArray([id, 0]))
        basic.pause(10)
        this.send(0xFE, 0x2E, Buffer.fromArray([0xF1, 0xF2, 0xF3, 0xF4]))
        this.busy = false
    }

    release(id: number, mode: number): void {
        id = this.address(id)
        if (mode != 0 && mode != 3) control.panic(910)
        this.lock()
        this.send(id, 0x40, Buffer.fromArray([mode]))
        this.busy = false
    }

    ready(id: number): boolean {
        id = this.address(id, false)
        this.lock()
        let ready = false
        for (let i = 0; i < 50; i++) {
            const result = this.query(id, 0x02, 0)
            if (result == result) {
                ready = true
                break
            }
        }
        this.busy = false
        return ready
    }

    setMode(mode: number): void {
        if (mode != 0 && mode != 2) control.panic(910)
        this.lock()
        this.send(0xFD, 0x47, Buffer.fromArray([mode, 0]))
        this.busy = false
    }

    position(id: number, angle: number, value: number, useTime: boolean): void {
        id = this.address(id)
        const tenths = this.integer(Math.round(angle * 10), -2147483648, 2147483647)
        value = this.integer(value, 0, 4294967295)
        const payload = pins.createBuffer(8)
        // Signed little endian also permits negative relative rotations.
        payload.setNumber(NumberFormat.Int32LE, 0, tenths)
        payload.setNumber(NumberFormat.UInt32LE, 4, value)
        this.lock()
        // Broadcast enable without a query avoids replies colliding on the bus.
        if (id == 0xFD) this.send(id, 0x40, Buffer.fromArray([3]))
        else this.autoEnable(id)
        this.send(id, useTime ? 0x43 : 0x44, payload)
        this.busy = false
    }

    speed(id: number, speed: number, duration: number): void {
        id = this.address(id)
        speed = this.integer(speed, -2147483648, 2147483647)
        speed = Math.max(-700, Math.min(700, speed))
        duration = this.integer(duration, 0, 2147483647)
        const payload = pins.createBuffer(8)
        payload.setNumber(NumberFormat.Int32LE, 0, speed)
        payload.setNumber(NumberFormat.Int32LE, 4, duration)
        this.lock()
        this.send(id, 0x4A, payload)
        this.busy = false
    }

    stop(): void {
        this.lock()
        // Preserve the original driver's FE broadcast and two-stage stop.
        this.send(0xFE, 0x40, Buffer.fromArray([3]))
        this.send(0xFE, 0x40, Buffer.fromArray([1]))
        basic.pause(10)
        this.send(0xFE, 0x40, Buffer.fromArray([2]))
        this.busy = false
    }

    getPosition(id: number): number {
        id = this.address(id, false)
        this.lock()
        let result = NaN
        for (let i = 0; i < 50; i++) {
            result = this.query(id, 0x56, 4)
            if (result == result) break
        }
        this.busy = false
        return result / 10
    }
}

namespace Sugar {
    export enum EncoderMotorAddress {
        //% block="1"
        M1 = 1,
        //% block="2"
        M2 = 2,
        //% block="3"
        M3 = 3,
        //% block="4"
        M4 = 4,
        //% block="5"
        M5 = 5,
        //% block="6"
        M6 = 6,
        //% block="7"
        M7 = 7,
        //% block="8"
        M8 = 8
    }

    export enum EncoderMotorId {
        //% block="1"
        M1 = 1,
        //% block="2"
        M2 = 2,
        //% block="3"
        M3 = 3,
        //% block="4"
        M4 = 4,
        //% block="5"
        M5 = 5,
        //% block="6"
        M6 = 6,
        //% block="7"
        M7 = 7,
        //% block="8"
        M8 = 8,
        //% block="all"
        All = 0xFD
    }

    export enum EncoderMotorTorque {
        //% block="locked (default)"
        Locked = 3,
        //% block="released (can turn by hand)"
        Released = 0
    }

    export enum EncoderMotorMode {
        //% block="relative position"
        Relative = 2,
        //% block="absolute position"
        Absolute = 0
    }

    let sugarEncoderMotor: SugarEncoderMotor

    function getEncoderMotor(): SugarEncoderMotor {
        if (!sugarEncoderMotor) sugarEncoderMotor = new SugarEncoderMotor()
        return sugarEncoderMotor
    }

    /** Initialize the shared UART at 115200 baud. Replies use the TX wire. */
    //% blockId=sugarEncoderMotorInit block="encoder motor initialize TX %tx RX %rx"
    //% tx.defl=SerialPin.P2 rx.defl=SerialPin.P12
    //% subcategory=Actuator group="Encoder Motor" weight=79 color=#D359CD
    export function encoderMotorInit(tx: SerialPin = SerialPin.P2, rx: SerialPin = SerialPin.P12): void {
        if (!sugarEncoderMotor) sugarEncoderMotor = new SugarEncoderMotor(tx, rx)
        else sugarEncoderMotor.init(tx, rx)
    }

    /** Change and save the ID of every motor on the wire. Connect one at a time. */
    //% blockId=sugarEncoderMotorChangeId block="set all encoder motors on the wire to ID %id"
    //% id.defl=Sugar.EncoderMotorAddress.M1
    //% subcategory=Actuator group="Encoder Motor" weight=78 color=#D359CD
    export function encoderMotorChangeId(id: EncoderMotorAddress): void {
        getEncoderMotor().changeId(id)
    }

    //% blockId=sugarEncoderMotorTorque block="encoder motor %id set torque mode %mode"
    //% id.defl=Sugar.EncoderMotorId.M1 mode.defl=Sugar.EncoderMotorTorque.Locked
    //% subcategory=Actuator group="Encoder Motor" weight=77 color=#D359CD
    export function encoderMotorTorque(id: EncoderMotorId, mode: EncoderMotorTorque): void {
        getEncoderMotor().release(id, mode)
    }

    /** Query readiness. Retry up to 50 times, with an 80 ms timeout per try. */
    //% blockId=sugarEncoderMotorReady block="encoder motor %id ready?"
    //% id.defl=Sugar.EncoderMotorAddress.M1
    //% subcategory=Actuator group="Encoder Motor" weight=76 color=#D359CD
    export function encoderMotorReady(id: EncoderMotorAddress): boolean {
        return getEncoderMotor().ready(id)
    }

    //% blockId=sugarEncoderMotorSetMode block="set encoder motor rotation mode %mode"
    //% mode.defl=Sugar.EncoderMotorMode.Relative
    //% subcategory=Actuator group="Encoder Motor" weight=75 color=#D359CD
    export function encoderMotorSetMode(mode: EncoderMotorMode): void {
        getEncoderMotor().setMode(mode)
    }

    /** Start a move and return immediately. Negative angles reverse rotation. */
    //% blockId=sugarEncoderMotorPositionTime block="encoder motor %id rotate %angle degrees in %duration ms"
    //% id.defl=Sugar.EncoderMotorId.M1 angle.defl=90 duration.defl=1000 duration.min=0
    //% inlineInputMode=inline
    //% subcategory=Actuator group="Encoder Motor" weight=74 color=#D359CD
    export function encoderMotorPositionTime(id: EncoderMotorId, angle: number = 90, duration: number = 1000): void {
        getEncoderMotor().position(id, angle, duration, true)
    }

    //% blockId=sugarEncoderMotorPositionSpeed block="encoder motor %id rotate %angle degrees at %speed degrees/s"
    //% id.defl=Sugar.EncoderMotorId.M1 angle.defl=90 speed.defl=180 speed.min=0 speed.max=480
    //% inlineInputMode=inline
    //% subcategory=Actuator group="Encoder Motor" weight=73 color=#D359CD
    export function encoderMotorPositionSpeed(id: EncoderMotorId, angle: number = 90, speed: number = 180): void {
        getEncoderMotor().position(id, angle, speed, false)
    }

    /** Start a timed rotation and return immediately; duration zero runs continuously. */
    //% blockId=sugarEncoderMotorSpeedTime block="encoder motor %id speed %speed degrees/s for %duration ms"
    //% id.defl=Sugar.EncoderMotorId.M1 speed.defl=360 speed.min=-480 speed.max=480 duration.defl=1000 duration.min=0
    //% inlineInputMode=inline
    //% subcategory=Actuator group="Encoder Motor" weight=72 color=#D359CD
    export function encoderMotorSpeedTime(id: EncoderMotorId, speed: number = 360, duration: number = 1000): void {
        getEncoderMotor().speed(id, speed, duration)
    }

    //% blockId=sugarEncoderMotorSpeed block="encoder motor %id speed %speed degrees/s"
    //% id.defl=Sugar.EncoderMotorId.M1 speed.defl=360 speed.min=-480 speed.max=480
    //% subcategory=Actuator group="Encoder Motor" weight=71 color=#D359CD
    export function encoderMotorSpeed(id: EncoderMotorId, speed: number = 360): void {
        getEncoderMotor().speed(id, speed, 0)
    }

    //% blockId=sugarEncoderMotorStop block="stop all encoder motors"
    //% subcategory=Actuator group="Encoder Motor" weight=70 color=#D359CD
    export function encoderMotorStop(): void {
        getEncoderMotor().stop()
    }

    /** Read degrees, or NaN on timeout. Up to 50 attempts of 80 ms each. */
    //% blockId=sugarEncoderMotorAngle block="read encoder motor %id angle"
    //% id.defl=Sugar.EncoderMotorAddress.M1
    //% subcategory=Actuator group="Encoder Motor" weight=69 color=#D359CD
    export function encoderMotorAngle(id: EncoderMotorAddress): number {
        return getEncoderMotor().getPosition(id)
    }
}
