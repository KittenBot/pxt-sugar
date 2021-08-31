basic.forever(function () {
    basic.showIcon(IconNames.Yes)
    basic.pause(200)
})
basic.forever(function () {
    SugarBox.motorSpd(SugarBox.MPort.M1A, Sugar.joyValue(Sugar.DirType.Y))
    if (Sugar.Button(DigitalPin.P1)) {
        Sugar.ledOnoff(DigitalPin.P0, Sugar.LEDSta.On)
    } else {
        Sugar.ledOnoff(DigitalPin.P0, Sugar.LEDSta.Off)
    }
    led.plotBarGraph(
    Sugar.Angle(AnalogPin.P0),
    1023
    )
})
