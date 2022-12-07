/*
KittenBot Team
A series of sensors
"sugar": "file:../pxt-sugar"
*/

function i2cwrite( addr: number, reg: number, value: number[] ) {
    let a = [reg]
    if ( value.length )
        a = a.concat( value )
    return pins.i2cWriteBuffer( addr, Buffer.fromArray( a ) )
}

function i2cread( addr: number, reg: number, size: number ) {
    pins.i2cWriteNumber( addr, reg, NumberFormat.UInt8BE );
    return pins.i2cReadBuffer( addr, size );
}

//% color="#49cef7" weight=10 icon="\uf1b0"
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

    type EvtAct = () => void

    let ledEvt: EvtAct = null;
    let actEvt: EvtAct = null;
    let meaEvt: EvtAct = null;
    let cosEvt: EvtAct = null;
    let asrEventId = 6666
    let cmd = 0

    const PortSerial = [
        [SerialPin.P0, SerialPin.P8],
        [SerialPin.P1, SerialPin.P12],
        [SerialPin.P2, SerialPin.P13],
        [SerialPin.P14, SerialPin.P15]
    ]

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
        //% block="bedroom light off"
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


    //% blockId=pir block="(PIR) Motion Detected %pin"
    //% group="digitalIn" weight=90
    export function PIR( pin: DigitalPin ): boolean {
        return pins.digitalReadPin( pin ) == 1
    }

    //% blockId=tracer block="(Tracker) Black Dectected %pin"
    //% group="digitalIn" weight=89
    export function Tracker( pin: DigitalPin ): boolean {
        return pins.digitalReadPin( pin ) == 1
    }

    //% blockId=hall block="(Hall) Magnetic Detected %pin"
    //% group="digitalIn" weight=88
    export function Hall( pin: DigitalPin ): boolean {
        return pins.digitalReadPin( pin ) == 0
    }

    //% blockId=button block="(Button) Pressed %pin"
    //% group="digitalIn" weight=87
    export function Button( pin: DigitalPin ): boolean {
        pins.setPull( pin, PinPullMode.PullUp )
        return pins.digitalReadPin( pin ) == 0
    }

    //% blockId=onButtonEvent block="on Button|%pin pressed"
    //% group="digitalIn" weight=86
    export function onButtonEvent( pin: DigitalPin, handler: () => void ): void {
        pins.setPull( pin, PinPullMode.PullUp )
        pins.onPulsed( pin, PulseValue.Low, handler )
    }

    //% blockId=Crash block="(Crash) %pin crash"
    //% group="digitalIn" weight=79
    export function Crash( pin: DigitalPin ): boolean {
        return pins.digitalReadPin( pin ) == 1
    }

    //% blockId=Touch block="(Touch) %pin Touch"
    //% group="digitalIn" weight=78
    export function Touch( pin: DigitalPin ): boolean {
        return pins.digitalReadPin( pin ) == 1
    }

    //% blockId=led_toggle block="(LED) %pin| %onoff"
    //% group="digitalOut" weight=85
    export function ledOnoff( pin: DigitalPin, onoff: LEDSta ) {
        pins.digitalWritePin( pin, onoff ? 1 : 0 )
    }

    //% blockId=led_luminent block="(LED) %pin| Luminent %value"
    //% value.min=0 value.max=1023 value.defl=0
    //% group="digitalOut" weight=84
    export function ledLuminent( pin: AnalogPin, value: number ) {
        pins.analogWritePin( pin, value )
    }

    //% blockId=Buzzer block="(Buzzer) have buzzer %pin| %onoff"
    //% group="digitalOut" weight=83
    export function Buzzer( pin: DigitalPin, onoff: Switch ) {
        pins.digitalWritePin( pin, onoff ? 1 : 0 )
    }

    //% blockId=Laser block="(Laser) red dot laser %pin| %onoff"
    //% group="digitalOut" weight=82
    export function Laser( pin: DigitalPin, onoff: Switch ) {
        pins.digitalWritePin( pin, onoff ? 1 : 0 )
    }

    //% blockId=vibeMotor block="(Vibe Motor) %pin| %onoff"
    //% group="digitalOut" weight=81
    export function vibeMotor( pin: DigitalPin, onoff: Switch ) {
        pins.digitalWritePin( pin, onoff ? 1 : 0 )
    }

    //% blockId=flameBool block="(Flame) Flame Detected %pin "
    //% group="digitalIn" weight=80
    export function FlameDigi( pin: DigitalPin ): boolean {
        return pins.digitalReadPin( pin ) == 1
    }

    //% blockId=flameAnalog block="(Flame) %pin"
    //% group="analogIn" weight=84

    export function FlameAna( pin: AnalogPin ): number {
        return pins.analogReadPin( pin )
    }

    //% blockId=potential block="(Angle) %pin"
    //% group="analogIn" weight=83

    export function Angle( pin: AnalogPin ): number {
        return pins.analogReadPin( pin )
    }

    //% blockId=lightlvl block="(Light) %pin"
    //% group="analogIn" weight=82

    export function Light( pin: AnalogPin ): number {
        return pins.analogReadPin( pin )
    }

    //% blockId=soilmoisture block="(SoilMoisture) %pin"
    //% group="analogIn" weight=81

    export function SoilMoisture( pin: AnalogPin ): number {
        return pins.analogReadPin( pin )
    }

    //% blockId=rain block="(WaterLevel) Digital %pin"
    //% group="digitalIn" weight=80

    export function WaterLevelDigi( pin: DigitalPin ): boolean {
        return pins.digitalReadPin( pin ) == 1
    }

    //% blockId=waterlvl block="(WaterLevel) Analog %pin"
    //% group="analogIn" weight=79
    export function WaterLevelAna( pin: AnalogPin ): number {
        return pins.analogReadPin( pin )
    }

    //% blockId=infraRx block="On Infra %pin Received"
    //% group="Special" weight=78
    export function InfraRx( pin: AnalogPin, handler: ( data: string ) => void ) {

    }

    //% blockId=infraTx block="Infra %pin Transmit %data"
    //% group="Special" weight=78

    export function InfraTx( pin: AnalogPin, data: string ) {

    }

    // //% blockId=tempSensor block="(DS18B20) Temperature Sensor %pin"
    // //% group="Special" weight=77
    // export function tempSensor(pin: DigitalPin):string {
    //     return  '温度：16℃'
    // }

    const VL53L0X_ADDR = 0x5e;
    let vl53Inited = false;

    //% blockId=tof block="(TOF Distance) mm"
    //% group="I2C" weight=76

    export function TOFDistance(): number {
        if ( !vl53Inited ) {
            let buf = pins.createBuffer( 3 )
            buf[0] = 1
            pins.i2cWriteBuffer( VL53L0X_ADDR, buf )
            vl53Inited = true
            control.waitMicros( 50 )
        }
        pins.i2cWriteNumber( VL53L0X_ADDR, 0x1, NumberFormat.UInt8BE );
        return pins.i2cReadNumber( VL53L0X_ADDR, NumberFormat.UInt16LE );
    }

    const AHT20_ADDR = 0x38
    let aht20Inited = false;

    function _aht20Ready(): boolean {
        let stat = pins.i2cReadNumber( AHT20_ADDR, NumberFormat.UInt8BE );
        while ( stat & 0x80 ) {
            stat = pins.i2cReadNumber( AHT20_ADDR, NumberFormat.UInt8BE );
            basic.pause( 100 )
        }
        return true
    }

    //% blockId=environment block="(ENV) %env"
    //% group="I2C" weight=74
    export function ENV( env: EnvType ): number {
        if ( !aht20Inited ) {
            i2cwrite( AHT20_ADDR, 0xba, [] )
            basic.pause( 50 )
            i2cwrite( AHT20_ADDR, 0xa8, [0, 0] )
            basic.pause( 350 )
            i2cwrite( AHT20_ADDR, 0xe1, [0x28, 0] )
            aht20Inited = true;
        }
        i2cwrite( AHT20_ADDR, 0xac, [0x33, 0] )
        if ( _aht20Ready() ) {
            const n = pins.i2cReadBuffer( AHT20_ADDR, 6 )
            const h = ( ( n[1] << 16 ) | ( n[2] << 8 ) | ( n[3] ) ) >> 4
            const humi = Math.round( h * 0.000095 )
            const t = ( ( n[3] & 0x0f ) << 16 | ( n[4] << 8 ) | n[5] )
            const temp = Math.round( t * 0.000191 - 50 )
            return env === EnvType.Humidity ? humi : temp
        }
        return 0;
    }

    const JOYSTICK_ADDR = 0x5c

    //% blockId=joyState block="(Joystick) State %state trigger"
    //% group="I2C" weight=72
    export function joyState( state: JoystickDir ): boolean {
        const sta = i2cread( JOYSTICK_ADDR, 1, 1 ).getNumber( NumberFormat.UInt8BE, 0 )
        return ( sta & state ) != 0;
    }

    //% blockId=joyValue block="(Joystick) %dir Value"
    //% group="I2C" weight=72

    export function joyValue( dir: DirType ): number {
        const buf = i2cread( JOYSTICK_ADDR, 2, 4 )
        const valX = Math.round( buf.getNumber( NumberFormat.Int16LE, 0 ) * 255 / 2048 - 255 )
        const valY = Math.round( buf.getNumber( NumberFormat.Int16LE, 2 ) * 255 / 2048 - 255 )
        return dir === DirType.X ? valX : valY
    }

    let COMMAND_I2C_ADDRESS = 0x24
    let DISPLAY_I2C_ADDRESS = 0x34
    let _SEG = [0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F, 0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71];
    let _intensity = 3
    let TM1650_dbuf = [0, 0, 0, 0]
    function TM1650_cmd( c: number ) {
        pins.i2cWriteNumber( COMMAND_I2C_ADDRESS, c, NumberFormat.Int8BE )
    }
    function TM1650_dat( bit: number, d: number ) {
        pins.i2cWriteNumber( DISPLAY_I2C_ADDRESS + ( bit % 4 ), d, NumberFormat.Int8BE )
    }

    //% blockId="TM1650_ON" block="turn on display"
    //% group="I2C" weight=50 blockGap=8
    export function TM1650_on() {
        TM1650_cmd( _intensity * 16 + 1 )
    }

    //% blockId="TM1650_OFF" block="turn off display"
    //% group="I2C" weight=50 blockGap=8
    export function TM1650_off() {
        _intensity = 0
        TM1650_cmd( 0 )
    }

    //% blockId="TM1650_CLEAR" block="clear display"
    //% group="I2C" weight=40 blockGap=8
    export function TM1650_clear() {
        TM1650_dat( 0, 0 )
        TM1650_dat( 1, 0 )
        TM1650_dat( 2, 0 )
        TM1650_dat( 3, 0 )
        TM1650_dbuf = [0, 0, 0, 0]
    }



    /**
     * show a digital in given position
     * @param digit is number (0-15) will be shown, eg: 1
     * @param bit is position, eg: 0
     */
    //% blockId="TM1650_DIGIT" block="show digit %num|at %bit"
    //% group="I2C" weight=60 blockGap=8
    //% num.max=15 num.min=0
    export function TM1650_digit( num: number, bit: number ) {
        TM1650_dbuf[bit % 4] = _SEG[num % 16]
        TM1650_dat( bit, _SEG[num % 16] )
    }

    /**
     * show a number in display
     * @param num is number will be shown, eg: 100
     */
    //% blockId="TM1650_SHOW_NUMBER" block="show number %num"
    //% group="I2C" weight=70 blockGap=8
    export function TM1650_showNumber( num: number ) {
        if ( num < 0 ) {
            TM1650_dat( 0, 0x40 ) // '-'
            num = -num
        }
        else
            TM1650_digit( Math.idiv( num, 1000 ) % 10, 0 )
        TM1650_digit( num % 10, 3 )
        TM1650_digit( Math.idiv( num, 10 ) % 10, 2 )
        TM1650_digit( Math.idiv( num, 100 ) % 10, 1 )
    }

    /**
     * show a number in hex format
     * @param num is number will be shown, eg: 123
     */
    //% blockId="TM1650_SHOW_HEX_NUMBER" block="show hex number %num"
    //% group="I2C" weight=65 blockGap=8
    export function TM1650_showHex( num: number ) {
        if ( num < 0 ) {
            TM1650_dat( 0, 0x40 ) // '-'
            num = -num
        }
        else
            TM1650_digit( ( num >> 12 ) % 16, 0 )
        TM1650_digit( num % 16, 3 )
        TM1650_digit( ( num >> 4 ) % 16, 2 )
        TM1650_digit( ( num >> 8 ) % 16, 1 )
    }

    /**
     * show Dot Point in given position，1-4
     * @param bit is positiion, eg: 0
     * @param show is true/false, eg: true
     */
    //% blockId="TM1650_SHOW_DP" block=" %num show dot point %bit"
    //% group="I2C" weight=60 blockGap=8
    export function TM1650_showDpAt( show: boolean, bit: number ) {
        if ( show ) TM1650_dat( bit, TM1650_dbuf[bit % 4] | 0x80 )
        else TM1650_dat( bit, TM1650_dbuf[bit % 4] & 0x7F )
    }

    /**
     * set display intensity
     * @param dat is intensity of the display, eg: 3
     */
    //% blockId="TM1650_INTENSITY" block="set intensity %dat"
    //% group="I2C" weight=59 blockGap=8
    export function TM1650_setIntensity( dat: number ) {
        if ( ( dat < 0 ) || ( dat > 8 ) )
            return;
        if ( dat == 0 )
            TM1650_off()
        else {
            _intensity = dat
            TM1650_cmd( ( dat << 4 ) | 0x01 )
        }
    }

    TM1650_on()

    //% blockId="envUpdate" block="(ENV.II Model)Barometric Altitude Module update value"
    //% group="I2C" weight=39 blockGap=8
    export function envUpdate() {
        const CNVRSN_CONFIG = Buffer.fromArray( [HP203B_ADC_CVT | HP203B_OSR_1024 | HP203B_CH_PRESSTEMP] )
        pins.i2cWriteBuffer( HP203B_ADDRESS, CNVRSN_CONFIG )
    }

    //% blockId="envGetData" block="(ENV.II Model)Barometric Altitude Module get %pin"
    //% group="I2C" weight=38 blockGap=8
    export function envGetData( pin: EnvTypeII ): number {
        let presData = i2cread( HP203B_ADDRESS, HP203B_READ_P, 3 )
        let pressure = ( ( ( presData[0] & 0x0F ) * 65536 ) + ( presData[1] * 256 ) + presData[2] ) / 100.00

        let tempData = i2cread( HP203B_ADDRESS, HP203B_READ_T, 3 )
        let cTemp = ( ( ( tempData[0] & 0x0F ) * 65536 ) + ( tempData[1] * 256 ) + tempData[2] ) / 100.00
        const fTemp = ( cTemp * 1.8 ) + 32

        let altData = i2cread( HP203B_ADDRESS, HP203B_READ_A, 3 )
        let altitude = ( ( ( altData[0] & 0x0F ) << 16 ) + ( altData[1] << 8 ) + altData[2] ) / 100.00

        if ( pin === EnvTypeII.Pressure ) {
            return pressure
        } else if ( pin === EnvTypeII.Altitude ) {
            return altitude
        } else if ( pin === EnvTypeII.CTemp ) {
            return cTemp
        } else {
            return fTemp
        }
    }

    /**
     * init serial port
     * @param tx Tx pin; eg: SerialPin.P2
     * @param rx Rx pin; eg: SerialPin.P12
     */
    //% blockId=asr_init block="(ASR) init|Tx pin %tx|Rx pin %rx"
    //% group="ASR" weight=50
    export function asr_init( tx: SerialPin, rx: SerialPin ): void {
        serial.redirect( tx, rx, BaudRate.BaudRate115200 )
        // serial.setRxBufferSize(6)
    }

    //% blockId=asr_init_pw block="(ASR) init|Port %port"
    //% group="ASR" weight=49
    export function asr_init_pw( port: SerialPorts ): void {
        asr_init( PortSerial[port][0], PortSerial[port][1] )
    }


    //% blockId=asr_cmd_led block="(ASR) On LED Speech |%id recognized"
    //% group="ASR" weight=48
    export function on_asr_led( id: LEDCmd, handler: () => void ) {
        control.onEvent( asrEventId, id, handler );
        control.inBackground( () => {
            while ( 1 ) {
                let a = serial.readString()
                if ( a.slice( 0, 3 ) == "asr" ) {
                    cmd = parseInt( a.substr( 3, 3 ) )
                    control.raiseEvent( asrEventId, cmd )
                }
                basic.pause( 40 )
            }
        } )
    }

    //% blockId=asr_cmd_actuator block="(ASR) On Actuator Speech |%id recognized"
    //% group="ASR" weight=47
    export function on_asr_act( id: ActCmd, handler: () => void ) {
        control.onEvent( asrEventId, id, handler );
        control.inBackground( () => {
            while ( 1 ) {
                let a = serial.readString()
                if ( a.slice( 0, 3 ) == "asr" ) {
                    cmd = parseInt( a.substr( 3, 3 ) )
                    control.raiseEvent( asrEventId, cmd )
                }
                basic.pause( 40 )
            }
        } )
    }

    //% blockId=asr_cmd_measure block="(ASR) On Measurement Speech |%id recognized"
    //% group="ASR" weight=46
    export function on_asr_measure( id: MeasureCmd, handler: () => void ) {
        control.onEvent( asrEventId, id, handler );
        control.inBackground( () => {
            while ( 1 ) {
                let a = serial.readString()
                if ( a.slice( 0, 3 ) == "asr" ) {
                    cmd = parseInt( a.substr( 3, 3 ) )
                    control.raiseEvent( asrEventId, cmd )
                }
                basic.pause( 40 )
            }
        } )
    }

    //% blockId=asr_cmd_custom block="(ASR) On Customized Speech |%id recognized"
    //% group="ASR" weight=45
    export function on_asr_custom( id: CustomCmd, handler: () => void ) {
        control.onEvent( asrEventId, id, handler );
        control.inBackground( () => {
            while ( 1 ) {
                let a = serial.readString()
                if ( a.slice( 0, 3 ) == "asr" ) {
                    cmd = parseInt( a.substr( 3, 3 ) )
                    control.raiseEvent( asrEventId, cmd )
                }
                basic.pause( 40 )
            }
        } )
    }

    //% blockId=asr_tts_int block="(ASR) peak Integer |%num"
    //% num.min=-67108864 num.max=67108864
    //% group="ASR" weight=44
    export function asr_tts_int( num: number ): void {
        let buf = pins.createBuffer( 9 );
        buf[0] = 0xAA;
        buf[1] = 0x55;
        buf[2] = TTS_INTEGER_CMD;
        for ( let i = 0; i < 4; i++ ) {
            buf[3 + i] = num & 0xff;
            num = num >> 8;
        }
        buf[7] = 0x55;
        buf[8] = 0xAA;
        serial.writeBuffer( buf )
    }

    //% blockId=asr_tts_double block="(ASR) Speak Double |%num"
    //% group="ASR" weight=43
    export function asr_tts_double( num: number ): void {
        let buf = pins.createBuffer( 13 );
        buf[0] = 0xAA;
        buf[1] = 0x55;
        buf[2] = TTS_DOUBLE_CMD;
        for ( let i = 8; i >= 0; i-- ) {
            buf[3 + i] = num & 0xff;
            num = num >> 8;
        }
        buf[11] = 0x55;
        buf[12] = 0xAA;
        serial.writeBuffer( buf )
    }

    /**
     * Speak Date
     * @param year year of date; eg: 2022
     * @param month month of date; eg: 6
     * @param day day of date; eg: 6
    */
    //% blockId=asr_tts_date block="(ASR) Speak Date Year|%year Month|%month Day|%day"
    //% year.min=0 year.max=10000
    //% month.min=1 month.max=12
    //% day.min=1 day.max=31
    //% group="ASR" weight=42
    export function asr_tts_date( year: number, month: number, day: number ): void {
        let buf = pins.createBuffer( 11 );
        buf[0] = 0xAA;
        buf[1] = 0x55;
        buf[2] = TTS_DATE_CMD;
        for ( let y = 0; y < 4; y++ ) {
            buf[3 + y] = year & 0xff;
            year = year >> 8;
        }
        buf[7] = month & 0xff;
        buf[8] = day & 0xff;
        buf[9] = 0x55;
        buf[10] = 0xAA;
        serial.writeBuffer( buf )
    }

    /**
     * Speak Time
     * @param hour hour of time; eg: 18
     * @param minute minute of time; eg: 30
    */
    //% blockId=asr_tts_time block="(ASR) Speak Time Hour|%hour Minute|%minute"
    //% hour.min=0 hour.max=24
    //% minute.min=0 minute.max=59
    //% group="ASR" weight=41
    export function asr_tts_time( hour: number, minute: number ): void {
        let buf = pins.createBuffer( 7 );
        buf[0] = 0xAA;
        buf[1] = 0x55;
        buf[2] = TTS_TIME_CMD;
        buf[3] = hour & 0xff;
        buf[4] = minute & 0xff;
        buf[5] = 0x55;
        buf[6] = 0xAA;
        serial.writeBuffer( buf )
    }

    //% blockId=asr_tts_words block="(ASR) Speak Words |%id"
    //% group="ASR" weight=40
    export function asr_tts_words( id: WordsID ): void {
        let buf = pins.createBuffer( 5 );
        buf[0] = 0xAA;
        buf[1] = 0x55;
        buf[2] = id;
        buf[3] = 0x55;
        buf[4] = 0xAA;
        serial.writeBuffer( buf )
    }

}

