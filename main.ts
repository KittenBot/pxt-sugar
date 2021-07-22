/**
 * KittenBot Sugarbox contest set
"sugarbox": "file:../pxt-sugarbox"

 */

function i2cwrite(addr: number, reg: number, value: number[]) {
  let a = [reg]
  if (value.length)
    a = a.concat(value)
  return pins.i2cWriteBuffer(addr, Buffer.fromArray(a))
}

function i2cread(addr: number, reg: number, size: number) {
  pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
  const ret = pins.i2cReadBuffer(addr, size);
  return ret
}

//% color="#9DA4D0" weight=10 icon="\uf24d"
//% groups='["Motion/PIR", "Linefollower/Tracker", "HallEffect", "Buttons", "LED", "Flame", "PotentialMeter", "LightLevel", "Moisture", "Rain Gauge", "Infra Transmitter", "Distance", "Environment", "Joystick"]'
namespace Sugarmodule {

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
    Temperature = 0,
    Humidity = 1
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


  //% blockId=pir block="Motion Detect %pin"
  //% group="Motion/PIR" weight=90
  export function pir(pin: DigitalPin): boolean {
    return pins.digitalReadPin(pin) == 1
  }

  //% blockId=tracer block="Tracer|%pin"
  //% group="Linefollower" weight=89
  export function Tracer(pin: DigitalPin): boolean {
    return pins.digitalReadPin(pin) == 1
  }

  //% blockId=hall block="Hall Effect|%pin"
  //% group="HallEffect" weight=88
  export function HallSensor(pin: DigitalPin): boolean {
    return pins.digitalReadPin(pin) == 1
  }

  //% blockId=button block="Button|%pin| Pressed %pressed"
  //% group="Buttons" weight=87
  export function buttonPressed(pin: DigitalPin, pressed: boolean): boolean {
    return (pins.digitalReadPin(pin) == 0) == pressed
  }

  //% blockId=led_toggle block="Led|%pin| On/Off %onoff"
  //% group="LED" weight=86
  export function ledOnoff(pin: DigitalPin, onoff: boolean) {
    pins.digitalWritePin(pin, onoff?1:0)
  }

  //% blockId=led_luminent block="Led|%pin| Luminent %value"
  //% group="LED" weight=85
  export function ledLuminent(pin: AnalogPin, value: number) {
    pins.analogWritePin(pin, value)
  }

  //% blockId=flameBool block="Flame|%pin Detected Flame"
  //% group="Flame" weight=84
  export function flameBool(pin: DigitalPin): boolean {
    return pins.digitalReadPin(pin) == 1
  }

  //% blockId=flameAnalog block="Flame|%pin Strength"
  //% group="Flame" weight=84
  export function flameAnalog(pin: AnalogPin): number {
    return pins.analogReadPin(pin)
  }

  //% blockId=potential block="Potential|%pin Value"
  //% group="PotentialMeter" weight=83
  export function potential(pin: AnalogPin): number {
    return pins.analogReadPin(pin)
  }

  //% blockId=lightlvl block="Light Level|%pin"
  //% group="LightLevel" weight=82
  export function LightLevel(pin: AnalogPin): number {
    return pins.analogReadPin(pin)
  }

  //% blockId=soilmoisture block="Soil Moisture|%pin"
  //% group="Moisture" weight=81
  export function SoilMoisture(pin: AnalogPin): number {
    return pins.analogReadPin(pin)
  }

  //% blockId=rainlvl block="Rain Gauge|%pin"
  //% group="Rain Gauge" weight=80
  export function rainGauge(pin: AnalogPin): number {
    return pins.analogReadPin(pin)
  }

  //% blockId=infraRx block="On Infra|%pin Received"
  //% group="Infra Transmitter" weight=78
  export function infraRx(pin: AnalogPin, handler: (data: string) => void) {

  }

  //% blockId=infraTx block="Infra %pin Transmit %data"
  //% group="Infra Transmitter" weight=78
  export function infraTx(pin: AnalogPin, data: string) {

  }

