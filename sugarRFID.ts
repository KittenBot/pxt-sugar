const COMMANDREG = 0x01
const COMIENREG = 0x02
const COMIRQREG = 0x04
const DIVIRQREG = 0x05
const ERRORREG = 0x06
const STATUS2REG = 0x08
const FIFODATAREG = 0x09
const FIFOLEVELREG = 0x0A
const CONTROLREG = 0x0C
const BITFRAMINGREG = 0x0D

const MODEREG = 0x11
const TXCONTROLREG = 0x14

const TXASKREG = 0x15

const CRCRESULTREGMSB = 0x21
const CRCRESULTREGLSB = 0x22
const TMODEREG = 0x2A
const TPRESCALERREG = 0x2B
const TRELOADREGH = 0x2C
const TRELOADREGL = 0x2D

const VERSIONREG = 0x37


const MRFC522_IDLE = 0x00
const MRFC522_CALCCRC = 0x03

const MRFC522_TRANSCEIVE = 0x0C


const MRFC522_MFAUTHENT = 0x0E

const MRFC522_SOFTRESET = 0x0F


const MIFARE_REQUEST = [0x26]
const MIFARE_WAKEUP = [0x52]
const MIFARE_ANTICOLCL1 = [0x93, 0x20]
const MIFARE_SELECTCL1 = [0x93, 0x70]
const MIFARE_ANTICOLCL2 = [0x95, 0x20]
const MIFARE_SELECTCL2 = [0x95, 0x70]
const MIFARE_HALT = [0x50, 0x00]
const MIFARE_AUTHKEY1 = [0x60]
const MIFARE_AUTHKEY2 = [0x61]
const MIFARE_READ = [0x30]
const MIFARE_WRITE = [0xA0]
const MIFARE_DECREMENT = [0xC0]
const MIFARE_INCREMENT = [0xC1]
const MIFARE_RESTORE = [0xC2]
const MIFARE_TRANSFER = [0xB0]

const MIFARE_KEY = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]

const MIFARE_USERDATA = [1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18,
    20, 21, 22, 24, 25, 26, 28, 29, 30, 32, 33, 34, 36, 37,
    38, 40, 41, 42, 44, 45, 46, 48, 49, 50, 52, 53, 54, 56,
    57, 58, 60, 61, 62]

const MI_OK = 0
const MI_NOTAGERR = 1
const MI_ERR = 2

const MAX_LEN = 16

const ADDRRFID = 0x28

const AVAILABLEBLOCK = [1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 20, 21, 22, 24, 25, 26, 28, 29, 30, 32, 33, 34, 36, 37, 38, 40, 41, 42, 44, 45, 46, 48, 49, 50, 52, 53, 54, 56, 57, 58, 60, 61, 62]
//8位内数字转hex字符串
function numberToStrHex(num: number): string {
    let hexmap = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', '10'];
    let hex = "";
    hex += hexmap[Math.floor(num / 16)];
    hex += hexmap[num % 16];
    return hex;
}
class SugarRFID {
    constructor() {
        this.MRFC522_init();
    }

    read_mem(cmd: number, size: number): Buffer {
        pins.i2cWriteNumber(ADDRRFID, cmd, NumberFormat.UInt8BE);
        let data = pins.i2cReadBuffer(ADDRRFID, size);
        return data
    }

    MRFC522_read(address: number) {
        let value = this.read_mem(address, 1)
        return value[0];

    }

    MRFC522_write(address: number, value: number) {
        let buf = pins.createBuffer(2);
        buf[0] = address;
        buf[1] = value;
        pins.i2cWriteBuffer(ADDRRFID, buf);
    }

    MRFC522_setBitMask(address: number, mask: number) {
        let value = this.MRFC522_read(address);
        this.MRFC522_write(address, value | mask);
    }

    MRFC522_reset() {
        this.MRFC522_write(COMMANDREG, MRFC522_SOFTRESET);
    }

