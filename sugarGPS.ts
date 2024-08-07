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
        let setBaud = pins.createBuffer(14)
        let setBaudCode = [0x24, 0x50, 0x43, 0x41, 0x53, 0x30, 0x31, 0x2C, 0x35, 0x2A, 0x31, 0x39, 0x0D, 0x0A]
        for (let i = 0; i < 14; i++) {
            setBaud[i] = setBaudCode[i]
        }
        serial.writeBuffer(setBaud)
        basic.pause(100)
        serial.setBaudRate(115200)
        basic.pause(100)
        let setSend = pins.createBuffer(38)
        let setSendCode = [0x24, 0x50, 0x43, 0x41, 0x53, 0x30, 0x33, 0x2C, 0x31, 0x2C, 0x30, 0x2C, 0x30, 0x2C, 0x30, 0x2C, 0x30, 0x2C, 0x31, 0x2C, 0x30, 0x2C, 0x30, 0x2C, 0x30, 0x2C, 0x30, 0x2C, 0x30, 0x2C, 0x30, 0x2C, 0x30, 0x2A, 0x31, 0x45, 0x0D, 0x0A]
        for (let i = 0; i < 38; i++) {
            setSend[i] = setSendCode[i]
        }
        serial.writeBuffer(setSend)
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
                        this.satellite_quantity = parseInt(data2[7]) ? parseInt(data2[7]) : this.satellite_quantity
                        this.latitude_direction = data2[3] ? data2[3] : this.latitude_direction
                        this.longitude_direction = data2[5] ? data2[5] : this.longitude_direction
                        this.latitude = parseFloat(data2[2]) ? parseFloat(data2[2]) : this.latitude
                        this.longitude = parseFloat(data2[4]) ? parseFloat(data2[4]) : this.longitude
                        this.altitude = parseFloat(data2[9]) ? parseFloat(data2[9]) : this.altitude
                        let hms: string = data2[1]
                        if (hms) {
                            this.hour = parseInt(hms.substr(0, 2)) + 8
                            if (this.hour > 24) {
                                this.hour -= 24
                            }
                            this.minute = parseInt(hms.substr(2, 2))
                            this.sec = parseInt(hms.substr(4, 2))
                        }
                    } else if (data2[0] == "$GNVTG") {
                        this.true_ground_track = parseFloat(data2[1]) ? this.true_ground_track : this.true_ground_track
                        this.speed_over_ground = parseFloat(data2[7]) ? this.speed_over_ground : this.speed_over_ground
                    }
                }
                basic.pause(2000)
            }
        })

    }

}