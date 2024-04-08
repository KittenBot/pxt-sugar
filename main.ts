/*
KittenBot Team
A series of sensors
"sugar": "file:../pxt-sugar"
*/

function i2cwrite(addr: number, reg: number, value: number[]) {
    let a = [reg]
    if (value.length)
        a = a.concat(value)
    return pins.i2cWriteBuffer(addr, Buffer.fromArray(a))
}

function i2cread(addr: number, reg: number, size: number) {
    pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
    return pins.i2cReadBuffer(addr, size);
}

function gestureMap(gestureId: number) {
    let gestureTxt = ""
    switch (gestureId) {
        case 0x01:
            gestureTxt = "right"
            break;
        case 0x02:
            gestureTxt = "left"
            break;
        case 0x03:
            gestureTxt = "back"
            break;
        case 0x04:
            gestureTxt = "front"
            break;
        case 0x05:
            gestureTxt = "pull"
            break;
        case 0x06:
            gestureTxt = "down"
            break;
        case 0x07:
            gestureTxt = "leave"
            break;
        case 0x08:
            gestureTxt = "hover"
            break;
        default:
            gestureTxt = null
            break;
    }
    return gestureTxt;
}

//% color="#49cef7" weight=10 icon="\uf1b0" block="Sugar" blockId="Sugar"
//% groups='["Motion/PIR", "Linefollower/Tracker", "HallEffect", "Buttons", "LED", "Flame", "PotentialMeter", "LightLevel", "Moisture", "Rain Gauge", "Infra Transmitter", "Distance", "Environment", "Joystick"]'
namespace Sugar {
    const TTS_INTEGER_CMD = 0x20          // tts id : signed integer
    const TTS_DOUBLE_CMD = 0x1f           // tts id : signed double
    const TTS_TIME_CMD = 0x03             // tts id : clock => (hour,minute)
    const TTS_DATE_CMD = 0x04             // tts id : date => (year,mouth,day)
    const INTEGER_LEN = 4                 // 4 bytes int
    const DOUBLE_LEN = 8                  // 8 bytes double
    const CLOCK_LEN = 2                   // 2 bytes clock(1,1)
    const DATE_LEN = 6                    // 2 bytes date(4,1,1)  

    //self.i2c address of the device
    const HP203B_ADDRESS = 0x76

    //ADC_CVT(HP203B_ADC_CVT, 3 - bit OSR, 2 - bit CHNL)

    //HP203B Command Set
    const HP203B_SOFT_RST = 0x06          //Soft reset the device
    const HP203B_ADC_CVT = 0x40           //Perform ADC conversion
    const HP203B_READ_PT = 0x10           //Read the temperature and pressure values
    const HP203B_READ_AT = 0x11           //Read the temperature and altitude values
    const HP203B_READ_P = 0x30            //Read the pressure value only
    const HP203B_READ_A = 0x31            //Read the altitude value only
    const HP203B_READ_T = 0x32            //Read the temperature value only
    const HP203B_ANA_CAL = 0x28           //Re - calibrate the internal analog blocks
    const HP203B_READ_REG = 0x80          //Read out the control registers
    const HP203B_WRITE_REG = 0xC0         //Write in the control registers


    //OSR Configuration
    const HP203B_OSR_4096 = 0x00                // Conversion time: 4.1ms
    const HP203B_OSR_2048 = 0x04                // Conversion time: 8.2ms
    const HP203B_OSR_1024 = 0x08                // Conversion time: 16.4ms
    const HP203B_OSR_512 = 0xC0                 // Conversion time: 32.8ms
    const HP203B_OSR_256 = 0x10                 // Conversion time: 65.6ms
    const HP203B_OSR_128 = 0x14                 // Conversion time: 131.1ms

    const HP203B_CH_PRESSTEMP = 0x00                  // Sensor Pressure and Temperature Channel
    const HP203B_CH_TEMP = 0x02                       // Temperature Channel

    let QRcodeId = 11
    let TopicMesId = 22
    let AsrTextId = 1122

    type EvtAct = () => void

    let ledEvt: EvtAct = null;
    let actEvt: EvtAct = null;
    let meaEvt: EvtAct = null;
    let cosEvt: EvtAct = null;
    let asrEventId = 6666
    let fpvEventId = 7777
    let gestureEventId = 8888
    let cmd = 0
    let asrText: string = ''
    let qrcode: string = ''
    let ipAddress: string = '0.0.0.0'
    let mqttMessage: string = ''
    let mqttTopicL: string = ''
    let distanceBuf = 0
    let temp = 25

    let GestureId = 33
    let gesturesOperate = "";

    ``
    const PortSerial = [
        [SerialPin.P0, SerialPin.P8],
        [SerialPin.P1, SerialPin.P12],
        [SerialPin.P2, SerialPin.P13],
        [SerialPin.P14, SerialPin.P15]
    ]

    export enum ValueUnit {
        //% block="mm"
        Millimeter,
        //% block="cm"
        Centimeters
    }

    export enum SerialPorts {
        //% block="PORT1(TX:P0 / RX:P8)"
        PORT1 = 0,
        //% block="PORT2(TX:P1 / RX:P12)"
        PORT2 = 1,
        //% block="PORT3(TX:P2 / RX:P13)"
        PORT3 = 2,
        //% block="PORT4(TX:P14 / RX:P15)"
        PORT4 = 3
    }

    export enum BTNCmd {
        //% block="A"
        A = 1,
        //% block="B"
        B = 2,
        //% block="A+B"
        AB = 3
    }

    export enum PmMenu{
        //% block="PM1.0"
        PM1 = 0,
        //% block="PM2.5"
        PM25 = 1,
        //% block="PM10"
        PM10 = 2
    }

    export enum GestureType {
        //% block="right"
        right = 0x01,
        //% block="left"
        left = 0x02,
        //% block="back"
        back = 0x03,
        //% block="front"
        front = 0x04,
        //% block="pull"
        pull = 0x05,
        //% block="down"
        down = 0x06,
        //% block="leave"
        leave = 0x07,
        //% block="hover"
        hover = 0x08,
    }

    export enum ColorPreset {
        //% block="red"
        red = 0xff0000,
        //% block="blue"
        blue = 0x0000ff,
        //% block="green"
        green = 0x00ff00,
        //% block="yellow"
        yellow = 0xffff00,
        //% block="purple"
        purple = 0xff00ff,
        //% block="cyan"
        cyan = 0x00ffff,
        //% block="white"
        white = 0xffffff,
    }

    export enum LEDCmd {
        //% block="lamp on / light On"
        lamp_on = 200,
        //% block="lamp off / light off"
        lamp_off = 201,
        //% block="brighter"
        brighter = 202,
        //% block="dimmer"
        dimmer = 203,
        //% block="red light on"
        red_light_on = 204,
        //% block="green light on"
        green_light_on = 205,
        //% block="yellow light on"
        yellow_light_on = 206,
        //% block="blue light on"
        blue_light_on = 207,
        //% block="sitting loom light on"
        sitting_room_light_on = 208,
        //% block="sitting room light off"
        sitting_room_light_off = 209,
        //% block="kitchen light on"
        kitchen_light_on = 210,
        //% block="kitchen light off"
        kitchen_light_off = 211,
        //% block="bedroom light on"
        bedroom_light_on = 212,
        //% block="bedroom light off"
        bedroom_light_off = 213,
        //% block="balcony light on"
        balcony_light_on = 214,
        //% block="balcony light off"
        balcony_light_off = 215,
        //% block="bathroom light on"
        bathroom_light_on = 216,
        //% block="bathroom light off"
        bathroom_light_off = 217,
        //% block="all light on"
        all_light_on = 218,
        //% block="all light off"
        all_light_off = 219
    }