    MRFC522_antennaOn() {
        let value = this.MRFC522_read(TXCONTROLREG);
        if (~(value & 0x03)) {
            this.MRFC522_setBitMask(TXCONTROLREG, 0x03);
        }

    }

    MRFC522_clearBitMask(address: number, mask: number) {
        let value = this.MRFC522_read(address);
        let value2 = value & (~mask)
        //serial.writeValue("value2", value2)
        this.MRFC522_write(address, value2);
    }


    MRFC522_init() {
        this.MRFC522_reset();

        this.MRFC522_write(TMODEREG, 0x8D);
        this.MRFC522_write(TPRESCALERREG, 0x3E);
        this.MRFC522_write(TRELOADREGL, 30);
        this.MRFC522_write(TRELOADREGH, 0);

        this.MRFC522_write(TXASKREG, 0x40);
        this.MRFC522_write(MODEREG, 0x3D);

        this.MRFC522_antennaOn();
    }

    showReaderDetails() {
        let version = this.MRFC522_read(VERSIONREG);
        if (version == 0x91) {
            //serial.writeLine('MRFC522 Software Version: ' + version.toString() + ' = v1.0');
        } else if (version == 0x92) {
            //serial.writeLine('MRFC522 Software Version: ' + version.toString() + ' = v2.0');
        }
        else {
            //serial.writeLine('MRFC522 Software Version: ' + version.toString() + '');
        }
    }

    transceiveCard(data: number[]): [number, number[], number] {
        let status = 0;
        let backData: number[] = [];
        let backBits = 0;
        let IRqInv = 0x80;
        let TxIEn = 0x40;
        let RxIEn = 0x20;
        let IdleIEn = 0x10;
        let LoAlertIEn = 0x04;
        let ErrIEn = 0x02;
        let TimerIEn = 0x01;
        this.MRFC522_write(COMIENREG, (IRqInv |
            TxIEn |
            RxIEn |
            IdleIEn |
            LoAlertIEn |
            ErrIEn |
            TimerIEn))
        const Set1 = 0x80;
        this.MRFC522_clearBitMask(COMIRQREG, Set1);
        const FlushBuffer = 0x80;
        this.MRFC522_setBitMask(FIFOLEVELREG, FlushBuffer);
        this.MRFC522_write(COMMANDREG, MRFC522_IDLE);
        let i = 0;
        while (i < data.length) {
            this.MRFC522_write(FIFODATAREG, data[i]);
            i = i + 1;
        }
        this.MRFC522_write(COMMANDREG, MRFC522_TRANSCEIVE);
        const StartSend = 0x80;
        this.MRFC522_setBitMask(BITFRAMINGREG, StartSend);
        const TimerIRq = 0x01;
        const RxIRq = 0x20;
        const IdleIRq = 0x10;
        i = 2000;
        let comIRqReg;
        while (true) {
            comIRqReg = this.MRFC522_read(COMIRQREG);
            if (comIRqReg & TimerIRq) {
                break;
            }
            if (comIRqReg & RxIRq) {
                break;
            }
            if (comIRqReg & IdleIRq) {
                break;
            }
            if (i == 0) {
                break;
            }
        }
        this.MRFC522_clearBitMask(BITFRAMINGREG, StartSend);
        if (i != 0) {
            const BufferOvfl = 0x10;
            const ColErr = 0x08;
            const ParityErr = 0x02;
            const ProtocolErr = 0x01;
            let errorTest = (BufferOvfl | ColErr | ParityErr | ProtocolErr);
            let errorReg = this.MRFC522_read(ERRORREG);
            if (~(errorReg & errorTest)) {
                status = MI_OK;
                const ErrIRq = 0x02;
                if (comIRqReg & TimerIRq & ErrIRq) {
                    status = MI_NOTAGERR;
                }
                let fifoLevelReg = this.MRFC522_read(FIFOLEVELREG)
                if (fifoLevelReg == 0) {
                    fifoLevelReg = 1;
                }
                if (fifoLevelReg > MAX_LEN) {
                    fifoLevelReg = MAX_LEN;
                }
                const RxLastBits = 0x08;
                let lastBits = this.MRFC522_read(CONTROLREG) & RxLastBits;

                if (lastBits != 0) {
                    backBits = (fifoLevelReg - 1) * 8 + lastBits;
                }
                else {
                    backBits = fifoLevelReg * 8;
                }
                i = 0;
                while (i < fifoLevelReg) {
                    let byte: number = this.MRFC522_read(FIFODATAREG);
                    backData.push(byte);
                    i = i + 1;
                }
            } else {
                status = MI_ERR;
            }
        }

        return [status, backData, backBits]
    }
    serialNumberValid(serialNumber: number[]): boolean {
        if (serialNumber.length === 0) {
            return false;
        }

        let serialCheck = 0;
        for (let i = 0; i < serialNumber.length - 1; i++) {
            serialCheck ^= serialNumber[i];
        }

        return serialCheck === serialNumber[serialNumber.length - 1];
    }