//% color="#fe99d4" weight=10 icon="\uf0e7"
//% groups='["Basic", "Actuators", "Encoded Motor", "Dual Encoded Motor", "Audio"]'
namespace SugarBox {
    const MODE_IDLE = 0x0
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

    function _i2cWriteBH( reg: number, index: number, value: number ) {
        const buff = pins.createBuffer( 4 ) // reg, int16
        buff[0] = reg
        buff[1] = index
        buff.setNumber( NumberFormat.Int16LE, 2, value )
        pins.i2cWriteBuffer( SGBOX_ADDR, buff )
    }

    function _i2cReadF( port: EPort, p: E_PARAM ): number {
        let _reg = port == EPort.EM1 ? 0x60 : 0x70
        _reg |= p
        return i2cread( SGBOX_ADDR, _reg, 4 ).getNumber( NumberFormat.Float32LE, 0 )
    }

    /**
     * The firmware of sugarbox took a little longer than microbit to init
     */
    //% blockId=waitready block="Wait Ready"
    //% group="Basic" weight=100
    export function waitready() {
        let bat = 0
        while ( bat === 0 ) {
            bat = battery()
            basic.pause( 200 )
        }
    }

    //% blockId=battery block="Battery Voltage"
    //% group="Basic" weight=100
    export function battery(): number {
        return i2cread( SGBOX_ADDR, REG_VOLTAG, 4 ).getNumber( NumberFormat.Float32LE, 0 )
    }

