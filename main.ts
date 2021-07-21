/**
 * KittenBot Sugarbox contest set
"sugarbox": "file:../pxt-sugarbox"

 */

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

  export enum DirType {
    X = 0,
    Y = 1
  }


  //% blockId=pir block="Motion Detect %port"
  //% group="Motion/PIR" weight=90
  export function pir(port: Ports): boolean {
    return false;  
  }

  //% blockId=tracer block="Tracer|%port"
  //% group="Linefollower" weight=89
  export function Tracer(port: Ports): boolean {
    return false;
  }

  //% blockId=hall block="Hall Effect|%port"
  //% group="HallEffect" weight=88
  export function HallSensor(port: Ports): boolean {
    return false;
  }

  //% blockId=button block="Button|%port| Pressed %pressed"
  //% group="Buttons" weight=87
  export function buttonPressed(port: Ports, pressed: boolean): boolean {
    return false;
  }

  //% blockId=led_toggle block="Led|%port| On/Off %onoff"
  //% group="LED" weight=86
  export function ledOnoff(port: Ports, onoff: boolean) {
    
  }

  //% blockId=led_luminent block="Led|%port| Luminent %value"
  //% group="LED" weight=85
  export function ledLuminent(port: Ports, value: number) {
    
  }

  //% blockId=flameBool block="Flame|%port Detected Flame"
  //% group="Flame" weight=84
  export function flameBool(port: Ports): boolean {
    return false;
  }

  //% blockId=flameAnalog block="Flame|%port Strength"
  //% group="Flame" weight=84
  export function flameAnalog(port: Ports): number {
    return 100;
  }

  //% blockId=potential block="Potential|%port Value"
  //% group="PotentialMeter" weight=83
  export function potential(port: Ports): number {
    return 100;
  }

  //% blockId=lightlvl block="Light Level|%port"
  //% group="LightLevel" weight=82
  export function LightLevel(port: Ports): number {
    return 100;
  }

  //% blockId=soilmoisture block="Soil Moisture|%port"
  //% group="Moisture" weight=81
  export function SoilMoisture(port: Ports): number {
    return 100;
  }

  //% blockId=rainlvl block="Rain Gauge|%port"
  //% group="Rain Gauge" weight=80
  export function rainGauge(port: Ports): number {
    return 100;
  }

  //% blockId=infraRx block="On Infra|%port Received"
  //% group="Infra Transmitter" weight=78
  export function infraRx(port: Ports, handler: (data: string) => void) {

  }

  //% blockId=infraTx block="Infra %port Transmit %data"
  //% group="Infra Transmitter" weight=78
  export function infraTx(port: Ports, data: string) {

  }

  //% blockId=ultrasonic block="Ultrasonic Distance %port"
  //% group="Distance" weight=76
  export function ultrasonicCm(port: Ports): number {
    return 0;
  }

  //% blockId=tof block="TOF Distance %port"
  //% group="Distance" weight=76
  export function tofmm(port: Ports): number {
    return 0;
  }

  //% blockId=environment block="Environ %env"
  //% group="Environment" weight=74
  export function environment(env: EnvType): number {
    return 0;
  }

  //% blockId=joyState block="Joystick State %state"
  //% group="Joystick" weight=72
  export function joyState(state: EnvType): boolean {
    return false;
  }

  //% blockId=joyValue block="Joystick %dir"
  //% group="Joystick" weight=72
  export function joyValue(dir: DirType): number {
    return 100;
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