    transceive(): [number, number[], number] {
        let status: number = 0;
        let backData: number[] = [];
        let backBits: number = 0;


        this.MRFC522_write(BITFRAMINGREG, 0x00);
        const result = this.transceiveCard(MIFARE_ANTICOLCL1);
        [status, backData, backBits] = result;

        if (status == MI_OK) {
            if (this.serialNumberValid(backData)) {
                status = MI_OK;
            } else {
                status = MI_ERR;
            }
        }
        return [status, backData, backBits]
    }

    scan(): [number, number[], number] {
        this.MRFC522_init();
        let status: number = 0;
        let backData: number[] = [];
        let backBits: number = 0;

        this.MRFC522_write(BITFRAMINGREG, 0x07);
        const result = this.transceiveCard(MIFARE_REQUEST);
        [status, backData, backBits] = result;

        if (status !== MI_OK || backBits !== 0x10) {
            status = MI_ERR;
        }
        return [status, backData, backBits];
    }

    calculateCRC(data: number[]): number[] {
        const CRCIRq = 0x04;
        this.MRFC522_clearBitMask(DIVIRQREG, CRCIRq);

        const FlushBuffer = 0x80;
        this.MRFC522_setBitMask(FIFOLEVELREG, FlushBuffer);

        let i = 0;
        while (i < data.length) {
            this.MRFC522_write(FIFODATAREG, data[i]);
            i = i + 1;
        }
        this.MRFC522_write(COMMANDREG, MRFC522_CALCCRC);
        i = 255;
        while (true) {
            let divirqreg = this.MRFC522_read(DIVIRQREG);
            i = i - 1;
            if (i == 0) {
                break;
            }
            if (divirqreg & CRCIRq) {
                break;
            }
        }
        let crc = [];
        crc.push(this.MRFC522_read(CRCRESULTREGLSB));
        crc.push(this.MRFC522_read(CRCRESULTREGMSB));

        return (crc)
    }

    select(serialNumber: number[]): [number, number[], number] {
        let status: number = 0;
        let backData: number[] = [];
        let backBits: number = 0;

        let buffer: number[] = [];
        for (let i of MIFARE_SELECTCL1) {
            buffer.push(i)
        }
        let i = 0;
        while (i < 5) {
            buffer.push(serialNumber[i]);
            i = i + 1;
        }
        let crc = this.calculateCRC(buffer);
        //serial.writeNumbers(crc)
        for (let i2 of crc) {
            buffer.push(i2)
        }
        //serial.writeNumbers(buffer);
        [status, backData, backBits] = this.transceiveCard(buffer);

        return [status, backData, backBits];
    }

    deauthenticate(): void {
        const MFCrypto1On = 0x08;
        this.MRFC522_clearBitMask(STATUS2REG, MFCrypto1On);
    }