    //% blockId=motor_spd block="Motor|%port Speed %speed"
    //% speed.min=-255 speed.max=255 speed.defl=0
    //% group="Actuators" weight=50
    export function motorSpd( port: MPort, speed: number ) {
        _i2cWriteBH( REG_MOTOR, port, speed )
    }

    //% blockId=motor_stop block="Motor|%port Stop"
    //% group="Actuators" weight=49
    export function motorStop( port: MPort ) {
        _i2cWriteBH( REG_MOTOR, port, 0 )
    }

    //% blockId=motor_stop_all block="Stop All Motor "
    //% group="Actuators" weight=48
    export function motorStopAll() {
        for ( let idx = 1; idx <= 4; idx++ ) {
            motorStop( idx );
        }
    }

    //% blockId=servo2kg block="2KG Servo|%port Angle %angle"
    //% angle.min=0 angle.max=360 angle.defl=90
    //% group="Actuators" weight=47
    export function servo2kg( port: SPort, angle: number ) {
        const us = Math.floor( angle * 200 / 36 + 500 ) // 2kg
        servoPulse( port, us )
    }

    //% blockId=servo_pulse block="Servo|%port Pulse %us us"
    //% us.min=500 us.max=2500 us.defl=1500
    //% group="Actuators" weight=46
    export function servoPulse( port: SPort, us: number ) {
        _i2cWriteBH( REG_SERVO, port, us )
    }

