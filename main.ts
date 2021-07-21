/**
 * KittenBot Sugarbox contest set
"sugarbox": "file:../pxt-sugarbox"

 */

//% color="#90B7FB" weight=10
//% groups='["Motion/PIR", "Linefollower/Tracker", "HallEffect", "Buttons", "LED", "Flame", "PotentialMeter", "LightLevel", "Moisture", "Rain Gauge", "Infra Transmitter", "Distance", "Environment", "Joystick", "Actuators", "Encoded Motor", "Dual Encoded Motor", "Audio"]'
namespace Sugarbox {

  export enum Ports {
    PORT1 = 0,
    PORT2 = 1,
    PORT3 = 2,
    PORT4 = 3,
    PORT5 = 4,
    PORT6 = 5,
    PORT7 = 6
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



}