    export enum ActCmd {
        //% block="open door"
        open_door = 300,
        //% block="close door"
        close_door = 301,
        //% block="open window"
        open_window = 302,
        //% block="close window"
        close_window = 303,
        //% block="open curtains"
        open_curtains = 304,
        //% block="close curtains"
        close_curtains = 305,
        //% block="hanger out"
        hanger_out = 306,
        //% block="hanger in" 
        hanger_in = 307,
        //% block="fan on"
        fan_on = 308,
        //% block="fan off"
        fan_off = 309,
        //% block="speed up"
        speed_up = 310,
        //% block="slow down"
        slow_down = 311,
        //% block="air conditioner on"
        air_conditioner_on = 312,
        //% block="air conditioner off"
        air_conditioner_off = 313,
        //% block="music on"
        music_on = 314,
        //% block="music off" 
        music_off = 315,
        //% block="pause"
        pause = 316,
        //% block="previous song"
        previous_song = 317,
        //% block="next song"
        next_song = 318,
        //% block="volume up"
        volume_up = 319,
        //% block="volume down"
        volume_down = 320,
        //% block="robot on"
        robot_on = 321,
        //% block="robot off"
        robot_off = 322,
        //% block="robot stop" 
        robot_stop = 323,
        //% block="move forward"
        move_forward = 324,
        //% block="move backward"
        move_backward = 325,
        //% block="turn left"
        turn_left = 326,
        //% block="turn right"
        turn_right = 327,
        //% block="lift on"
        lift_on_on = 328,
        //% block="first floor"
        first_floor_off = 329,
        //% block="second floor"
        second_floor = 330,
        //% block="third floor" 
        third_floor = 331
    }

    export enum MeasureCmd {
        //% block="check temperature"
        check_temperature = 400,
        //% block="check humidity"
        check_humidity = 401,
        //% block="check weather"
        check_weather = 402,
        //% block="check time"
        check_time = 403,
        //% block="check date"
        check_date = 404,
        //% block="measure distance"
        measure_distance = 405,
        //% block="measure temperature"
        measure_temperature = 406,
        //% block="measure weight"
        measure_weight = 407,
        //% block="measure height"
        measure_height = 408
    }

    export enum CustomCmd {
        //% block="command 1"
        command_one = 901,
        //% block="command 2"
        command_two = 902,
        //% block="command 3"
        command_three = 903,
        //% block="command 4"
        command_four = 904,
        //% block="command 5"
        command_five = 905,
        //% block="command 6"
        command_six = 906,
        //% block="command 7"
        command_seven = 907,
        //% block="command 8"
        command_eight = 908,
        //% block="command 9"
        command_nine = 909,
        //% block="command 10"
        command_ten = 910
    }

    export enum WordsID {
        //% block="temperature is"
        temperature_is = 0x01,
        //% block="Humidity is"
        humidity_is = 0x02,
        //% block="welcome"
        welcome = 0x05,
        //% block="distance is"
        distance_is = 0x06,
        //% block="millimeter"
        millimeter = 0x07,
        //% block="centimeter"
        centimeter = 0x08,
        //% block="meter"
        meter = 0x09,
        //% block="body temperature is"
        body_temperature_is = 0x0a,
        //% block="weight is"
        weight_is = 0x0b,
        //% block="gram"
        gram = 0x0c,
        //% block="kilogram"
        kilogram = 0x0d,
        //% block="please say the password"
        please_say_the_password = 0x0e,
        //% block="The weather is"
        The_weather_is = 0x0f,
        //% block="sunny"
        sunny = 0x10,
        //% block="cloudy"
        cloudy = 0x11,
        //% block="raining"
        raining = 0x12,
        //% block="snowing"
        snowing = 0x13,
        //% block="haze"
        haze = 0x14,
        //% block="big"
        big = 0x15,
        //% block="middle"
        middle = 0x16,
        //% block="small"
        small = 0x17,
        //% block="which floor are you going to"
        which_floor_are_you_going_to = 0x18,
        //% block="yes"
        yes = 0x19,
        //% block="no"
        no = 0x1a,
        //% block="percent"
        percent = 0x1b,
        //% block="you are right"
        you_are_right = 0x1c,
        //% block="you are wrong"
        you_are_wrong = 0x1d,
        //% block="degree centigrade"
        degree_centigrade = 0x1e,
        //% block="ok"
        ok = 0x21
    }

    export enum Ports {
        PORT1 = 0,
        PORT2 = 1,
        PORT3 = 2,
        PORT4 = 3,
        PORT5 = 4,
        PORT6 = 5,
        PORT7 = 6
    }

    export enum EnvType {
        //% block="Temperature(℃)"
        Temperature = 0,
        //% block="Humidity(%RH)"
        Humidity = 1
    }

    export enum EnvTypeII {
        //% block="Pressure(hPa)"
        Pressure = 0,
        //% block="Altitude(m)"
        Altitude = 1,
        //% block="Temp(℃)"
        CTemp = 2,
        //% block="Temp(℉)"
        FTemp = 3
    }

    export enum AirType {
        //% block="CO2(ppm)"
        CO2 = 0,
        //% block="TVOC(ppm)"
        TVOC = 1
    }

    export enum LEDSta {
        //% block="OFF"
        Off = 0,
        //% block="ON"
        On = 1
    }

    export enum Switch {
        //% block="OFF"
        Off = 0,
        //% block="ON"
        On = 1
    }

    export enum JoystickDir {
        pressed = 1,
        left = 0x10,
        right = 0x8,
        up = 0x4,
        down = 0x2
    }

    export enum DirType {
        X = 0,
        Y = 1
    }

    //% blockId=pir block="(PIR) motion detected %pin"
    //% group="DigitalIn" weight=90
    export function PIR(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }

    //% blockId=tracer block="(Tracker) black dectected %pin"
    //% group="DigitalIn" weight=89
    export function Tracker(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }

    //% blockId=hall block="(Hall) magnetic detected %pin"
    //% group="DigitalIn" weight=88
    export function Hall(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 0
    }

    //% blockId=button block="(Button) pressed %pin "
    //% group="DigitalIn" weight=87
    export function Button(pin: DigitalPin): boolean {
        pins.setPull(pin, PinPullMode.PullUp)
        return pins.digitalReadPin(pin) == 0
    }

    //% blockId=onButtonEvent block="on button|%pin pressed"
    //% group="DigitalIn" weight=86
    export function onButtonEvent(pin: DigitalPin, handler: () => void): void {
        pins.setPull(pin, PinPullMode.PullUp)
        pins.onPulsed(pin, PulseValue.Low, handler)
    }

    //% blockId=Crash block="(Crash) crash detected %pin "
    //% group="DigitalIn" weight=79
    export function Crash(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }

    //% blockId=Touch block="(Touch) touch detected %pin "
    //% group="DigitalIn" weight=78
    export function Touch(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }

    //% blockId=led_toggle block="(LED) %pin| %onoff"
    //% group="DigitalOut" weight=85
    export function ledOnoff(pin: DigitalPin, onoff: LEDSta) {
        pins.digitalWritePin(pin, onoff ? 1 : 0)
    }

    //% blockId=led_luminent block="(LED) %pin| set brightness(0-1023) %value"
    //% value.min=0 value.max=1023 value.defl=0
    //% group="DigitalOut" weight=84
    export function ledLuminent(pin: AnalogPin, value: number) {
        pins.analogWritePin(pin, value)
    }

    //% blockId=string_lights_toggle block="(String Lights) %pin| %onoff"
    //% group="DigitalOut" weight=85
    export function StringLightsOnoff(pin: DigitalPin, onoff: LEDSta) {
        pins.digitalWritePin(pin, onoff ? 1 : 0)
    }

    //% blockId=Buzzer block="(Active Buzzer) %pin| sound %onoff"
    //% group="DigitalOut" weight=83
    export function Buzzer(pin: DigitalPin, onoff: Switch) {
        pins.digitalWritePin(pin, onoff ? 1 : 0)
    }

    //% blockId=Laser block="(Laser) %pin| %onoff"
    //% group="DigitalOut" weight=82
    export function Laser(pin: DigitalPin, onoff: Switch) {
        pins.digitalWritePin(pin, onoff ? 1 : 0)
    }