    function _emotorReset( port: EPort ) {
        i2cwrite( SGBOX_ADDR, REG_PIDRESET, [port, 0] )
    }

    function _pidRun( port: EPort, mode: number, speed: number, param2: number, wait: boolean = true ) {
        const buf = pins.createBuffer( 11 ) // reg,B,B,f,f
        buf[0] = REG_PIDRUN
        buf[1] = port
        buf[2] = mode
        buf.setNumber( NumberFormat.Float32LE, 3, speed )
        buf.setNumber( NumberFormat.Float32LE, 7, param2 )
        pins.i2cWriteBuffer( SGBOX_ADDR, buf )
        if ( wait ) {
            let _reg = port == EPort.EM1 ? 0x60 : 0x70
            while ( mode != 0 ) {
                mode = i2cread( SGBOX_ADDR, _reg, 1 )[0]
                if ( mode & MODE_STUCK ) {
                    _emotorReset( port )
                    return -1;
                }
                basic.pause( 200 )
            }
        }
        return 0
    }

    //% blockId=enc_init block="Encoder Motor|%port Init"
    //% group="Encoded Motor" weight=40
    export function encMotorInit( port: EPort ) {
        _emotorReset( port )
    }

    //% blockId=enc_rpm_set block="EMotor %port run %spd RPM"
    //% spd.min=-300 spd.max=300 spd.defl=120
    //% group="Encoded Motor" weight=39
    export function eMotorSetRpm( port: EPort, spd: number ) {
        spd = spd / 60 // from rpm to rnd per sec
        _pidRun( port, MODE_SPEED, spd, 0, false )
    }