    authenticateCard(data: number[]): [number, number[], number] {
        let status: number = 0;
        let backData: number[] = [];
        let backBits: number = 0;

        const IRqInv = 0x80;
        const IdleIEn = 0x10;
        const ErrIEn = 0x02;
        this.MRFC522_write(COMIENREG, (IRqInv | IdleIEn | ErrIEn));
        const Set1 = 0x80;
        this.MRFC522_clearBitMask(COMIRQREG, Set1);
        const FlushBuffer = 0x80;
        this.MRFC522_setBitMask(FIFOLEVELREG, FlushBuffer);
        this.MRFC522_write(COMMANDREG, MRFC522_IDLE);
        let i = 0;
        while (i < data.length) {
            this.MRFC522_write(FIFODATAREG, data[i]);
            i = i + 1;
        }
        this.MRFC522_write(COMMANDREG, MRFC522_MFAUTHENT);
        const TimerIRq = 0x01;
        const RxIRq = 0x20;
        const IdleIRq = 0x10;
        i = 2000;
        let comIRqReg;
        while (true) {
            comIRqReg = this.MRFC522_read(COMIRQREG);
            if (comIRqReg & TimerIRq) {
                break;
            }
            if (comIRqReg & RxIRq) {
                break;
            }
            if (comIRqReg & IdleIRq) {
                break;
            }
            if (i == 0) {
                break;
            }
        }
        const StartSend = 0x80;
        this.MRFC522_clearBitMask(BITFRAMINGREG, StartSend);
        if (i != 0) {
            const BufferOvfl = 0x10;
            const ColErr = 0x08;
            const ParityErr = 0x02;
            const ProtocolErr = 0x01;
            let errorTest = (BufferOvfl | ColErr | ParityErr | ProtocolErr);
            let errorReg = this.MRFC522_read(ERRORREG);

            if (~(errorReg & errorTest)) {
                status = MI_OK;
                const ErrIRq = 0x02;
                if (comIRqReg & TimerIRq & ErrIRq) {
                    status = MI_NOTAGERR;;
                }
            } else {
                status = MI_ERR;
            }
        }
        return [status, backData, backBits];
    }

    authenticate(mode: number[], blockAddr: number, key: number[], serialNumber: number[]): [number, number[], number] {
        let status: number = 0;
        let backData: number[] = [];
        let backBits: number = 0;

        let buffer: number[] = [];
        for (let i3 of mode) {
            buffer.push(i3)
        }
        buffer.push(blockAddr);
        for (let i4 of key) {
            buffer.push(i4)
        }

        let i = 0;
        while (i < 4) {
            buffer.push(serialNumber[i]);
            i = i + 1;
        }
        [status, backData, backBits] = this.authenticateCard(buffer);

        return [status, backData, backBits];
    }

    read(blockAddr: number): [number, number[], number] {
        let status: number = 0;
        let backData: number[] = [];
        let backBits: number = 0;


        let buffer: number[] = []
        for (let i9 of MIFARE_READ) {
            buffer.push(i9)
        }
        buffer.push(blockAddr)

        let crc = this.calculateCRC(buffer)
        for (let i10 of crc) {
            buffer.push(i10)
        }
        [status, backData, backBits] = this.transceiveCard(buffer)

        return [status, backData, backBits]
    }

    write(blockAddr: number, data: number[]): [number, number[], number] {
        let status: number = 0;
        let backData: number[] = [];
        let backBits: number = 0;

        let buffer: number[] = [];
        for (let i5 of MIFARE_WRITE) {
            buffer.push(i5)
        }
        buffer.push(blockAddr);

        let crc = this.calculateCRC(buffer);
        for (let i6 of crc) {
            buffer.push(i6)
        }

        [status, backData, backBits] = this.transceiveCard(buffer);

        if (status == MI_OK) {

            buffer = [];
            for (let i7 of data) {
                buffer.push(i7)
            }
            crc = this.calculateCRC(buffer);
            for (let i8 of crc) {
                buffer.push(i8)
            }
            [status, backData, backBits] = this.transceiveCard(buffer);
        }

        return [status, backData, backBits]
    }

