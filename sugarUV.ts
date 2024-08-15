let ADDR = 0X53
let LTR390_MAIN_CTRL = 0x00
let LTR390_MEAS_RATE = 0x04
let LTR390_GAIN = 0x05
let LTR390_PART_ID = 0x06
let LTR390_MAIN_STATUS = 0x07
let LTR390_ALSDATA = 0x0D
let LTR390_UVSDATA = 0x10
let LTR390_INT_CFG = 0x19
let RESOLUTION_20BIT_TIME400MS = 0X00
let RESOLUTION_19BIT_TIME200MS = 0X10
let RESOLUTION_18BIT_TIME100MS = 0X20
let RESOLUTION_17BIT_TIME50MS = 0x3
let RESOLUTION_16BIT_TIME25MS = 0x40
let RESOLUTION_13BIT_TIME12_5MS = 0x50
let RATE_25MS = 0x0
let RATE_50MS = 0x1
let RATE_100MS = 0x2
let RATE_200MS = 0x3
let RATE_500MS = 0x4
let RATE_1000MS = 0x5
let RATE_2000MS = 0x6
let GAIN_1 = 0x0
let GAIN_3 = 0x1
let GAIN_6 = 0x2
let GAIN_9 = 0x3
let GAIN_18 = 0x4

class SugarUV {
    id:number;
    constructor() {
        this.id = this.read_byte(LTR390_PART_ID)
        if(this.id != 0xb2){
            serial.writeLine("Warning!Unknown device model")
        }
        this.setIntVal(5,20)
    }

    read_byte(cmd: number): number {
        pins.i2cWriteNumber(ADDR, cmd, 1)
        return pins.i2cReadNumber(ADDR, 1)
    }

    write_byte(cmd: number, val: number): void {
        pins.i2cWriteNumber(ADDR, cmd, val)
    }

    setIntVal(low: number, high: number) {
        pins.i2cWriteNumber(ADDR, 0x00, 0x00)
        pins.i2cWriteNumber(ADDR, 0x04, 0x22)
        pins.i2cWriteNumber(ADDR, 0x05, 0x01)
        pins.i2cWriteNumber(ADDR, 0x19, 0x10)
        pins.i2cWriteNumber(ADDR, 0x1A, 0x00)
        pins.i2cWriteNumber(ADDR, 0x21, high & 0xff)
        pins.i2cWriteNumber(ADDR, 0x22, (high >> 8) & 0xff)
        pins.i2cWriteNumber(ADDR, 0x23, (high >> 16) & 0x0f)
        pins.i2cWriteNumber(ADDR, 0x24, low & 0xff)
        pins.i2cWriteNumber(ADDR, 0x25, (low >> 8) & 0xff)
        pins.i2cWriteNumber(ADDR, 0x26, (low >> 16) & 0x0f)
    }

    uvi(): number {
        this.write_byte(LTR390_INT_CFG, 0x34)
        this.write_byte(LTR390_MAIN_CTRL, 0x0A)
        let data1 = this.read_byte(LTR390_UVSDATA)
        let data2 = this.read_byte(LTR390_UVSDATA + 1)
        let data3 = this.read_byte(LTR390_UVSDATA + 2)
        let uv = (data3 << 16) | (data2 << 8) | data1
        uv = (
            (uv / 4.000046)
            / (
                (3 / 18)
                * (2 ** 16)
                / (2 ** 20)
                * 2300
            )
            * 1
        )
        return Math.round(uv)
    }

    als(): number {
        this.write_byte(LTR390_INT_CFG, 0x14)
        this.write_byte(LTR390_MAIN_CTRL, 0x02)
        let data1 = this.read_byte(LTR390_ALSDATA)
        let data2 = this.read_byte(LTR390_ALSDATA + 1)
        let data3 = this.read_byte(LTR390_ALSDATA + 2)
        let als = (data3 << 16) | (data2 << 8) | data1
        als = (als / 4.000046 * 0.6) / (3 * 0.25) * 1
        return Math.round(als)
    }

}