    //% blockId=enc_stop block="EMotor %port Stop"
    //% group="Encoded Motor" weight=39
    export function eMotorStop( port: EPort ) {
        _pidRun( port, MODE_SPEED, 0, 0, false )
    }

    //% blockId=enc_rpm_get block="EMotor %port get Speed(RPM)"
    //% group="Encoded Motor" weight=38
    export function eMotorGetRpm( port: EPort ): number {
        return _i2cReadF( port, E_PARAM.SPEED )
    }


    //% blockId=enc_goto block="EMotor %port Goto degree %degree speed %rpm RPM"
    //% group="Encoded Motor" weight=37
    function eMotorGoto( port: EPort, degree: number, rpm: number ) {
        // speed to RPSec, degree to round
        const speed = rpm / 60
        const rnd = degree / 360
        _pidRun( port, MODE_SPEED | MODE_RUNPOS, speed, rnd, true )
    }


    //% blockId=enc_set_pos block="EMotor %port To Position %degree"
    //% group="Encoded Motor" weight=36
    export function eMotorSetPos( port: EPort, degree: number ) {
        // speed to RPSec, degree to round
        const speed = 2 // 120 rpm
        const rnd = degree / 360
        const mode = MODE_SPEED | MODE_RUNPOS | MODE_ABSOLU
        _pidRun( port, mode, speed, rnd, true )
    }