  let distanceBuf = 0;
  //% blockId=ultrasonic block="Ultrasonic Distance %pin"
  //% group="Distance" weight=76
  export function ultrasonicCm(pin: DigitalPin): number {
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

  //% blockId=tof block="TOF Distance"
  //% group="Distance" weight=76
  export function tofmm(): number {
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

  //% blockId=environment block="Environ %env"
  //% group="Environment" weight=74
  export function environment(env: EnvType): number {
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

  //% blockId=joyState block="Joystick State %state"
  //% group="Joystick" weight=72
  export function joyState(state: JoystickDir): boolean {
    const sta = i2cread(JOYSTICK_ADDR,1,1).getNumber(NumberFormat.UInt8BE,0)
    return (sta & state) != 0;
  }

  //% blockId=joyValue block="Joystick %dir"
  //% group="Joystick" weight=72
  export function joyValue(dir: DirType): number {
    const buf = i2cread(JOYSTICK_ADDR,2,4)
    const valX = Math.round(buf.getNumber(NumberFormat.Int16LE, 0)*255/2048 - 255)
    const valY = Math.round(buf.getNumber(NumberFormat.Int16LE, 2)*255/2048 - 255)
    return dir === DirType.X ? valX : valY
  }

}

//% color="#90B7FB" weight=10 icon="\uf8ff"
//% groups='["Actuators", "Encoded Motor", "Dual Encoded Motor", "Audio"]'
namespace SugarBox {

  const MODE_IDLE   = 0x0
  const MODE_SPEED  = 0x1
  const MODE_HOLD   = 0x2
  const MODE_RUNPOS = 0x4 // there is some end position
  const MODE_ABSOLU = 0x8
  const MODE_DELAY  = 0x10
  const MODE_STUCK  = 0x20
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
    //% block="M1A@Left"
    LR = 1,
    //% block="M1A@Right"
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
  //% weight=50
  export function battery(): number {
    return i2cread(SGBOX_ADDR,REG_VOLTAG,4).getNumber(NumberFormat.Float32LE,0)
  }

  /**
   * 
   * @param port 
   * @param speed speed in pwm eg: 100
   */
  //% blockId=motor_spd block="Motor|%motor Speed %spd"
  //% group="Actuators" weight=49
  //% speed.min=-255 speed.max=255
  //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
  export function motorSpd(port: MPort, speed: number) {
    _i2cWriteBH(REG_MOTOR,port,speed)
  }

  //% blockId=motor_stop block="Motor|%motor Stop"
  //% group="Actuators" weight=49
  export function motorStop(port: MPort) {
    _i2cWriteBH(REG_MOTOR,port,0)
  }

  /**
   * 
   * @param port 
   * @param angle servo angle eg: 90
   */
  //% blockId=servo2kg block="Servo|%motor Angle %angle"
  //% group="Actuators" weight=48
  //% angle.min=-25 angle.max=225
  //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
  export function servo2kg(port: SPort, angle: number) {
    const us =  Math.floor(angle*200/36+500) // 2kg
    servoPulse(port, us)
  }

  /**
   * 
   * @param port 
   * @param us pulse in us eg: 1500
   */
  //% blockId=servo_pulse block="Servo|%motor Pulse %us us"
  //% group="Actuators" weight=48
  export function servoPulse(port: SPort, us: number) {
    _i2cWriteBH(REG_SERVO,port,us)
  }

  function _emotorReset(port: EPort){
    i2cwrite(SGBOX_ADDR,REG_PIDRESET,[port,0])
  }

  function _pidRun(port: EPort, mode: number, speed: number, param2: number, wait: boolean = true){
    const buf = pins.createBuffer(11) // reg,B,B,f,f
    buf[0] = REG_PIDRUN
    buf[1] = port
    buf[2] = mode
    buf.setNumber(NumberFormat.Float32LE, 3, speed)
    buf.setNumber(NumberFormat.Float32LE, 7, param2)
    pins.i2cWriteBuffer(SGBOX_ADDR, buf)
    if (wait){
      let _reg = port == EPort.EM1 ? 0x60 : 0x70
      while (mode != 0){
        mode = i2cread(SGBOX_ADDR,_reg,4)[0]
        if (mode & MODE_STUCK){
          _emotorReset(port)
          return -1;
        }
        basic.pause(200)
      }
    }
    return 0
  }

  //% blockId=enc_init block="Encoder Motor|%motor Init"
  //% group="Encoded Motor" weight=40
  export function encMotorInit(port: EPort) {
    _emotorReset(port)
  } 

  /**
   * 
   * @param port 
   * @param spd speed in round per minute eg: 120
   */
  //% blockId=enc_rpm_set block="EMotor %motor run %spd RPM"
  //% group="Encoded Motor" weight=39
  export function eMotorSetRpm(port: EPort, spd: number) {
    spd /= 60 // from rpm to rnd per sec
    _pidRun(port,MODE_SPEED,spd,0,false)
  }

  //% blockId=enc_rpm_get block="EMotor %motor get Speed(RPM)"
  //% group="Encoded Motor" weight=38
  export function eMotorGetRpm(port: EPort): number {
    return _i2cReadF(port, E_PARAM.SPEED)
  }

  /**
   * 
   * @param port 
   * @param degree target position in degree eg: 360
   * @param rpm eg: 120
   */
  //% blockId=enc_goto block="EMotor %motor Goto degree %degree speed %rpm RPM"
  //% group="Encoded Motor" weight=36
  export function eMotorGoto(port: EPort, degree: number, rpm: number) {
    // speed to RPSec, degree to round
    const speed = rpm/60
    const rnd = degree/360
    _pidRun(port, MODE_SPEED | MODE_RUNPOS, speed, rnd, true)
  }

  //% blockId=enc_position block="EMotor %motor Position degree"
  //% group="Encoded Motor" weight=36
  export function eMotorPos(port: EPort): number {
    return _i2cReadF(port, E_PARAM.POSITION)
  }

  /**
   * 
   * @param port 
   * @param degree eg: 360
   */
  //% blockId=enc_set_pos block="EMotor %motor To Position %degree"
  //% group="Encoded Motor" weight=36
  export function eMotorSetPos(port: EPort, degree: number) {
    // speed to RPSec, degree to round
    const speed = 2 // 120 rpm
    const rnd = degree/360
    const mode = MODE_SPEED | MODE_RUNPOS | MODE_ABSOLU
    _pidRun(port,mode, speed, rnd, true)
  }

  /**
   * 
   * @param port 
   * @param degree target degree eg: 360
   * @param speed speed in rpm eg: 120
   */
  //% blockId=enc_move_deg block="EMotor %motor Move By Degree %degree, speed %speed RPM"
  //% group="Encoded Motor" weight=34
  export function eMotorMoveDeg(port: EPort, degree: number, speed: number) {
    eMotorGoto(port, degree, speed)
  }

  /**
   * 
   * @param port 
   * @param rnd rounds to move eg: 2
   * @param speed speed in rpm eg: 120
   */
  //% blockId=enc_move_rnd block="EMotor %motor Move Round %rnd, speed %speed RPM"
  //% group="Encoded Motor" weight=34
  export function eMotorMoveRnd(port: EPort, rnd: number, speed: number) {
    eMotorGoto(port, rnd*360, speed)
  }

  /**
   * 
   * @param port 
   * @param t seconds to stop eg: 3
   * @param speed speed in rpm eg: 120
   */
  //% blockId=enc_move_delay block="EMotor %motor Move Delayed %t sec, speed %speed RPM"
  //% group="Encoded Motor" weight=34
  export function eMotorMoveDelayed(port: EPort, t: number, speed: number) {
    const mode = MODE_SPEED | MODE_DELAY
    _pidRun(port,mode, speed, t*1000, true)
  }

  // initial params in CM
  let _R = 6
  let _W = 12
  let _Setup = 1

  const MODE_RUN    = 0x1
  const MODE_TURN   = 0x2

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

  /**
   * 
   * @param diameter wheel diameter in cm eg: 6
   * @param width track width cm eg:12
   * @param setup define left/right motor
   * @param inversed move direction inversed
   */
  //% blockId=denc_init block="Dual encoded motor init|wheel diameter(cm) %diameter|track width(cm) %width||setup %setup ||inversed %inversed"
  //% group="Dual Encoded Motor" weight=30
  export function dualMotorInit(diameter: number, width: number, setup: DSetup, inversed: boolean) {
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

  /**
   * 
   * @param distance distance to move cm eg: 20
   * @param speed speed in rpm eg: 120
   */
  //% blockId=denc_move block="Move %distance cm, speed %speed cm/s"
  //% group="Dual Encoded Motor" weight=28
  export function dualMotorMove(distance: number,speed: number) {
    const rnd = distance/(Math.PI*_R)
    speed = speed/(Math.PI*_R)
    _dualMotorRun(MODE_RUN, speed, 0, rnd)
  }

  /**
   * 
   * @param degree degree to turn eg: 180
   * @param w rotation speed degree/s eg: 90
   * @param v forward speed cm/s eg: 0
   */
  //% blockId=denc_turn block="Turn degree %degree, speed %w degree/s, forward speed %v cm/s"
  //% group="Dual Encoded Motor" weight=27
  export function dualMotorTurn(degree: number, w: number, v: number) {
    const speed = v/(Math.PI*_R) // in round/s
    const diff = w*_W/_R/360 // wheel difference
    const rnd = 2*(degree/w)*diff
    _dualMotorRun(MODE_TURN, speed, diff, rnd)
  }

}

