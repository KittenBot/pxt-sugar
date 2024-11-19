const SCD4X_I2C_ADDR = 0x62

const SCD4X_SERIAL_NUMBER_WORD0 = 0xbe02
const SCD4X_SERIAL_NUMBER_WORD1 = 0x7f07
const SCD4X_SERIAL_NUMBER_WORD2 = 0x3bfb

const SCD4X_CRC8_INIT = 0xFF
const SCD4X_CRC8_POLYNOMIAL = 0x31

const SCD4X_START_PERIODIC_MEASURE = 0x21b1
const SCD4X_READ_MEASUREMENT = 0xec05
const SCD4X_STOP_PERIODIC_MEASURE = 0x3f86

const SCD4X_SET_TEMPERATURE_OFFSET = 0x241d
const SCD4X_GET_TEMPERATURE_OFFSET = 0x2318
const SCD4X_SET_SENSOR_ALTITUDE = 0x2427
const SCD4X_GET_SENSOR_ALTITUDE = 0x2322
const SCD4X_SET_AMBIENT_PRESSURE = 0xe000

const SCD4X_PERFORM_FORCED_RECALIB = 0x362f
const SCD4X_SET_AUTOMATIC_CALIB = 0x2416
const SCD4X_GET_AUTOMATIC_CALIB = 0x2313

const SCD4X_START_LOW_POWER_MEASURE = 0x21ac
const SCD4X_GET_DATA_READY_STATUS = 0xe4b8

const SCD4X_PERSIST_SETTINGS = 0x3615
const SCD4X_GET_SERIAL_NUMBER = 0x3682
const SCD4X_PERFORM_SELF_TEST = 0x3639
const SCD4X_PERFORM_FACTORY_RESET = 0x3632
const SCD4X_REINIT = 0x3646

const SCD4X_MEASURE_SINGLE_SHOT = 0x219d
const SCD4X_MEASURE_SINGLE_SHOT_RHT_ONLY = 0x2196
const SCD4X_POWER_DOWN = 0x36e0
const SCD4X_WAKE_UP = 0x36f6

class Sugarco2 {
    addr = SCD4X_I2C_ADDR
    co2_ppm = 0
    temp = 0
    humidity = 0

    write_date(cmd: number, data: Array<number>): void {
        data.insertAt(0,cmd&0xFF)
        data.insertAt(0, (cmd >> 8) & 0xFF)
        let dataBuffer = Buffer.fromArray(data)
        pins.i2cWriteBuffer(this.addr, dataBuffer)
    }
}