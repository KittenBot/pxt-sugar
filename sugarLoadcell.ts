const DEVICE_ADDRESS = 0x2A;

const NAU7802_PU_CTRL = 0x00;
const NAU7802_CTRL1 = 0x01;
const NAU7802_CTRL2 = 0x02;
const NAU7802_OCAL1_B2 = 0x03;
const NAU7802_OCAL1_B1 = 0x04;
const NAU7802_OCAL1_B0 = 0x05;
const NAU7802_GCAL1_B3 = 0x06;
const NAU7802_GCAL1_B2 = 0x07;
const NAU7802_GCAL1_B1 = 0x08;
const NAU7802_GCAL1_B0 = 0x09;
const NAU7802_OCAL2_B2 = 0x0A;
const NAU7802_OCAL2_B1 = 0x0B;
const NAU7802_OCAL2_B0 = 0x0C;
const NAU7802_GCAL2_B3 = 0x0D;
const NAU7802_GCAL2_B2 = 0x0E;
const NAU7802_GCAL2_B1 = 0x0F;
const NAU7802_GCAL2_B0 = 0x10;
const NAU7802_I2C_CONTROL = 0x11;
const NAU7802_ADCO_B2 = 0x12;
const NAU7802_ADCO_B1 = 0x13;
const NAU7802_ADCO_B0 = 0x14;
const NAU7802_ADC = 0x15;
const NAU7802_OTP_B1 = 0x16;
const NAU7802_OTP_B0 = 0x17;
const NAU7802_PGA = 0x1B;
const NAU7802_PGA_PWR = 0x1C;
const NAU7802_DEVICE_REV = 0x1F;

const NAU7802_PU_CTRL_RR = 0;
const NAU7802_PU_CTRL_PUD = 1;
const NAU7802_PU_CTRL_PUA = 2;
const NAU7802_PU_CTRL_PUR = 3;
const NAU7802_PU_CTRL_CS = 4;
const NAU7802_PU_CTRL_CR = 5;
const NAU7802_PU_CTRL_OSCS = 6;
const NAU7802_PU_CTRL_AVDDS = 7;

const NAU7802_CTRL1_GAIN = 2;
const NAU7802_CTRL1_VLDO = 5;
const NAU7802_CTRL1_DRDY_SEL = 6;
const NAU7802_CTRL1_CRP = 7;

const NAU7802_CTRL2_CALMOD = 0;
const NAU7802_CTRL2_CALS = 2;
const NAU7802_CTRL2_CAL_ERROR = 3;
const NAU7802_CTRL2_CRS = 4;
const NAU7802_CTRL2_CHS = 7;

const NAU7802_PGA_CHP_DIS = 0;
const NAU7802_PGA_INV = 3;
const NAU7802_PGA_BYPASS_EN = 4;
const NAU7802_PGA_OUT_EN = 5;
const NAU7802_PGA_LDOMODE = 6;
const NAU7802_PGA_RD_OTP_SEL = 7;

const NAU7802_PGA_PWR_PGA_CURR = 0;
const NAU7802_PGA_PWR_ADC_CURR = 2;
const NAU7802_PGA_PWR_MSTR_BIAS_CURR = 4;
const NAU7802_PGA_PWR_PGA_CAP_EN = 7;

const NAU7802_LDO_2V4 = 0b111;
const NAU7802_LDO_2V7 = 0b110;
const NAU7802_LDO_3V0 = 0b101;
const NAU7802_LDO_3V3 = 0b100;
const NAU7802_LDO_3V6 = 0b011;
const NAU7802_LDO_3V9 = 0b010;
const NAU7802_LDO_4V2 = 0b001;
const NAU7802_LDO_4V5 = 0b000;

const NAU7802_GAIN_128 = 0b111;
const NAU7802_GAIN_64 = 0b110;
const NAU7802_GAIN_32 = 0b101;
const NAU7802_GAIN_16 = 0b100;
const NAU7802_GAIN_8 = 0b011;
const NAU7802_GAIN_4 = 0b010;
const NAU7802_GAIN_2 = 0b001;
const NAU7802_GAIN_1 = 0b000;

const NAU7802_SPS_320 = 0b111;
const NAU7802_SPS_80 = 0b011;
const NAU7802_SPS_40 = 0b010;
const NAU7802_SPS_20 = 0b001;
const NAU7802_SPS_10 = 0b000;

