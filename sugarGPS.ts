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

    constructor(tx: SerialPin, rx:SerialPin) {
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
        serial.writeLine("$PCAS01,5*19")
        basic.pause(100)
        serial.setBaudRate(115200)
        basic.pause(100)
        serial.writeLine("$PCAS03,1,0,0,0,0,1,0,0,0,0,0,0,0*1E")
        basic.pause(100)
        control.inBackground(() => {
            while (1) {
                let a = serial.readLine()
                if(a){
                    serial.writeString("a:"+a+"\n")
                    let data = a.split(",")
                    if (data[0] == "$GNGGA") {
                        serial.writeString("data:\r\n")
                        for(let i=0;i<data.length;i++){
                            serial.writeString(data[i]+" - ")
                        }
                        serial.writeString("\n")
                        this.satellite_quantity = parseInt(data[7])
                        this.latitude_direction = data[3]
                        this.longitude_direction = data[5]
                        this.latitude = parseFloat(data[2])
                        this.longitude = parseFloat(data[4])
                        this.altitude = parseFloat(data[9])
                        let hms: string = data[1]
                        this.hour = parseInt(hms.substr(0,2))+8
                        if(this.hour > 24){
                            this.hour -= 24
                        }
                        this.minute = parseInt(hms.substr(2, 2))
                        this.sec = parseInt(hms.substr(4, 2))
                    } else if (data[0] == "$GNVTG") {
                        this.true_ground_track = parseFloat(data[1])
                        this.speed_over_ground = parseFloat(data[7])
                    }
                }
            }
        })
        
    }

}