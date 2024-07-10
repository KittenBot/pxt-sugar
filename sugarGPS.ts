class SugarGPS {
    satellite_quantity: number;
    true_ground_track: number;
    speed_over_ground: number;
    latitude_direction: string;
    longitude_direction: string;
    latitude: number;
    longitude: number;
    altitude: number;
    hour: number;
    minute: number;
    sec: number;

    constructor(tx: SerialPin, rx: SerialPin) {
        serial.setRxBufferSize(128)
        serial.redirect(tx, rx, BaudRate.BaudRate9600)
        this.satellite_quantity = 0;
        this.true_ground_track = 0;
        this.speed_over_ground = 0;
        this.latitude_direction = "";
        this.longitude_direction = "";
        this.latitude = 0;
        this.longitude = 0;
        this.altitude = 0;
        this.hour = 0;
        this.minute = 0;
        this.sec = 0;
        serial.writeLine("$PCAS01,5*19\r")
        basic.pause(100)
        serial.setBaudRate(115200)
        basic.pause(100)
        serial.writeLine("$PCAS03,1,0,0,0,0,1,0,0,0,0,0,0,0*1E\r")
        basic.pause(100)
        control.inBackground(() => {
            while (1) {
                let a = serial.readLine()
                if (a) {
                    let endIndex = a.indexOf("*")
                    let expectedResult = parseInt(a.substr(endIndex + 1, 2), 16)
                    let data1 = a.substr(1, endIndex - 1)
                    let checkResult = 0
                    for (let i = 0; i < data1.length; i++) {
                        checkResult ^= data1.charCodeAt(i)
                    }
                    if (!(expectedResult == checkResult)) {
                        continue
                    }
                    let data2 = a.split(",")
                    if (data2[0] == "$GNGGA") {
                        this.satellite_quantity = parseInt(data2[7])
                        this.latitude_direction = data2[3]
                        this.longitude_direction = data2[5]
                        this.latitude = parseFloat(data2[2])
                        this.longitude = parseFloat(data2[4])
                        this.altitude = parseFloat(data2[9])
                        let hms: string = data2[1]
                        this.hour = parseInt(hms.substr(0, 2)) + 8
                        if (this.hour > 24) {
                            this.hour -= 24
                        }
                        this.minute = parseInt(hms.substr(2, 2))
                        this.sec = parseInt(hms.substr(4, 2))
                    } else if (data2[0] == "$GNVTG") {
                        this.true_ground_track = parseFloat(data2[1])
                        this.speed_over_ground = parseFloat(data2[7])
                    }
                }
                basic.pause(2000)
            }
        })

    }

}