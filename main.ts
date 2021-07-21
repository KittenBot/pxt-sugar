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
  return pins.i2cReadBuffer(addr, size);
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

  //% blockId=tof block="TOF Distance %pin"
  //% group="Distance" weight=76
  export function tofmm(pin: AnalogPin): number {
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
      basic.pause(10)
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
      const humi = ((n[1] << 16) | (n[2] << 8) | (n[3])) >> 4
      const temp = ((n[3]&0x0f)<<16|(n[4]<<8)|n[5])
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
    const valX = buf.getNumber(NumberFormat.Int16LE, 0)
    const valY = buf.getNumber(NumberFormat.Int16LE, 2)
    return dir === DirType.X ? valX : valY
  }

}

//% color="#90B7FB" weight=10 icon="\uf8ff"
//% groups='["Actuators", "Encoded Motor", "Dual Encoded Motor", "Audio"]'
namespace SugarBox {
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
    EM2 = 2
  }

  //% blockId=battery block="Battery Voltage"
  //% group="Dual Encoded Motor" weight=50
  export function battery(): number {
    return 3.72
  }

  //% blockId=motor_spd block="Motor|%motor Speed %spd"
  //% group="Actuators" weight=49
  export function motorSpd(port: MPort, speed: number) {
    
  }

  //% blockId=motor_stop block="Motor|%motor Stop"
  //% group="Actuators" weight=49
  export function motorStop(port: MPort) {
    
  }

  //% blockId=servo2kg block="Servo|%motor Angle %angle"
  //% group="Actuators" weight=48
  export function servo2kg(port: SPort, angle: number) {
    
  }

  //% blockId=servo_pulse block="Servo|%motor Pulse %us us"
  //% group="Actuators" weight=48
  export function servoPulse(port: SPort, us: number) {
    
  }

  //% blockId=enc_init block="Encoder Motor|%motor Init"
  //% group="Encoded Motor" weight=40
  export function encMotorInit(port: SPort) {
    
  } 

  //% blockId=enc_rpm_set block="EMotor %motor run %spd RPM"
  //% group="Encoded Motor" weight=39
  export function eMotorSetRpm(port: SPort, spd: number) {
    
  }

  //% blockId=enc_rpm_get block="EMotor %motor get Speed(RPM)"
  //% group="Encoded Motor" weight=38
  export function eMotorGetRpm(port: SPort): number {
    return 120;
  }

  //% blockId=enc_goto block="EMotor %motor Goto degree %degree speed %rpm RPM"
  //% group="Encoded Motor" weight=36
  export function eMotorGoto(port: SPort, degree: number, rpm: number) {
    
  }

  //% blockId=enc_position block="EMotor %motor Position degree"
  //% group="Encoded Motor" weight=36
  export function eMotorPos(port: SPort): number {
    return 0;
  }

  //% blockId=enc_set_pos block="EMotor %motor To Position %degree"
  //% group="Encoded Motor" weight=36
  export function eMotorSetPos(port: SPort) {
    
  }

  //% blockId=enc_move_deg block="EMotor %motor Move By Degree %degree, speed %speed RPM"
  //% group="Encoded Motor" weight=34
  export function eMotorMoveDeg(port: SPort, degree: number, speed: number) {
    
  }

  //% blockId=enc_move_rnd block="EMotor %motor Move Round %rnd, speed %speed RPM"
  //% group="Encoded Motor" weight=34
  export function eMotorMoveRnd(port: SPort, rnd: number, speed: number) {
    
  }

  //% blockId=enc_move_delay block="EMotor %motor Move Delayed %t sec, speed %speed RPM"
  //% group="Encoded Motor" weight=34
  export function eMotorMoveDelayed(port: SPort, rnd: number, speed: number) {
    
  }

  //% blockId=denc_init block="Dual encoded motor init|wheel diameter(cm) %diameter|track width(cm) %width|left %ml right %mr|inversed %inversed"
  //% group="Dual Encoded Motor" weight=30
  export function dualMotorInit(diameter: number,width: number,ml: EPort,mr: EPort,inversed: boolean) {
    
  }

  //% blockId=denc_move block="Move %distance cm, speed %speed cm/s"
  //% group="Dual Encoded Motor" weight=28
  export function dualMotorMove(diameter: number,speed: number) {
    
  }

  //% blockId=denc_turn block="Turn degree %degree, speed %w degree/s, forward speed %v cm/s"
  //% group="Dual Encoded Motor" weight=27
  export function dualMotorTurn(diameter: number,w: number, v: number) {
    
  }

}