    //% blockId=enc_position block="EMotor %port Position degree"
    //% group="Encoded Motor" weight=35
    export function eMotorPos( port: EPort ): number {
        return _i2cReadF( port, E_PARAM.POSITION )
    }


    //% blockId=enc_move_deg block="EMotor %port Move By Degree %degree speed %speed RPM"
    //% speed.min=-300 speed.max=300 speed.defl=120
    //% group="Encoded Motor" weight=34
    export function eMotorMoveDeg( port: EPort, degree: number, speed: number ) {
        eMotorGoto( port, degree, speed )
    }

    //% blockId=enc_move_rnd block="EMotor %port Move Round %rnd speed %speed RPM"
    //% speed.min=-300 speed.max=300 speed.defl=120
    //% group="Encoded Motor" weight=34
    export function eMotorMoveRnd( port: EPort, rnd: number, speed: number ) {
        eMotorGoto( port, rnd * 360, speed )
    }

    //% blockId=enc_move_delay block="EMotor %port Move Delayed %t sec speed %speed RPM"
    //% speed.min=-300 speed.max=300 speed.defl=120
    //% group="Encoded Motor" weight=34
    export function eMotorMoveDelayed( port: EPort, t: number, speed: number ) {
        const mode = MODE_SPEED | MODE_DELAY
        _pidRun( port, mode, speed, t * 1000, true )
    }

