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

//% color="#49cef7" weight=10 icon="\uf1b0"
//% groups='["Motion/PIR", "Linefollower/Tracker", "HallEffect", "Buttons", "LED", "Flame", "PotentialMeter", "LightLevel", "Moisture", "Rain Gauge", "Infra Transmitter", "Distance", "Environment", "Joystick"]'
namespace Sugar {

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

    export enum LEDSta {
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
    export function PIR(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }

    //% blockId=tracer block="(Tracker) Black Dectected %pin"
    //% group="digitalIn" weight=89
    export function Tracker(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }

    //% blockId=hall block="(Hall) Magnetic Detected %pin"
    //% group="digitalIn" weight=88
    export function Hall(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }

    //% blockId=button block="(Button) Pressed %pin"
    //% group="digitalIn" weight=87
    export function Button(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 0
    }

    //% blockId=led_toggle block="(LED) %pin| %onoff"
    //% group="digitalOut" weight=86
    export function ledOnoff(pin: DigitalPin, onoff: LEDSta) {
        pins.digitalWritePin(pin, onoff?1:0)
    }

    //% blockId=led_luminent block="(LED) %pin| Luminent %value"
    //% group="digitalOut" weight=85
    export function ledLuminent(pin: AnalogPin, value: number) {
        pins.analogWritePin(pin, value)
    }

    // //% blockId=flameBool block="(Flame)|%pin Detected Flame"
    // //% group="Flame" weight=84
    // export function Flame(pin: DigitalPin): boolean {
    //     return pins.digitalReadPin(pin) == 1
    // }