const NAU7802_CHANNEL_1 = 0;
const NAU7802_CHANNEL_2 = 1;

const NAU7802_CAL_SUCCESS = 0;
const NAU7802_CAL_IN_PROGRESS = 1;
const NAU7802_CAL_FAILURE = 2;

class SugarLoadcell {

    _zeroOffset: number;
    _calibrationFactor: number;
    _peel: number;

    begin(initialize: boolean = true, zeroOffset: number = 2071.921875, factor: number = 1.53034747292419): boolean {
        this._peel = 0
        let result = true
        if (initialize) {
            result = result && this.reset()
            result = result && this.powerUp()
            result = result && this.setLDO(NAU7802_LDO_3V3)
            result = result && this.setGain(NAU7802_GAIN_128)
            result = result && this.setSampleRate(NAU7802_SPS_80)
            result = result && this.setRegister(NAU7802_ADC, 0x30)
            result = result && this.setBit(NAU7802_PGA_PWR_PGA_CAP_EN, NAU7802_PGA_PWR)
            result = result && this.calibrateAFE()
        }
        if (result) {
            this.setZeroOffset(zeroOffset)
            this.setCalibrationFactor(factor)
        }
        
        return result
    }

    getBit(bit_number: number, register_address: number): boolean {
        let value = this.getRegister(register_address)
        value &= (1 << bit_number)
        if (value !== 0) {
            return true
        }
        return false
    }

    getRegister(register_address: number): number {
        try {
            pins.i2cWriteNumber(DEVICE_ADDRESS, register_address, NumberFormat.UInt8BE)
            return pins.i2cReadBuffer(DEVICE_ADDRESS, 1)[0]
        } catch {
            return -1
        }
        return 0
    }

    setBit(bit_number: number, register_address: number): boolean {
        let value = this.getRegister(register_address)
        value |= (1 << bit_number)
        return this.setRegister(register_address, value)
    }

    setRegister(register_address: number, value: number): boolean {
        try {
            let buf = pins.createBuffer(2);
            buf[0] = register_address
            buf[1] = value
            pins.i2cWriteBuffer(DEVICE_ADDRESS, buf)
        } catch {
            return false
        }
        return true
    }

    clearBit(bit_number: number, register_address: number): boolean {
        let value = this.getRegister(register_address)
        value &= ~(1 << bit_number)
        return this.setRegister(register_address, value)
    }

    reset(): boolean {
        this.setBit(NAU7802_PU_CTRL_RR, NAU7802_PU_CTRL)
        control.waitMicros(1000)
        return this.clearBit(NAU7802_PU_CTRL_RR, NAU7802_PU_CTRL)
    }

    powerUp(): boolean {
        this.setBit(NAU7802_PU_CTRL_PUD, NAU7802_PU_CTRL)
        this.setBit(NAU7802_PU_CTRL_PUA, NAU7802_PU_CTRL)
        let counter = 0
        while (!this.getBit(NAU7802_PU_CTRL_PUR, NAU7802_PU_CTRL)) {
            control.waitMicros(1000)
            if (counter > 100) {
                return false
            }
            counter += 1
        }
        return true
    }

    setLDO(ldo_value: number): boolean {
        if (ldo_value > 0b111) {
            ldo_value = 0b111
        }
        let value = this.getRegister(NAU7802_CTRL1)
        value = value & 0b11000111
        value != ldo_value << 3
        this.setRegister(NAU7802_CTRL1, value)
        return this.setBit(NAU7802_PU_CTRL_AVDDS, NAU7802_PU_CTRL)
    }

    setGain(gain_value: number): boolean {
        if (gain_value > 0b111) {
            gain_value = 0b111
        }
        let value = this.getRegister(NAU7802_CTRL1)
        value &= 0b11111000
        value |= gain_value

        return this.setRegister(NAU7802_CTRL1, value)
    }

    setSampleRate(rate: number): boolean {
        if (rate > 0b111) {
            rate = 0b111
        }
        let value = this.getRegister(NAU7802_CTRL2)
        value &= 0b10001111
        value |= rate << 4

        return this.setRegister(NAU7802_CTRL2, value)
    }

    beginCalibrateAFE(): void {
        this.setBit(NAU7802_CTRL2_CALS, NAU7802_CTRL2)
    }