    //% blockId=vibeMotor block="(Vibe Motor) %pin| %onoff"
    //% group="DigitalOut" weight=81
    export function vibeMotor(pin: DigitalPin, onoff: Switch) {
        pins.digitalWritePin(pin, onoff ? 1 : 0)
    }

    //% blockId=atomizer block="(Atomizer) %pin| %onoff"
    //% group="DigitalOut" weight=82
    export function atomizer(pin: DigitalPin, onoff: Switch) {
        pins.digitalWritePin(pin, onoff ? 1 : 0)
    }

    //% blockId=flameBool block="(Flame) fire Detected %pin "
    //% group="DigitalIn" weight=80
    export function FlameDigi(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }

    //% blockId=flameAnalog block="(Flame) value %pin"
    //% group="AnalogIn" weight=84
    export function FlameAna(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    //% blockId=potential block="(Angle) value %pin"
    //% group="AnalogIn" weight=83
    export function Angle(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    //% blockId=audio block="(Audio) value %pin"
    //% group="AnalogIn" weight=83
    export function audio(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    //% blockId=lightlvl block="(Light) value %pin"
    //% group="AnalogIn" weight=82
    export function Light(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    //% blockId=soilmoisture block="(SoilMoisture) value %pin"
    //% group="AnalogIn" weight=81
    export function SoilMoisture(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    //% blockId=rain block="(WaterLevel) value %pin"
    //% group="DigitalIn" weight=80
    export function WaterLevelDigi(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }

    //% blockId=grayscale block="(Grayscale) value %pin"
    //% group="AnalogIn" weight=79
    export function grayscale(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    //% blockId=waterlvl block="(WaterLevel) value %pin"
    //% group="AnalogIn" weight=79
    export function WaterLevelAna(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    // //% blockId=infraRx block="(Infrared)on infra %pin received"
    // //% group="Special" weight=78
    // export function InfraRx(pin: AnalogPin, handler: (data: string) => void) {

    // }

    // //% blockId=infraTx block="Infra %pin transmit %data"
    // //% group="Special" weight=78
    // export function InfraTx(pin: AnalogPin, data: string) {

    // }

    // //% blockId=tempSensor block="(DS18B20) value %pin"
    // //% group="Special" weight=77
    // export function tempSensor(pin: DigitalPin):string {
    //     return  '温度：16℃'
    // }

    const VL53L0X_ADDR = 0x5e;
    let vl53Inited = false;

    //% blockId=tof block="(TOF Distance) distance(mm)"
    //% group="I2C" weight=76
    export function TOFDistance(): number {
        if (!vl53Inited) {
            let buf = pins.createBuffer(3)
            buf[0] = 1
            pins.i2cWriteBuffer(VL53L0X_ADDR, buf)
            vl53Inited = true
            control.waitMicros(50)
        }
        pins.i2cWriteNumber(VL53L0X_ADDR, 0x1, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(VL53L0X_ADDR, NumberFormat.UInt16LE);
    }

    const PM_ADDR = 0x12;

    //% blockId=pm block="(PM) get %pmType data(µg/m³)"
    //% group="I2C" weight=76
    export function PMdata(pmType: PmMenu): number {
        let buffer = pins.i2cReadBuffer(PM_ADDR, 32);
        let sum = 0
        for(let i=0;i<30;i++){
            sum+=buffer[i]
        }
        let data = [-1, -1, -1]
        if(sum==((buffer[30]<<8)|buffer[31])){
            data[0] = (buffer[0x04] << 8) | buffer[0x05]
            data[1] = (buffer[0x06] << 8) | buffer[0x07]
            data[2] = (buffer[0x08] << 8) | buffer[0x09]
        }
        return data[pmType]
    }

    const CO2_ADDR = 0x58
    let co2Inited = false;

    //% blockId=co2 block="(CO2) value %air"
    //% group="I2C" weight=74
    export function AIR(air: AirType): number {
        if (!co2Inited) {
            pins.i2cWriteNumber(CO2_ADDR, 0x2003, NumberFormat.UInt16BE);
            basic.pause(1000)
            co2Inited = true;
        }
        pins.i2cWriteNumber(CO2_ADDR, 0x2008, NumberFormat.UInt16BE);
        basic.pause(550)
        let buffer = pins.i2cReadBuffer(CO2_ADDR, 6);
        let data = [-1, -1];
        // 解析数据
        data[0] = (buffer[0] << 8) | buffer[1]; // CO2eq
        data[1] = (buffer[3] << 8) | buffer[4]; // TVOC
        basic.pause(50)
        //console.log('CO2eq=' + data[0])
        //console.log('TVOC=' + data[1])
        if (air === AirType.CO2) {
            return data[0]
        }
        else {
            return data[1]
        }
    }

    const AHT20_ADDR = 0x38
    let aht20Inited = false;

    function _aht20Ready(): boolean {
        let stat = pins.i2cReadNumber(AHT20_ADDR, NumberFormat.UInt8BE);
        while (stat & 0x80) {
            stat = pins.i2cReadNumber(AHT20_ADDR, NumberFormat.UInt8BE);
            basic.pause(100)
        }
        return true
    }

    //% blockId=environment block="(ENV.Ⅰ) value %env"
    //% group="I2C" weight=74
    export function ENV(env: EnvType): number {
        if (!aht20Inited) {
            i2cwrite(AHT20_ADDR, 0xba, [])
            basic.pause(50)
            i2cwrite(AHT20_ADDR, 0xa8, [0, 0])
            basic.pause(350)
            i2cwrite(AHT20_ADDR, 0xe1, [0x28, 0])
            aht20Inited = true;
        }
        i2cwrite(AHT20_ADDR, 0xac, [0x33, 0])
        if (_aht20Ready()) {
            const n = pins.i2cReadBuffer(AHT20_ADDR, 6)
            const h = ((n[1] << 16) | (n[2] << 8) | (n[3])) >> 4
            const humi = Math.floor((h * 0.000095) * 100) / 100
            const t = ((n[3] & 0x0f) << 16 | (n[4] << 8) | n[5])
            const temp = Math.floor((t * 0.000191 - 50) * 100) / 100
            return env === EnvType.Humidity ? humi : temp
        }
        return 0;
    }

    //% blockId="envUpdate" block="(ENV.II) update"
    //% group="I2C" weight=73
    export function envUpdate() {
        const CNVRSN_CONFIG = Buffer.fromArray([HP203B_ADC_CVT | HP203B_OSR_1024 | HP203B_CH_PRESSTEMP])
        pins.i2cWriteBuffer(HP203B_ADDRESS, CNVRSN_CONFIG)
    }

    //% blockId="envGetData" block="(ENV.II)get value %pin"
    //% group="I2C" weight=72
    export function envGetData(pin: EnvTypeII): number {
        let presData = i2cread(HP203B_ADDRESS, HP203B_READ_P, 3)
        let pressure = (((presData[0] & 0x0F) * 65536) + (presData[1] * 256) + presData[2]) / 100.00

        let tempData = i2cread(HP203B_ADDRESS, HP203B_READ_T, 3)
        let cTemp = (((tempData[0] & 0x0F) * 65536) + (tempData[1] * 256) + tempData[2]) / 100.00
        const fTemp = (cTemp * 1.8) + 32

        let altData = i2cread(HP203B_ADDRESS, HP203B_READ_A, 3)
        let altitude = (((altData[0] & 0x0F) << 16) + (altData[1] << 8) + altData[2]) / 100.00

        if (pin === EnvTypeII.Pressure) {
            return pressure
        } else if (pin === EnvTypeII.Altitude) {
            return altitude
        } else if (pin === EnvTypeII.CTemp) {
            return cTemp
        } else {
            return fTemp
        }
    }


    const JOYSTICK_ADDR = 0x5c

    //% blockId=joyState block="(Joystick) state %state triggered"
    //% group="I2C" weight=71
    export function joyState(state: JoystickDir): boolean {
        const sta = i2cread(JOYSTICK_ADDR, 1, 1).getNumber(NumberFormat.UInt8BE, 0)
        return (sta & state) != 0;
    }

    //% blockId=joyValue block="(Joystick) value %dir"
    //% group="I2C" weight=70

    export function joyValue(dir: DirType): number {
        const buf = i2cread(JOYSTICK_ADDR, 2, 4)
        const valX = Math.round(buf.getNumber(NumberFormat.Int16LE, 0) * 255 / 2048 - 255)
        const valY = Math.round(buf.getNumber(NumberFormat.Int16LE, 2) * 255 / 2048 - 255)
        return dir === DirType.X ? valX : valY
    }

    let COMMAND_I2C_ADDRESS = 0x24
    let DISPLAY_I2C_ADDRESS = 0x34
    let _SEG = [0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F, 0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71];
    let _intensity = 3
    let TM1650_dbuf = [0, 0, 0, 0]
    function TM1650_cmd(c: number) {
        pins.i2cWriteNumber(COMMAND_I2C_ADDRESS, c, NumberFormat.Int8BE)
    }
    function TM1650_dat(bit: number, d: number) {
        pins.i2cWriteNumber(DISPLAY_I2C_ADDRESS + (bit % 4), d, NumberFormat.Int8BE)
    }


    //% blockId="TM1650_ON" block="(TM1650) turn on"
    //% group="I2C" weight=50
    export function TM1650_on() {
        TM1650_cmd(_intensity * 16 + 1)
    }

    //% blockId="TM1650_OFF" block="(TM1650) turn off"
    //% group="I2C" weight=50
    export function TM1650_off() {
        _intensity = 0
        TM1650_cmd(0)
    }

    //% blockId="TM1650_CLEAR" block="(TM1650) clear"
    //% group="I2C" weight=40
    export function TM1650_clear() {
        TM1650_dat(0, 0)
        TM1650_dat(1, 0)
        TM1650_dat(2, 0)
        TM1650_dat(3, 0)
        TM1650_dbuf = [0, 0, 0, 0]
    }



    /**
     * show a digital in given position
     * @param digit is number (0-15) will be shown, eg: 1
     * @param bit is position, eg: 0
     */
    //% blockId="TM1650_DIGIT" block="(TM1650) show number %num|at %bit place"
    //% group="I2C" weight=45
    //% num.max=15 num.min=0
    export function TM1650_digit(num: number, bit: number) {
        TM1650_dbuf[bit % 4] = _SEG[num % 16]
        TM1650_dat(bit, _SEG[num % 16])
    }

    /**
     * show a number in display
     * @param num is number will be shown, eg: 100
     */
    //% blockId="TM1650_SHOW_NUMBER" block="(TM1650) show int %num"
    //% group="I2C" weight=46
    export function TM1650_showNumber(num: number) {
        if (num < 0) {
            TM1650_dat(0, 0x40) // '-'
            num = -num
        }
        else
            TM1650_digit(Math.idiv(num, 1000) % 10, 0)
        TM1650_digit(num % 10, 3)
        TM1650_digit(Math.idiv(num, 10) % 10, 2)
        TM1650_digit(Math.idiv(num, 100) % 10, 1)
    }

    /**
     * show a number in hex format
     * @param num is number will be shown, eg: 123
     */
    //% blockId="TM1650_SHOW_HEX_NUMBER" block="(TM1650) show hex %num"
    //% group="I2C" weight=44
    export function TM1650_showHex(num: number) {
        if (num < 0) {
            TM1650_dat(0, 0x40) // '-'
            num = -num
        }
        else
            TM1650_digit((num >> 12) % 16, 0)
        TM1650_digit(num % 16, 3)
        TM1650_digit((num >> 4) % 16, 2)
        TM1650_digit((num >> 8) % 16, 1)
    }

    /**
     * show Dot Point in given position，1-4
     * @param bit is positiion, eg: 0
     * @param show is true/false, eg: true
     */
    //% blockId="TM1650_SHOW_DP" block="(TM1650) %num show decimal point at %bit place"
    //% group="I2C" weight=43
    export function TM1650_showDpAt(show: boolean, bit: number) {
        if (show) TM1650_dat(bit, TM1650_dbuf[bit % 4] | 0x80)
        else TM1650_dat(bit, TM1650_dbuf[bit % 4] & 0x7F)
    }

    //% blockId="TM1650_INTENSITY" block="(TM1650) set intensity %dat"
    //% value.min=0 value.max=8 value.defl=8
    //% group="I2C" weight=42
    export function TM1650_setIntensity(dat: number) {
        if ((dat < 0) || (dat > 8))
            return;
        if (dat == 0)
            TM1650_off()
        else {
            _intensity = dat
            TM1650_cmd((dat << 4) | 0x01)
        }
    }
    TM1650_on()

    //% shim=dstemp::celsius
    export function celsius(pin: DigitalPin): number {
        return 32.6;
    }
    //% blockId=sugarDSTemperature block="ds18b20 Get Water Temperature Pin %pin"
    //% group="Resistor Water Temperature Sensor" weight=99
    export function sugarDSTemperature(pin: DigitalPin): number {
        temp = celsius(pin)
        while (temp >= 85 || temp <= -300) {
            temp = celsius(pin)
            basic.pause(100)
        }

        return Math.round(temp)
    }

    /**
     * signal pin
     * @param pin singal pin; eg: DigitalPin.P1
     * @param unit desired conversion unit
     */
    //% blockId=robotbit_holeultrasonicver block="(Ultrasonic Sensor) %pin distance unit %unit"
    //% group="Ultrasonic" weight=40
    export function HoleUltrasonic(pin: DigitalPin, unit: ValueUnit): number {
        pins.setPull(pin, PinPullMode.PullNone);
        // pins.setPull(pin, PinPullMode.PullDown);
        pins.digitalWritePin(pin, 0);
        control.waitMicros(2);
        pins.digitalWritePin(pin, 1);
        control.waitMicros(10);
        pins.digitalWritePin(pin, 0);
        pins.setPull(pin, PinPullMode.PullUp);

        // read pulse
        let d = pins.pulseIn(pin, PulseValue.High, 30000);
        let ret = d;
        // filter timeout spikes
        if (ret == 0 && distanceBuf != 0) {
            ret = distanceBuf;
        }
        distanceBuf = d;
        pins.digitalWritePin(pin, 0);
        basic.pause(15)
        if (parseInt(control.hardwareVersion()) == 2) {
            d = ret * 10 / 58;
        }
        else {
            // return Math.floor(ret / 40 + (ret / 800));
            d = ret * 15 / 58;
        }
        switch (unit) {
            case ValueUnit.Millimeter: return Math.floor(d)
            case ValueUnit.Centimeters: return Math.floor(d / 10)
            default: return d;
        }
    }

    function sleep_simulate() {
        //microbit can't do 1-millisecond delay,so in this way
        for (let index = 0; index < 400; index++) {
        }
    }

    /**
     * get 4x4keyboard value
     * @param scl Tx pin; eg: DigitalPin.P2
     * @param sdo Rx pin; eg: DigitalPin.P12
     */
    //% blockId=keyboard_getKey block="(4x4 keyboard) get value scl %scl sdo %sdo"
    //% group="4x4keyboard" weight=50
    export function keyboard_getKey(scl: DigitalPin, sdo: DigitalPin): string {
        let keyList: number[] = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
        let keyText: string[] = ["*", "7", "4", "1", "3", "6", "9", "#", "A", "B", "C", "D", "0", "8", "5", "2"];
        let i = 0;
        pins.digitalWritePin(scl, 1)
        basic.pause(1)
        i = 0
        for (let index = 0; index < keyList.length; index++) {
            pins.digitalWritePin(scl, 0)
            sleep_simulate()
            keyList[i] = pins.digitalReadPin(sdo)
            pins.digitalWritePin(scl, 1)
            sleep_simulate()
            i += 1
        }
        basic.pause(1)
        for(let index = 0;index < keyList.length;index++){
            if(keyList[index] == 0){
                return keyText[index]
            }
        }
        return "None"

    }



    /**
     * init serial port
     * @param tx Tx pin; eg: SerialPin.P2
     * @param rx Rx pin; eg: SerialPin.P12
     */
    //% blockId=asr_init block="(ASR) init tx %tx rx %rx"
    //% group="ASR" weight=50
    export function asr_init(tx: SerialPin, rx: SerialPin): void {
        serial.redirect(tx, rx, BaudRate.BaudRate115200)
        // serial.setRxBufferSize(6)
        control.inBackground(() => {
            while (1) {
                let a = serial.readString()
                if (a.slice(0, 3) == "asr") {
                    cmd = parseInt(a.substr(3, 3))
                    control.raiseEvent(asrEventId, cmd)
                }
                basic.pause(40)
            }
        })
    }

    //% blockId=asr_init_pw block="(ASR) init port %port"
    //% group="ASR" weight=49
    export function asr_init_pw(port: SerialPorts): void {
        asr_init(PortSerial[port][0], PortSerial[port][1])
    }


    //% blockId=asr_cmd_led block="(ASR) on led speech |%id recognized"
    //% group="ASR" weight=48
    export function on_asr_led(id: LEDCmd, handler: () => void) {
        control.onEvent(asrEventId, id, handler);
    }

    //% blockId=asr_cmd_actuator block="(ASR) on actuator speech |%id recognized"
    //% group="ASR" weight=47
    export function on_asr_act(id: ActCmd, handler: () => void) {
        control.onEvent(asrEventId, id, handler);
    }

    //% blockId=asr_cmd_measure block="(ASR) on measurement speech |%id recognized"
    //% group="ASR" weight=46
    export function on_asr_measure(id: MeasureCmd, handler: () => void) {
        control.onEvent(asrEventId, id, handler);
    }

    //% blockId=asr_cmd_custom block="(ASR) on customized speech |%id recognized"
    //% group="ASR" weight=45
    export function on_asr_custom(id: CustomCmd, handler: () => void) {
        control.onEvent(asrEventId, id, handler);
    }

    //% blockId=asr_tts_int block="(ASR) speak integer |%num"
    //% num.min=-67108864 num.max=67108864
    //% group="ASR" weight=44
    export function asr_tts_int(num: number): void {
        let buf = pins.createBuffer(9);
        buf[0] = 0xAA;
        buf[1] = 0x55;
        buf[2] = TTS_INTEGER_CMD;
        for (let i = 0; i < 4; i++) {
            buf[3 + i] = num & 0xff;
            num = num >> 8;
        }
        buf[7] = 0x55;
        buf[8] = 0xAA;
        serial.writeBuffer(buf)
    }

    //% blockId=asr_tts_double block="(ASR) speak double |%num"
    //% group="ASR" weight=43
    export function asr_tts_double(num: number): void {
        num = Math.floor(num * 100) / 100
        let binNum: string = ""
        let integerNum: number = Math.floor(num)
        let decimalsNum: number = num % 1
        let move: number = 0
        let significand: string = ""
        let dispose: number = decimalsNum
        while (1) {
            dispose = dispose * 2
            if (dispose >= 1) {
                binNum += "1"
                dispose = dispose % 1
            } else {
                binNum += "0"
            }

            if (dispose % 1 == 0) {
                break
            }
        }
        let i: number = 0
        let integerBin: string = ""
        if (num > 1) {
            while (1) {
                if (Math.floor(num) >> i == 1) {
                    move = 1023 + i
                    break
                } else if (Math.floor(num) >> i & 1) {
                    integerBin = "1" + integerBin
                } else {
                    integerBin = "0" + integerBin
                }
                i++
            }
            significand = integerBin + binNum
        } else {
            //left move
            let sf: boolean = false
            while (1) {
                if (i == binNum.length) {
                    break
                }
                if (sf) {
                    if (binNum[i] == "1") {
                        significand += "1"
                    } else {
                        significand += "0"
                    }
                } else {
                    if (binNum[i] == '1') {
                        move = 1023 - (i + 1)
                        sf = true
                    }
                }
                i++
            }
        }
        while (significand.length < 52) {
            significand += "0"
        }

        let symbol: number = 0
        if (num < 0) {
            symbol = 1
        }

        let buf = pins.createBuffer(13);
        buf[0] = 0xAA;
        buf[1] = 0x55;
        buf[2] = TTS_DOUBLE_CMD;
        buf[10] = (symbol << 7) | (move >> 4)
        buf[9] = ((0xf & move) << 4) | parseInt(significand.slice(0, 4), 2)
        buf[8] = parseInt(significand.slice(4, 12), 2)
        buf[7] = parseInt(significand.slice(12, 20), 2)
        buf[6] = parseInt(significand.slice(20, 28), 2)
        buf[5] = parseInt(significand.slice(28, 36), 2)
        buf[4] = parseInt(significand.slice(36, 44), 2)
        buf[3] = parseInt(significand.slice(44, 52), 2)
        buf[11] = 0x55;
        buf[12] = 0xAA;
        serial.writeBuffer(buf)
    }

    /**
     * Speak Date
     * @param year year of date; eg: 2022
     * @param month month of date; eg: 6
     * @param day day of date; eg: 6
    */
    //% blockId=asr_tts_date block="(ASR) speak date - year|%year month|%month day|%day"
    //% year.min=0 year.max=10000
    //% month.min=1 month.max=12
    //% day.min=1 day.max=31
    //% group="ASR" weight=42
    export function asr_tts_date(year: number, month: number, day: number): void {
        let buf = pins.createBuffer(11);
        buf[0] = 0xAA;
        buf[1] = 0x55;
        buf[2] = TTS_DATE_CMD;
        for (let y = 0; y < 4; y++) {
            buf[3 + y] = year & 0xff;
            year = year >> 8;
        }
        buf[7] = month & 0xff;
        buf[8] = day & 0xff;
        buf[9] = 0x55;
        buf[10] = 0xAA;
        serial.writeBuffer(buf)
    }

    /**
     * Speak Time
     * @param hour hour of time; eg: 18
     * @param minute minute of time; eg: 30
    */
    //% blockId=asr_tts_time block="(ASR) speak time - hour|%hour minute|%minute"
    //% hour.min=0 hour.max=24
    //% minute.min=0 minute.max=59
    //% group="ASR" weight=41
    export function asr_tts_time(hour: number, minute: number): void {
        let buf = pins.createBuffer(7);
        buf[0] = 0xAA;
        buf[1] = 0x55;
        buf[2] = TTS_TIME_CMD;
        buf[3] = hour & 0xff;
        buf[4] = minute & 0xff;
        buf[5] = 0x55;
        buf[6] = 0xAA;
        serial.writeBuffer(buf)
    }

    //% blockId=asr_tts_words block="(ASR) speak words |%id"
    //% group="ASR" weight=40
    export function asr_tts_words(id: WordsID): void {
        let buf = pins.createBuffer(5);
        buf[0] = 0xAA;
        buf[1] = 0x55;
        buf[2] = id;
        buf[3] = 0x55;
        buf[4] = 0xAA;
        serial.writeBuffer(buf)
    }


    /**
     * init serial port
     * @param tx Tx pin; eg: SerialPin.P2
     * @param rx Rx pin; eg: SerialPin.P12
     */
    //% blockId=gesture_init block="(Gesture) init tx %tx rx %rx"
    //% group="Gesture" weight=51
    export function gesture_init(tx: SerialPin, rx: SerialPin): void {
        serial.redirect(tx, rx, BaudRate.BaudRate9600)
        control.inBackground(() => {
            while (1) {
                let a = serial.readBuffer(4)
                if (a) {
                    if (a.length >= 4) {
                        if (a[0] == 0xAA && a[3] == 0x55) {
                            gesturesOperate = gestureMap(a[1])
                            control.raiseEvent(gestureEventId, a[1])
                        }
                    }
                }
                basic.pause(40)
            }
        })
    }

    //% blockId=get_gesture block="(Gesture) gesture is |%gestureType "
    //% group="Gesture" weight=50
    export function get_gesture(): string {
        let transfer = gesturesOperate
        gesturesOperate = null
        return transfer

    }

    //% blockId=gesture_dispose block="(Gesture)When %gestureType gesture is received"
    //% group="Gesture" weight=46
    export function gesture_dispose(gestureType: GestureType,handler: () => void) {
        control.onEvent(gestureEventId, gestureType, handler);
    }



    /**
     * init serial port
     * @param tx Tx pin; eg: SerialPin.P2
     * @param rx Rx pin; eg: SerialPin.P12
     */
    //% blockId=fpv_init block="(Camera) init tx %tx rx %rx"
    //% group="FPV Camera" weight=51
    export function fpv_init(tx: SerialPin, rx: SerialPin): void {
        serial.redirect(tx, rx, BaudRate.BaudRate115200)
        // serial.setRxBufferSize(6)
        let sum: number = 0
        while (1) {

            basic.clearScreen()
            led.plot(sum, 2)
            basic.pause(1000)
            sum += 1
            if (sum == 5) {
                sum = 0
            }

            serial.writeString("K0 \r\n")
            basic.pause(1000)
            if (serial.readString().includes("K0")) {
                basic.clearScreen()
                break
            }
        }
        control.inBackground(() => {
            while (1) {
                let a = serial.readString()
                if (a.slice(0, 3) == "K11") {
                    qrcode = a.substr(4).trim()
                    control.raiseEvent(fpvEventId, QRcodeId)
                } else if (a.slice(0, 3) == "K22") {
                    let dataK22 = a.substr(4).trim().split(" ")
                    mqttMessage = dataK22[0]
                    mqttTopicL = dataK22[1]
                    control.raiseEvent(fpvEventId, TopicMesId)
                } else if (a.slice(0, 3) == "K19") {
                    let btnID: number = parseInt(a.substr(4).trim())
                    control.raiseEvent(fpvEventId, btnID)
                } else if (a.slice(0, 3) == "K12") {
                    asrText = a.substr(4).trim()
                    control.raiseEvent(fpvEventId, AsrTextId)
                } else if (a.slice(0, 2) == "K4") {
                    ipAddress = a.substr(3).trim()
                }
                basic.pause(40)
            }
        })
    }

    //% blockId=fpv_IPAddress block="(Camera) ip Address"
    //% group="FPV Camera" weight=50
    export function fpv_IPAddress(): string {
        basic.pause(500)
        let str = `K4 \r\n`
        serial.writeString(str)
        basic.pause(2000)
        return ipAddress
    }

    //% blockId=fpv_connectWifi block="(Camera) connect to wifi %ssid pwd %pwd"
    //% group="FPV Camera" weight=50
    export function fpv_connectWifi(ssid: string, pwd: string): void {
        let str = `K26 ${ssid} ${pwd} \r\n`
        serial.writeString(str)
    }

    //% blockId=fpv_colorTuple block="red %r green %g blue %b"
    //% group="FPV Camera" weight=49
    export function fpv_colorTuple(r: number, g: number, b: number): number {
        let color: number = 0
        color = (r << 16) + (g << 8) + b
        return color
    }

    //% blockId=colorDefault block="%color"
    //% group="FPV Camera" weight=49
    export function colorDefault(color: ColorPreset): number {
        return color
    }

    //% blockId=fpv_setColor block="(Camera) set rgb |%color1=colorDefault |%color2=colorDefault"
    //% group="FPV Camera" weight=48
    export function fpv_setColor(color1: number, color2: number): void {
        basic.pause(500)
        let str = `K16 (${(color1 >> 16) & 0xFF},${(color1 >> 8) & 0xFF},${color1 & 0xFF}) (${(color2 >> 16) & 0xFF},${(color2 >> 8) & 0xFF},${color2 & 0xFF}) \r\n`
        serial.writeString(str)
        basic.pause(500)
    }


    /**
     * @param picFile filePath; eg: pic.jpg
     */
    //% blockId=fpv_take_picture block="(Camera) take photo and save %picFile"
    //% group="FPV Camera" weight=43
    export function fpv_take_picture(picFile: string): void {
        basic.pause(500)
        let str = `K27 ${picFile} \r\n`
        serial.writeString(str)
        basic.pause(500)
    }

    /**
     * @param file filePath; eg: hello.mp3                                                                                                                                                                                                                                                                                            
     */
    //% blockId=fpv_playAudio block="(Camera) play mp3 %file"
    //% group="FPV Camera" weight=44
    export function fpv_playAudio(file: string): void {
        basic.pause(500)
        let str = `K15 ${file} \r\n`
        serial.writeString(str)
        basic.pause(500)
    }


    //% blockId=fpv_Qrcode_scan block="(Camera) scan QRcode"
    //% group="FPV Camera" weight=47
    export function fpv_Qrcode_scan(): void {
        basic.pause(500)
        let str = `K11 \r\n`
        serial.writeString(str)
        basic.pause(500)
    }

    //% blockId=fpv_QRcode block="(Camera)on QRcode is scanned"
    //% group="FPV Camera" weight=46 draggableParameters=reporter
    export function fpv_QRcode(handler: (qrcode: string) => void) {
        control.onEvent(fpvEventId, QRcodeId, () => {
            handler(qrcode);
        });
    }

    /**
     * @param address Service address; eg: iot.kittenbot.cn
     * @param client device name; eg: sugar_camera
     */
    //% blockId=fpv_mqtt_connectNoUser block="(Camera) connection mqtt server %address client %client"
    //% group="FPV Camera" weight=41
    export function fpv_mqtt_connectNoUser(address: string, client: string): void {
        basic.pause(500)
        let str = `K20 ${address} ${client} \r\n`
        serial.writeString(str)
        basic.pause(500)
    }

    /**
     * @param address Service address; eg: iot.kittenbot.cn
     * @param client device name; eg: sugar_camera
     * @param userid user name; eg: username
     * @param pwd password; eg: password
     */
    //% blockId=fpv_mqtt_connect block="(Camera) connect mqtt server %address client %client username %userid password %pwd"
    //% group="FPV Camera" weight=42
    export function fpv_mqtt_connect(address: string, client: string, userid: string, pwd: string): void {
        basic.pause(500)
        let str = `K20 ${address} ${client} ${userid} ${pwd} \r\n`
        serial.writeString(str)
        basic.pause(500)
    }

    /**
     * @param topic topic name; eg: /topic
     */
    //% blockId=fpv_mqtt_subscription block="(Camera) subscribe mqtt topic %topic"
    //% group="FPV Camera" weight=40
    export function fpv_mqtt_subscription(topic: string): void {
        basic.pause(500)
        let str = `K21 ${topic} \r\n`
        serial.writeString(str)
        basic.pause(500)
    }

    /**
     * @param topic topic name; eg: /topic
     * @param message topic message; eg: hello
     */
    //% blockId=fpv_mqtt_sendMessage block="(Camera) Give the topic %topic send a %message"
    //% group="FPV Camera" weight=37
    export function fpv_mqtt_sendMessage(topic: string, message: string): void {
        basic.pause(500)
        let str = `K23 ${topic} ${message} \r\n`
        serial.writeString(str)
        basic.pause(500)
    }

    //% blockId=fpv_mqtt_getmessage block="(Camera) get mqtt topic message"
    //% group="FPV Camera" weight=39
    export function fpv_mqtt_getmessage(): void {
        basic.pause(1000)
        let str = `K22 \r\n`
        serial.writeString(str)
        basic.pause(1000)
    }

    //% blockId=fpv_mqtt_message block="(Camera) on mqtt topic received"
    //% group="FPV Camera" weight=38 draggableParameters=reporter
    export function fpv_mqtt_message(handler: (mqttTopicL: string, mqttMessage: string) => void) {
        control.onEvent(fpvEventId, TopicMesId, () => {
            handler(mqttTopicL, mqttMessage);
        });
    }

    //% blockId=on_fpv_btn block="(Camera) on button |%btn is pressed"
    //% group="FPV Camera" weight=36
    export function on_fpv_btn(btn: BTNCmd, handler: () => void) {
        control.onEvent(fpvEventId, btn, handler);
    }

    //% blockId=fpv_asr_dispose block="(Camera) on speech recognition is complete"
    //% group="FPV Camera" weight=45 draggableParameters=reporter
    export function fpv_asr_dispose(handler: (asrText: string) => void) {
        control.onEvent(fpvEventId, AsrTextId, () => {
            handler(asrText);
        });
    }

    //% blockId=fpv_asr block="(Camera) speech recognition |%s seconds (English)"
    //% group="FPV Camera" weight=45
    //% s.min=0 s.max=3 s.defl=2
    export function fpv_asr(s: number): void {
        basic.pause(500)
        let str = `K12 ${s} 1737 \r\n`
        serial.writeString(str)
        basic.pause(500)
    }

    const COMMANDREG = 0x01
    const COMIENREG = 0x02
    const COMIRQREG = 0x04
    const DIVIRQREG = 0x05
    const ERRORREG = 0x06
    const STATUS2REG = 0x08
    const FIFODATAREG = 0x09
    const FIFOLEVELREG = 0x0A
    const CONTROLREG = 0x0C
    const BITFRAMINGREG = 0x0D
    const MODEREG = 0x11
    const TXCONTROLREG = 0x14
    const TXASKREG = 0x15
    const CRCRESULTREGMSB = 0x21
    const CRCRESULTREGLSB = 0x22
    const TMODEREG = 0x2A
    const TPRESCALERREG = 0x2B
    const TRELOADREGH = 0x2C
    const TRELOADREGL = 0x2D
    const VERSIONREG = 0x37
    const MRFC522_IDLE = 0x00
    const MRFC522_CALCCRC = 0x03
    const MRFC522_TRANSCEIVE = 0x0C
    const MRFC522_MFAUTHENT = 0x0E
    const MRFC522_SOFTRESET = 0x0F

    const MIFARE_REQUEST = [0x26]
    const MIFARE_WAKEUP = [0x52]
    const MIFARE_ANTICOLCL1 = [0x93, 0x20]
    const MIFARE_SELECTCL1 = [0x93, 0x70]
    const MIFARE_ANTICOLCL2 = [0x95, 0x20]
    const MIFARE_SELECTCL2 = [0x95, 0x70]
    const MIFARE_HALT = [0x50, 0x00]
    const MIFARE_AUTHKEY1 = [0x60]
    const MIFARE_AUTHKEY2 = [0x61]
    const MIFARE_READ = [0x30]
    const MIFARE_WRITE = [0xA0]
    const MIFARE_DECREMENT = [0xC0]
    const MIFARE_INCREMENT = [0xC1]
    const MIFARE_RESTORE = [0xC2]
    const MIFARE_TRANSFER = [0xB0]

    const MIFARE_USERDATA = [1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18,
        20, 21, 22, 24, 25, 26, 28, 29, 30, 32, 33, 34, 36, 37,
        38, 40, 41, 42, 44, 45, 46, 48, 49, 50, 52, 53, 54, 56,
        57, 58, 60, 61, 62]

    const MI_OK = 0
    const MI_NOTAGERR = 1
    const MI_ERR = 2

    const MAX_LEN = 16

    const i2caddress = 0x28

    class rfid {
        constructor() {
            this.mrfc522_init()
        }

        showReaderDetails(): number {
            let version = this.mrfc522_read(VERSIONREG)
            return 0
        }

        mrfc522_reset() {
            this.mrfc522_write(COMMANDREG, MRFC522_SOFTRESET)
        }

        mrfc522_init() {
            this.mrfc522_reset()
        }

        mrfc522_antennaOn() {

        }

        mrfc522_setBitMask(address: number, mask: number) {

        }

        mrfc522_read(address: number): number {
            let value: number = pins.i2cReadNumber(i2caddress, address)
            return value
        }

        mrfc522_write(address: number, value: number) {
            pins.i2cWriteNumber(i2caddress, address << 8 | value, NumberFormat.UInt16BE)
        }
    }


}

//% color="#fe99d4" weight=10 icon="\uf0e7" block="SugarBox" blockId="SugarBox"
//% groups='["Basic", "Actuators", "Encoded Motor", "Dual Encoded Motor", "Audio"]'
namespace SugarBox {
    const MODE_IDLE = 0x08
    const MODE_SPEED = 0x1
    const MODE_HOLD = 0x2
    const MODE_RUNPOS = 0x4 // there is some end position
    const MODE_ABSOLU = 0x8
    const MODE_DELAY = 0x10
    const MODE_STUCK = 0x20
    const MODE_RAMPDN = 0x40
    const MODE_TOSTOP = 0x80

    enum E_PARAM {
        Kp = 1,
        Ki = 2,
        Kd = 3,
        POSITION = 4,
        SPEED = 5,
        PULSE = 6,
        GEARRATIO = 7,
        LOOPMS = 8,
        Kp_hold = 9,
        Ki_hold = 10,
        Kd_hold = 11,
        RAMPDOWN = 12
    }



    const SGBOX_ADDR = 29
    const REG_SERVO = 0x1
    const REG_MOTOR = 0x2
    const REG_PIDRUN = 0x3
    const REG_PIDSAV = 0x4
    const REG_PIDLOD = 0x5
    const REG_DUALRUN = 0x6
    const REG_VOLTAG = 0x8
    const REG_PIDRESET = 0x9
    export enum MPort {
        M1A = 1,
        M1B = 2,
        M2A = 3,
        M2B = 4
    }

    export enum SPort {
        S1 = 1,
        S2 = 2,
        S3 = 3,
        S4 = 4
    }

    export enum EPort {
        EM1 = 1,
        EM2 = 2,
    }

    export enum DSetup {
        //% block="EM1 at Left"
        LR = 1,
        //% block="EM2 at Left"
        RL = 2
    }

    function _i2cWriteBH(reg: number, index: number, value: number) {
        const buff = pins.createBuffer(4) // reg, int16
        buff[0] = reg
        buff[1] = index
        buff.setNumber(NumberFormat.Int16LE, 2, value)
        pins.i2cWriteBuffer(SGBOX_ADDR, buff)
    }

    function _i2cReadF(port: EPort, p: E_PARAM): number {
        let _reg = port == EPort.EM1 ? 0x60 : 0x70
        _reg |= p
        return i2cread(SGBOX_ADDR, _reg, 4).getNumber(NumberFormat.Float32LE, 0)
    }

    /**
     * The firmware of sugarbox took a little longer than microbit to init
     */
    //% blockId=waitready block="wait for sugarbox"
    //% group="Basic" weight=100
    export function waitready() {
        let bat = 0
        while (bat === 0) {
            bat = battery()
            basic.pause(200)
        }
    }

    //% blockId=battery block="battery voltage"
    //% group="Basic" weight=100
    export function battery(): number {
        return i2cread(SGBOX_ADDR, REG_VOLTAG, 4).getNumber(NumberFormat.Float32LE, 0)
    }

    //% blockId=motor_spd block="Motor|%port speed %speed"
    //% speed.min=-255 speed.max=255 speed.defl=0
    //% group="Actuators" weight=50
    export function motorSpd(port: MPort, speed: number) {
        _i2cWriteBH(REG_MOTOR, port, speed)
    }

    //% blockId=motor_stop block="motor|%port stop"
    //% group="Actuators" weight=49
    export function motorStop(port: MPort) {
        _i2cWriteBH(REG_MOTOR, port, 0)
    }

    //% blockId=motor_stop_all block="stop all motor "
    //% group="Actuators" weight=48
    export function motorStopAll() {
        for (let idx = 1; idx <= 4; idx++) {
            motorStop(idx);
        }
    }

    //% blockId=servo2kg block="2KG servo|%port angle %angle"
    //% angle.min=0 angle.max=360 angle.defl=90
    //% group="Actuators" weight=47
    export function servo2kg(port: SPort, angle: number) {
        const us = Math.floor(angle * 200 / 36 + 500) // 2kg
        servoPulse(port, us)
    }

    //% blockId=servo_pulse block="servo|%port pulse %us us"
    //% us.min=500 us.max=2500 us.defl=1500
    //% group="Actuators" weight=46
    export function servoPulse(port: SPort, us: number) {
        _i2cWriteBH(REG_SERVO, port, us)
    }

    function _emotorReset(port: EPort) {
        i2cwrite(SGBOX_ADDR, REG_PIDRESET, [port, 0])
    }

    function _pidRun(port: EPort, mode: number, speed: number, param2: number, wait: boolean = true) {
        const buf = pins.createBuffer(11) // reg,B,B,f,f
        buf[0] = REG_PIDRUN
        buf[1] = port
        buf[2] = mode
        buf.setNumber(NumberFormat.Float32LE, 3, speed)
        buf.setNumber(NumberFormat.Float32LE, 7, param2)
        pins.i2cWriteBuffer(SGBOX_ADDR, buf)
        if (wait) {
            let _reg = port == EPort.EM1 ? 0x60 : 0x70
            while (mode != 0) {
                mode = i2cread(SGBOX_ADDR, _reg, 1)[0]
                if (mode & MODE_STUCK) {
                    _emotorReset(port)
                    return -1;
                }
                basic.pause(200)
            }
        }
        return 0
    }

    //% blockId=enc_init block="emotor|%port init"
    //% group="Encoded Motor" weight=40
    export function encMotorInit(port: EPort) {
        _emotorReset(port)
    }

    //% blockId=enc_rpm_set block="emotor %port run %spd rpm"
    //% spd.min=-300 spd.max=300 spd.defl=120
    //% group="Encoded Motor" weight=39
    export function eMotorSetRpm(port: EPort, spd: number) {
        spd = spd / 60 // from rpm to rnd per sec
        _pidRun(port, MODE_SPEED, spd, 0, false)
    }

    //% blockId=enc_stop block="emotor %port stop"
    //% group="Encoded Motor" weight=39
    export function eMotorStop(port: EPort) {
        _pidRun(port, MODE_SPEED, 0, 0, false)
    }

    //% blockId=enc_rpm_get block="emotor %port get speed(rpm)"
    //% group="Encoded Motor" weight=38
    export function eMotorGetRpm(port: EPort): number {
        return _i2cReadF(port, E_PARAM.SPEED)
    }


    //% blockId=enc_goto block="emotor %port goto degree %degree speed %rpm rpm"
    //% group="Encoded Motor" weight=37
    function eMotorGoto(port: EPort, degree: number, rpm: number) {
        // speed to RPSec, degree to round
        const speed = rpm / 60
        const rnd = degree / 360
        _pidRun(port, MODE_SPEED | MODE_RUNPOS, speed, rnd, true)
    }


    //% blockId=enc_set_pos block="emotor %port to position %degree"
    //% group="Encoded Motor" weight=36
    export function eMotorSetPos(port: EPort, degree: number) {
        // speed to RPSec, degree to round
        const speed = 2 // 120 rpm
        const rnd = degree / 360
        const mode = MODE_SPEED | MODE_RUNPOS | MODE_ABSOLU
        _pidRun(port, mode, speed, rnd, true)
    }


    //% blockId=enc_position block="emotor %port Position degree"
    //% group="Encoded Motor" weight=35
    export function eMotorPos(port: EPort): number {
        return _i2cReadF(port, E_PARAM.POSITION)
    }


    //% blockId=enc_move_deg block="emotor %port Move By Degree %degree speed %speed rpm"
    //% speed.min=-300 speed.max=300 speed.defl=120
    //% group="Encoded Motor" weight=34
    export function eMotorMoveDeg(port: EPort, degree: number, speed: number) {
        eMotorGoto(port, degree, speed)
    }

    //% blockId=enc_move_rnd block="emotor %port Move Round %rnd speed %speed rpm"
    //% speed.min=-300 speed.max=300 speed.defl=120
    //% group="Encoded Motor" weight=34
    export function eMotorMoveRnd(port: EPort, rnd: number, speed: number) {
        eMotorGoto(port, rnd * 360, speed)
    }

    //% blockId=enc_move_delay block="emotor %port move delayed %t sec speed %speed rpm"
    //% speed.min=-300 speed.max=300 speed.defl=120
    //% group="Encoded Motor" weight=34
    export function eMotorMoveDelayed(port: EPort, t: number, speed: number) {
        const mode = MODE_SPEED | MODE_DELAY
        _pidRun(port, mode, speed, t * 1000, true)
    }

    // initial params in CM
    let _R = 6
    let _W = 12
    let _Setup = 1

    const MODE_RUN = 0x1
    const MODE_TURN = 0x2

    function _dmotorReset() {
        i2cwrite(SGBOX_ADDR, REG_PIDRESET, [3, _Setup])
    }

    function _dualMotorRun(mode: number, v: number, w: number, rnd: number, wait: boolean = true) {
        const buf = pins.createBuffer(14) // reg B,f,f,f
        buf[0] = REG_DUALRUN
        buf[1] = mode
        buf.setNumber(NumberFormat.Float32LE, 2, v) // forward linear speed
        buf.setNumber(NumberFormat.Float32LE, 6, w) // angular speed
        buf.setNumber(NumberFormat.Float32LE, 11, rnd)
        pins.i2cWriteBuffer(SGBOX_ADDR, buf)
        if (wait) {
            let _reg = 0x80
            while (mode != 0) {
                mode = i2cread(SGBOX_ADDR, _reg, 1)[0]
                if (mode & MODE_STUCK) {
                    _dmotorReset()
                    return -1;
                }
                basic.pause(200)
            }
        }
        return 0
    }

    /**
     * 
     * @param diameter wheel diameter in cm eg: 6
     * @param width track width cm eg:12
     * @param setup define left/right motor eg:1
     * @param inversed move direction inversed eg:false
     */
    //% blockId=denc_init block="dual emotor init|wheel diameter(cm) %diameter|track width(cm) %width||setup %setup ||inversed %inversed"
    //% group="Dual Encoded Motor" weight=30
    export function dualMotorInit(diameter: number, width: number, setup: DSetup = 1, inversed: boolean = false) {
        _Setup = 0
        _R = diameter
        _W = width
        if (setup == DSetup.RL) {
            _Setup |= 0x1
        }
        if (inversed) {
            _Setup |= 0x2
        }
        _dmotorReset()
    }

    /**
     * 
     * @param distance distance to move cm eg: 20
     * @param speed speed in rpm eg: 120
     */
    //% blockId=denc_move block="move %distance cm, speed %speed cm/s"
    //% group="Dual Encoded Motor" weight=28
    export function dualMotorMove(distance: number, speed: number) {
        const rnd = distance / (Math.PI * _R)
        speed = speed / (Math.PI * _R)
        _dualMotorRun(MODE_RUN, speed, 0, rnd)
    }

    /**
     * 
     * @param degree degree to turn eg: 180
     * @param w rotation speed degree/s eg: 90
     * @param v forward speed cm/s eg: 0
     */
    //% blockId=denc_turn block="turn degree %degree, speed %w degree/s, forward speed %v cm/s"
    //% group="Dual Encoded Motor" weight=27
    export function dualMotorTurn(degree: number, w: number, v: number) {
        const speed = v / (Math.PI * _R) // in round/s
        const diff = w * _W / _R / 360 // wheel difference
        const rnd = 2 * (degree / w) * diff
        _dualMotorRun(MODE_TURN, speed, diff, rnd)
    }
}