    //% blockId=flameAnalog block="(Flame) %pin"
    //% group="analogIn" weight=84
    export function Flame(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    //% blockId=potential block="(Angle) %pin"
    //% group="analogIn" weight=83
    export function Angle(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    //% blockId=lightlvl block="(Light) %pin"
    //% group="analogIn" weight=82
    export function Light(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    //% blockId=soilmoisture block="(SoilMoisture) %pin"
    //% group="analogIn" weight=81
    export function SoilMoisture(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    //% blockId=rainlvl block="(WaterLevel) Digital %pin"
    //% group="analogIn" weight=80
    export function WaterLevelDigi(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }

    //% blockId=rainlvl block="(WaterLevel) Analog %pin"
    //% group="analogIn" weight=79
    export function WaterLevelAna(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    //% blockId=infraRx block="On Infra %pin Received"
    //% group="Special" weight=78
    export function InfraRx(pin: AnalogPin, handler: (data: string) => void) {

    }

    //% blockId=infraTx block="Infra %pin Transmit %data"
    //% group="Special" weight=78
    export function InfraTx(pin: AnalogPin, data: string) {

    }

    let distanceBuf = 0;
    //% blockId=ultrasonic block="Ultrasonic Distance %pin (cm)"
    //% group="Special" weight=76
    export function UltrasonicCm(pin: DigitalPin): number {
        pins.setPull(pin, PinPullMode.PullDown);
        pins.digitalWritePin(pin, 0);
        control.waitMicros(2);
        pins.digitalWritePin(pin, 1);
        control.waitMicros(10);
        pins.digitalWritePin(pin, 0);

        // read pulse
        let d = pins.pulseIn(pin, PulseValue.High, 25000);
        let ret = d;
        // filter timeout spikes
        if (ret == 0 && distanceBuf != 0) {
                ret = distanceBuf;
        }
        distanceBuf = d;
        return Math.floor(ret / 40 + (ret / 800));
    }

    const VL53L0X_ADDR = 0x5e;
    let vl53Inited = false;

    //% blockId=tof block="(TOF Distance) mm"
    //% group="I2C" weight=76
    export function TOFDistance(): number {
        if (!vl53Inited){
            let buf = pins.createBuffer(3)
            buf[0] = 1
            pins.i2cWriteBuffer(VL53L0X_ADDR, buf)
            vl53Inited = true
            control.waitMicros(50)
        }
        pins.i2cWriteNumber(VL53L0X_ADDR, 0x1, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(VL53L0X_ADDR, NumberFormat.UInt16LE);
    }

    const AHT20_ADDR = 0x38
    let aht20Inited = false;

    function _aht20Ready (): boolean{
        let stat = pins.i2cReadNumber(AHT20_ADDR, NumberFormat.UInt8BE);
        while (stat & 0x80){
            stat = pins.i2cReadNumber(AHT20_ADDR, NumberFormat.UInt8BE);
            basic.pause(100)
        }
        return true
    }

    //% blockId=environment block="(ENV) %env"
    //% group="I2C" weight=74
    export function ENV(env: EnvType): number {
        if (!aht20Inited){
            i2cwrite(AHT20_ADDR,0xba, [])
            basic.pause(50)
            i2cwrite(AHT20_ADDR,0xa8, [0,0])
            basic.pause(350)
            i2cwrite(AHT20_ADDR,0xe1, [0x28,0])
            aht20Inited=true;
        }
        i2cwrite(AHT20_ADDR,0xac,[0x33,0])
        if (_aht20Ready()){
            const n = pins.i2cReadBuffer(AHT20_ADDR, 6)
            const h = ((n[1] << 16) | (n[2] << 8) | (n[3])) >> 4
            const humi = Math.round(h*0.000095)
            const t = ((n[3]&0x0f)<<16|(n[4]<<8)|n[5])
            const temp = Math.round(t*0.000191 - 50)
            return env === EnvType.Humidity ? humi : temp
        }
        return 0;
    }

    const JOYSTICK_ADDR = 0x5c

    //% blockId=joyState block="(Joystick) State %state trigger"
    //% group="I2C" weight=72
    export function joyState(state: JoystickDir): boolean {
        const sta = i2cread(JOYSTICK_ADDR,1,1).getNumber(NumberFormat.UInt8BE,0)
        return (sta & state) != 0;
    }

    //% blockId=joyValue block="(Joystick) %dir Value"
    //% group="I2C" weight=72
    export function joyValue(dir: DirType): number {
        const buf = i2cread(JOYSTICK_ADDR,2,4)
        const valX = Math.round(buf.getNumber(NumberFormat.Int16LE, 0)*255/2048 - 255)
        const valY = Math.round(buf.getNumber(NumberFormat.Int16LE, 2)*255/2048 - 255)
        return dir === DirType.X ? valX : valY
    }

}

//% color="#fe99d4" weight=10 icon="\uf0e7"
//% groups='["Actuators", "Encoded Motor", "Dual Encoded Motor", "Audio"]'
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
    export enum MPort{
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

    function _i2cWriteBH(reg: number, index: number, value: number){
        const buff = pins.createBuffer(4) // reg, int16
        buff[0] = reg
        buff[1] = index
        buff.setNumber(NumberFormat.Int16LE, 2, value)
        pins.i2cWriteBuffer(SGBOX_ADDR, buff)
    }

    function _i2cReadF (port: EPort, p: E_PARAM): number {
        let _reg = port == EPort.EM1 ? 0x60 : 0x70
        _reg |= p
        return i2cread(SGBOX_ADDR, _reg, 4).getNumber(NumberFormat.Float32LE, 0)
    }

    //% blockId=battery block="Battery Voltage"
    //% weight=100
    export function battery(): number {
        return i2cread(SGBOX_ADDR,REG_VOLTAG,4).getNumber(NumberFormat.Float32LE,0)
    }

    //% blockId=motor_spd block="Motor|%port Speed %speed"
    //% group="Actuators" weight=50
    export function motorSpd(port: MPort, speed: number) {
        _i2cWriteBH(REG_MOTOR,port,speed)
    }
  
    //% blockId=motor_stop block="Motor|%port Stop"
    //% group="Actuators" weight=49
    export function motorStop(port: MPort) {
        _i2cWriteBH(REG_MOTOR,port,0)
    }

    //% blockId=motor_stop_all block="Stop All Motor "
    //% group="Actuators" weight=48
    export function motorStopAll() {
        for (let idx = 1; idx <= 4; idx++) {
            motorStop(idx);
        }
    }

    //% blockId=servo2kg block="2KG Servo|%port Angle %angle"
    //% group="Actuators" weight=47
    export function servo2kg(port: SPort, angle: number) {
        const us = Math.floor(angle*200/36+500) // 2kg
        servoPulse(port, us)
    }

    //% blockId=servo_pulse block="Servo|%port Pulse %us us"
    //% group="Actuators" weight=46
    export function servoPulse(port: SPort, us: number) {
        _i2cWriteBH(REG_SERVO,port,us)
    }

    function _emotorReset(port: EPort){
        i2cwrite(SGBOX_ADDR,REG_PIDRESET,[port,0])
    }

    function _pidRun(port: EPort, mode: number, speed: number, param2: number, wait: boolean = true){
        const buf = pins.createBuffer(10) // B,B,f,f
        buf[0] = port
        buf[1] = mode
        buf.setNumber(NumberFormat.Float32LE, 2, speed)
        buf.setNumber(NumberFormat.Float32LE, 6, param2)
        pins.i2cWriteBuffer(SGBOX_ADDR, buf)
        if (wait){
            let _reg = port == EPort.EM1 ? 0x60 : 0x70
            while (mode != 0){
                mode = i2cread(SGBOX_ADDR,_reg,1)[0]
                if (mode & MODE_STUCK){
                    _emotorReset(port)
                    return -1;
                }
                basic.pause(200)
            }
        }
        return 0
    }

    //% blockId=enc_init block="Encoder Motor|%port Init"
    //% group="Encoded Motor" weight=40
    export function encMotorInit(port: EPort) {
        _emotorReset(port)
    } 

    //% blockId=enc_rpm_set block="EMotor %port run %spd RPM"
    //% group="Encoded Motor" weight=39
    export function eMotorSetRpm(port: EPort, spd: number) {
        spd /= 60 // from rpm to rnd per sec
        _pidRun(port,MODE_SPEED,spd,0,false)
    }

    //% blockId=enc_rpm_get block="EMotor %port get Speed(RPM)"
    //% group="Encoded Motor" weight=38
    export function eMotorGetRpm(port: EPort): number {
        return _i2cReadF(port, E_PARAM.SPEED)
    }

    
    //% blockId=enc_goto block="EMotor %port Goto degree %degree speed %rpm RPM"
    //% group="Encoded Motor" weight=37
    function eMotorGoto(port: EPort, degree: number, rpm: number) {
        // speed to RPSec, degree to round
        const speed = rpm/60
        const rnd = degree/360
        _pidRun(port, MODE_SPEED | MODE_RUNPOS, speed, rnd, true)
    }


    //% blockId=enc_set_pos block="EMotor %port To Position %degree"
    //% group="Encoded Motor" weight=36
    export function eMotorSetPos(port: EPort, degree: number) {
        // speed to RPSec, degree to round
        const speed = 2 // 120 rpm
        const rnd = degree/360
        const mode = MODE_SPEED | MODE_RUNPOS | MODE_ABSOLU
        _pidRun(port,mode, speed, rnd, true)
    }


    //% blockId=enc_position block="EMotor %port Position degree"
    //% group="Encoded Motor" weight=35
    export function eMotorPos(port: EPort): number {
        return _i2cReadF(port, E_PARAM.POSITION)
    }


    //% blockId=enc_move_deg block="EMotor %port Move By Degree %degree speed %speed RPM"
    //% group="Encoded Motor" weight=34
    export function eMotorMoveDeg(port: EPort, degree: number, speed: number) {
        eMotorGoto(port, degree, speed)
    }

    //% blockId=enc_move_rnd block="EMotor %port Move Round %rnd speed %speed RPM"
    //% group="Encoded Motor" weight=34
    export function eMotorMoveRnd(port: EPort, rnd: number, speed: number) {
        eMotorGoto(port, rnd*360, speed)
    }

    //% blockId=enc_move_delay block="EMotor %port Move Delayed %t sec speed %speed RPM"
    //% group="Encoded Motor" weight=34
    export function eMotorMoveDelayed(port: EPort, t: number, speed: number) {
        const mode = MODE_SPEED | MODE_DELAY
        _pidRun(port,mode, speed, t*1000, true)
    }

    // initial params in CM
    let _R = 6
    let _W = 12
    let _Setup = 1

    const MODE_RUN = 0x1
    const MODE_TURN = 0x2

    function _dmotorReset (){
        i2cwrite(SGBOX_ADDR, REG_PIDRESET, [3, _Setup])
    }

    function _dualMotorRun(mode: number, v: number, w: number, rnd: number, wait: boolean = true){
        const buf = pins.createBuffer(10) // B,f,f,f
        buf[0] = mode
        buf.setNumber(NumberFormat.Float32LE, 1, v) // forward linear speed
        buf.setNumber(NumberFormat.Float32LE, 5, w) // angular speed
        buf.setNumber(NumberFormat.Float32LE, 9, rnd)
        pins.i2cWriteBuffer(SGBOX_ADDR, buf)
        if (wait){
            let _reg = 0x80
            while (mode != 0){
                mode = i2cread(SGBOX_ADDR,_reg,1)[0]
                if (mode & MODE_STUCK){
                    _dmotorReset()
                    return -1;
                }
                basic.pause(200)
            }
        }
        return 0
    }

    //% blockId=denc_init block="Dual encoded motor init|wheel diameter(cm) %diameter|track width(cm) %width|direction %setup|inversed %inversed"
    //% group="Dual Encoded Motor" weight=30
    export function dualMotorInit(diameter: number,width: number,setup:DSetup,inversed: boolean) {
        _Setup = 0
        _R = diameter
        _W = width
        if (setup == DSetup.RL){
            _Setup |= 0x1
        }
        if (inversed){
            _Setup |= 0x2
        }
        _dmotorReset()
    }

    //% blockId=denc_move block="Move %distance cm, speed %speed cm/s"
    //% group="Dual Encoded Motor" weight=28
    export function dualMotorMove(distance: number,speed: number) {
        const rnd = distance/(Math.PI*_R)
        speed = speed/(Math.PI*_R)
        _dualMotorRun(MODE_RUN, speed, 0, rnd)
    }

    //% blockId=denc_turn block="Turn %degree degree, speed %w degree/s, forward speed %v cm/s"
    //% group="Dual Encoded Motor" weight=27
    export function dualMotorTurn(degree: number,w: number, v: number) {
        const speed = v/(Math.PI*_R) // in round/s
        const diff = w*_W/_R/360 // wheel difference
        const rnd = 2*(degree/w)*diff
        _dualMotorRun(MODE_TURN, speed, diff, rnd)
    }

}