    scanCar() {
        this.MRFC522_init()
        let status: number = 0;
        let backData: number[] = [];
        let uid: number[] = [];
        let tagType: number = 0;
        let backBits: number = 0;
        //while (true) {
            serial.writeLine("scan Car ing");
            [status, backData, tagType] = this.scan()
            if (status == MI_OK) {
                [status, uid, backBits] = this.transceive()
                if (status == MI_OK) {
                    let uidStr = "";
                    for (let i = 0; i < 4; i++) {
                        let buff = numberToStrHex(uid[i])
                        uidStr += buff;
                    }
                    return uidStr
                }else{
                    return ""
                }
            }else{
                return ""
            }
        //}
    }

    writeBlock(blockAddrP: number, data: string) {
        let status: number = 0;
        let backData: number[] = [];
        let uid: number[] = [];
        let tagType: number = 0;
        let backBits: number = 0;

        let blockAddr = AVAILABLEBLOCK[blockAddrP]
        this.MRFC522_init()
        let dataASCLL = []
        for (let char = 0; char < 16; char++) {
            if (char < data.length) {
                let ord: string = data[char]
                dataASCLL.push(ord.charCodeAt(0))
            } else {
                dataASCLL.push(0x20)
            }
        }
        //serial.writeNumbers(dataASCLL)
        //while (true) {
            [status, backData, tagType] = this.scan()
            if (status == MI_OK) {
                [status, uid, backBits] = this.transceive()
                if (status == MI_OK) {
                    [status, backData, backBits] = this.select(uid)
                    if (status == MI_OK) {
                        let mode = MIFARE_AUTHKEY1;
                        [status, backData, backBits] = this.authenticate(
                            mode,
                            blockAddr,
                            MIFARE_KEY,
                            uid)
                        //serial.writeNumbers(uid);
                        if (status == MI_OK) {
                            if (status == MI_OK) {
                                [status, backData, backBits] = this.write(
                                    blockAddr,
                                    dataASCLL)
                                if (status == MI_OK) {
                                    //serial.writeLine('written succeed')
                                    //break
                                } else {
                                    //serial.writeLine('Error while writing new data')
                                }
                            } else {
                                //serial.writeLine('Error while reading old data')
                            }
                            this.deauthenticate()
                            //serial.writeLine('Card deauthenticated')
                        } else {
                            //serial.writeLine('Authentication error')
                        }
                    }
                }
            }
        //}
    }
    readBlock(blockAddrP: number) {
        let status: number = 0;
        let backData: number[] = [];
        let uid: number[] = [];
        let tagType: number = 0;
        let backBits: number = 0;

        let blockAddr = AVAILABLEBLOCK[blockAddrP]
        this.MRFC522_init();
        //while (true) 
            [status, backData, tagType] = this.scan()
            if (status == MI_OK) {

                [status, uid, backBits] = this.transceive()
                if (status == MI_OK) {
                    [status, backData, backBits] = this.select(uid)
                    if (status == MI_OK) {

                        let mode = MIFARE_AUTHKEY1;
                        [status, backData, backBits] = this.authenticate(
                            mode,
                            blockAddr,
                            MIFARE_KEY,
                            uid)
                        if (status == MI_OK) {

                            [status, backData, backBits] = this.read(
                                blockAddr)
                            if (status == MI_OK) {
                                let hex_list = backData
                                let asc_str = ''
                                for (let hex_str of hex_list) {
                                    let asc = String.fromCharCode(hex_str)
                                    asc_str += asc
                                }
                                asc_str = asc_str.trim()
                                return asc_str
                            } else {
                                //serial.writeLine('Error while reading')
                                return ""
                            }
                            this.deauthenticate()
                            //serial.writeLine('Card deauthenticated')
                        } else {
                            //serial.writeLine('Authentication error')
                            return ""
                        }
                    }else{
                        return ""
                    }
                }else{
                    return ""
                }
            }else{
                return ""
            }
        //}
    }
}