    calAFEStatus(): number {
        if (this.getBit(NAU7802_CTRL2_CALS, NAU7802_CTRL2)) {
            return NAU7802_CAL_IN_PROGRESS
        }
        if (this.getBit(NAU7802_CTRL2_CAL_ERROR, NAU7802_CTRL2)) {
            return NAU7802_CAL_FAILURE
        }
        return NAU7802_CAL_SUCCESS
    }

    waitForCalibrateAFE(timeout_ms: number = 0): boolean {
        let timeout_s = timeout_ms / 1000
        let begin = input.runningTime() / 1000
        let cal_ready = this.calAFEStatus()
        while (cal_ready == NAU7802_CAL_IN_PROGRESS) {
            if ((timeout_ms > 0) && ((input.runningTime() / 1000 - begin) > timeout_s)) {
                serial.writeString("timeout\n")
                break
            }
            control.waitMicros(1000)
            cal_ready = this.calAFEStatus()
        }
        if (cal_ready == NAU7802_CAL_SUCCESS) {
            return true
        }
        return false
    }

    calibrateAFE(): boolean {
        this.beginCalibrateAFE()
        return this.waitForCalibrateAFE(1000)
    }

    setZeroOffset(new_zero_offset: number) {
        this._zeroOffset = new_zero_offset
    }

    setCalibrationFactor(new_cal_factor: number): void {
        this._calibrationFactor = new_cal_factor
    }

    available(): boolean {
        return this.getBit(NAU7802_PU_CTRL_CR, NAU7802_PU_CTRL)
    }

    getReading(): number {
        try {
            pins.i2cWriteNumber(DEVICE_ADDRESS, NAU7802_ADCO_B2, NumberFormat.UInt8BE)
            let value_list = pins.i2cReadBuffer(DEVICE_ADDRESS, 3)
            let value: number = (value_list[0] << 24) | (value_list[1] << 16) | (value_list[2] << 8);
            value >>= 16;
            return value
        } catch {
            return 0
        }
    }

    getAverage(average_amount: number): number {
        let total = 0
        let samples_acquired = 0
        let start_time = input.runningTime() / 1000
        while (samples_acquired < average_amount) {
            if (this.available()) {
                total += this.getReading()
                samples_acquired += 1
            }
            if (input.runningTime() / 1000 - start_time > 1.0) {
                return 0
            }
            control.waitMicros(1000)
        }
        total /= average_amount
        return total
    }

    calculateZeroOffset(average_amount: number = 8): void {
        this.setZeroOffset(this.getAverage(average_amount))
    }

    calculateCalibrationFactor(weight_on_scale: number, average_amount: number = 8): void {
        let onScale = this.getAverage(average_amount)
        let newCalFactor = (onScale - this._zeroOffset) / weight_on_scale
        this.setCalibrationFactor(newCalFactor)
    }

    getZeroOffset(): number {
        return this._zeroOffset
    }

    getCalibrationFactor(): number {
        return this._calibrationFactor
    }
    
    setPeel(): void{
        this._peel = this.getWeight()
    }

    getWeight(allow_negative_weights: boolean = true, samples_to_take: number = 8): number {
        let on_scale = this.getAverage(samples_to_take)
        if (!allow_negative_weights) {
            if (on_scale < this._zeroOffset) {
                on_scale = this._zeroOffset
            }
        }
        let weight = Math.round((on_scale - this._zeroOffset) / this._calibrationFactor)
        return weight
    }

    getWeightPeel(): number{
        return this.getWeight() - this._peel
    }

    calibrateScale(): void {
        serial.writeString("start calibrate.\n")
        this.calculateZeroOffset(64)
        serial.writeValue("new unloaded value", this.getZeroOffset())
        serial.writeString("Place an object of known weight on the scale and press enter when ready.\n")
        serial.readLine()
        serial.writeString("Enter the weight of the object and press enter (g). \n")
        let grams = parseFloat(serial.readLine())
        this.calculateCalibrationFactor(grams, 64)
        serial.writeValue("New calibration factors", this.getCalibrationFactor())
        serial.writeString("Please save the no-load value and calibration factor yourself.\n")
        serial.writeString("Press Enter to end calibration and continue with subsequent procedures\n")
        serial.readLine()
    }

}