    // initial params in CM
    let _R = 6
    let _W = 12
    let _Setup = 1

    const MODE_RUN = 0x1
    const MODE_TURN = 0x2

    function _dmotorReset() {
        i2cwrite( SGBOX_ADDR, REG_PIDRESET, [3, _Setup] )
    }

    function _dualMotorRun( mode: number, v: number, w: number, rnd: number, wait: boolean = true ) {
        const buf = pins.createBuffer( 14 ) // reg B,f,f,f
        buf[0] = REG_DUALRUN
        buf[1] = mode
        buf.setNumber( NumberFormat.Float32LE, 2, v ) // forward linear speed
        buf.setNumber( NumberFormat.Float32LE, 6, w ) // angular speed
        buf.setNumber( NumberFormat.Float32LE, 11, rnd )
        pins.i2cWriteBuffer( SGBOX_ADDR, buf )
        if ( wait ) {
            let _reg = 0x80
            while ( mode != 0 ) {
                mode = i2cread( SGBOX_ADDR, _reg, 1 )[0]
                if ( mode & MODE_STUCK ) {
                    _dmotorReset()
                    return -1;
                }
                basic.pause( 200 )
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
    //% blockId=denc_init block="Dual encoded motor init|wheel diameter(cm) %diameter|track width(cm) %width||setup %setup ||inversed %inversed"
    //% group="Dual Encoded Motor" weight=30
    export function dualMotorInit( diameter: number, width: number, setup: DSetup = 1, inversed: boolean = false ) {
        _Setup = 0
        _R = diameter
        _W = width
        if ( setup == DSetup.RL ) {
            _Setup |= 0x1
        }
        if ( inversed ) {
            _Setup |= 0x2
        }
        _dmotorReset()
    }

    /**
     * 
     * @param distance distance to move cm eg: 20
     * @param speed speed in rpm eg: 120
     */
    //% blockId=denc_move block="Move %distance cm, speed %speed cm/s"
    //% group="Dual Encoded Motor" weight=28
    export function dualMotorMove( distance: number, speed: number ) {
        const rnd = distance / ( Math.PI * _R )
        speed = speed / ( Math.PI * _R )
        _dualMotorRun( MODE_RUN, speed, 0, rnd )
    }

    /**
     * 
     * @param degree degree to turn eg: 180
     * @param w rotation speed degree/s eg: 90
     * @param v forward speed cm/s eg: 0
     */
    //% blockId=denc_turn block="Turn degree %degree, speed %w degree/s, forward speed %v cm/s"
    //% group="Dual Encoded Motor" weight=27
    export function dualMotorTurn( degree: number, w: number, v: number ) {
        const speed = v / ( Math.PI * _R ) // in round/s
        const diff = w * _W / _R / 360 // wheel difference
        const rnd = 2 * ( degree / w ) * diff
        _dualMotorRun( MODE_TURN, speed, diff, rnd )
    }

}