// node tests/encoderMotor.test.js [path-to-pxt-microbit]
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {createRequire} = require('module');
const root = path.resolve(__dirname, '..');
const targetDir = path.resolve(process.argv[2] || path.join(root, 'node_modules/pxt-microbit'));
const targetRequire = createRequire(path.join(targetDir, 'package.json'));
require(targetRequire.resolve('pxt-core/built/pxt.js'));
const {pxt, pxtc, ts} = global;
const target = JSON.parse(fs.readFileSync(path.join(targetDir, 'built/target.json'), 'utf8'));
pxt.setAppTarget(target);
const source = fs.readFileSync(path.join(root, 'sugarEncoderMotor.ts'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(root, 'pxt.json'), 'utf8'));
assert(config.files.includes('sugarEncoderMotor.ts'));
const sample = `
Sugar.encoderMotorInit(SerialPin.P2, SerialPin.P12)
Sugar.encoderMotorChangeId(Sugar.EncoderMotorAddress.M1)
Sugar.encoderMotorTorque(Sugar.EncoderMotorId.M1, Sugar.EncoderMotorTorque.Locked)
if (Sugar.encoderMotorReady(Sugar.EncoderMotorAddress.M1)) {
    Sugar.encoderMotorSetMode(Sugar.EncoderMotorMode.Relative)
    Sugar.encoderMotorPositionTime(Sugar.EncoderMotorId.M1, -90, 1000)
    Sugar.encoderMotorPositionSpeed(Sugar.EncoderMotorId.M1, 90, 180)
    Sugar.encoderMotorSpeedTime(Sugar.EncoderMotorId.M1, -360, 1000)
    Sugar.encoderMotorSpeed(Sugar.EncoderMotorId.All, 360)
    let angle = Sugar.encoderMotorAngle(Sugar.EncoderMotorAddress.M1)
    if (!isNaN(angle)) basic.showNumber(angle)
    Sugar.encoderMotorStop()
}`;
const fileSystem = {'main.ts': sample};
for (const pkg of ['core', 'microphone']) {
    for (const [name, contents] of Object.entries(target.bundledpkgs[pkg])) {
        if (name.endsWith('.ts')) fileSystem[`pxt_modules/${pkg}/${name}`] = contents;
    }
}
for (const name of config.files.filter(name => name.endsWith('.ts'))) {
    fileSystem['pxt_modules/sugar/' + name] = fs.readFileSync(path.join(root, name), 'utf8');
}
const opts = {fileSystem, sourceFiles: Object.keys(fileSystem), target: {...target.compile, isNative: false}, ast: true};
const compiled = pxtc.compile(opts);
assert(compiled.success, JSON.stringify(compiled.diagnostics));
const apis = pxtc.getApiInfo(compiled.ast);
const blocks = pxtc.getBlocksInfo(apis).blocks.filter(fn => fn.name.startsWith('encoderMotor') && fn.namespace === 'Sugar');
assert.equal(blocks.length, 11);
for (const fn of blocks) {
    assert.equal(fn.attributes.subcategory, 'Actuator');
    assert.equal(fn.attributes.group, 'Encoder Motor');
}
for (const locale of ['zh-CN', 'zh-TW']) {
    const strings = JSON.parse(fs.readFileSync(path.join(root, '_locales', locale, 'sugar-strings.json'), 'utf8'));
    for (const fn of blocks) {
        const text = strings[`Sugar.${fn.name}|block`];
        assert(text, `${locale}: missing ${fn.name}`);
        const names = text => (text.match(/%\w+/g) || []).sort();
        assert.deepEqual(names(text), names(fn.attributes.block));
    }
}
const decompiled = pxtc.decompile(compiled.ast, opts, 'main.ts');
assert(decompiled.success, JSON.stringify(decompiled.diagnostics));
for (const fn of blocks) assert(decompiled.outfiles['main.blocks'].includes(`type="${fn.attributes.blockId}"`));

const code = ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2015}}).outputText;
const format = {Int32LE: 1, UInt32LE: 2};
Buffer.fromArray = values => Buffer.from(values);
Buffer.prototype.setNumber = function (type, offset, value) {
    if (type === format.Int32LE) this.writeInt32LE(value, offset);
    else { assert.equal(type, format.UInt32LE); this.writeUInt32LE(value, offset); }
};
Buffer.prototype.getNumber = function (type, offset) {
    assert.equal(type, format.Int32LE);
    return this.readInt32LE(offset);
};
// Independent expression of the Python checksum: a byte contributes once to
// cks1 and once for each remaining cks2 accumulation.
function checked(bytes) {
    const checksum = (0xAB + 0xAC + bytes.length * 0xAB
        + bytes.reduce((sum, byte, i) => sum + byte * (bytes.length - i + 1), 0)) & 255;
    return Buffer.from([...bytes, checksum]);
}
function reply(id, cmd, payload = []) { return checked([0xAC, id, payload.length + 5, cmd, ...payload]); }
function setup(responder = () => []) {
    const frames = [], events = [];
    let now = 0, tx, rx, pending = [], replyAt = 0;
    const context = vm.createContext({
        Buffer, Math, NaN, NumberFormat: format,
        SerialPin: {P0: 100, P1: 101, P2: 102, P8: 108, P12: 112, P13: 113, P14: 114, P15: 115, P16: 116},
        BaudRate: {BaudRate115200: 115200}, PinPullMode: {PullUp: 1},
        pins: {createBuffer: size => Buffer.alloc(size),
            digitalReadPin(pin) { events.push(['input', pin]); return 1; },
            setPull(pin, mode) { events.push(['pull', pin, mode]); }},
        control: {panic(code) { throw new Error(`panic ${code}`); }},
        basic: {pause(ms) { now += ms; }}, input: {runningTime: () => now},
        serial: {
            setRxBufferSize(size) { assert.equal(size, 128); },
            redirect(t, r, baud) { tx = t; rx = r; assert.equal(baud, 115200); events.push(['uart', t, r]); },
            writeBuffer(frame) {
                assert.equal(tx, 102); assert.equal(rx, 112);
                assert.deepEqual(frame, checked([...frame.subarray(0, -1)]));
                assert.equal(frame.length, frame[2]);
                frames.push(Buffer.from(frame)); events.push(['write', frame[3]]);
                pending = responder(frame, frames.length).map(Buffer.from);
                replyAt = now + 1;
            },
            readBuffer(size) {
                assert.equal(size, 0, 'Only nonblocking binary reads are allowed');
                if (tx !== 112 || rx !== 102 || now < replyAt || !pending.length) return Buffer.alloc(0);
                replyAt = now + 1;
                return pending.shift();
            }
        }
    });
    vm.runInContext(code, context);
    return {call: expression => vm.runInContext(expression, context), frames, events,
        time: () => now, direction: () => [tx, rx]};
}
function payloads(frames) { return frames.map(frame => [...frame.subarray(0, -1)]); }
let device = setup(frame => frame[3] === 0x40 && frame.length === 5 ? [reply(frame[1], 0x40, [3])] : []);
device.call('Sugar.encoderMotorInit(); Sugar.encoderMotorChangeId(Sugar.EncoderMotorAddress.M2)');
assert.deepEqual(payloads(device.frames), [
    [0xAB, 0xFD, 7, 0x10, 2, 0], [0xAB, 0xFE, 9, 0x2E, 0xF1, 0xF2, 0xF3, 0xF4]
]);
device.frames.length = 0;
device.call(`Sugar.encoderMotorTorque(Sugar.EncoderMotorId.M1, Sugar.EncoderMotorTorque.Released);
    Sugar.encoderMotorSetMode(Sugar.EncoderMotorMode.Relative);
    Sugar.encoderMotorSetMode(Sugar.EncoderMotorMode.Absolute);
    Sugar.encoderMotorPositionTime(Sugar.EncoderMotorId.M1, -90, 1000);
    Sugar.encoderMotorPositionSpeed(Sugar.EncoderMotorId.M1, 90, 180);
    Sugar.encoderMotorSpeedTime(Sugar.EncoderMotorId.M1, -360, 1000);
    Sugar.encoderMotorSpeed(Sugar.EncoderMotorId.All, 999);
    Sugar.encoderMotorStop()`);
assert.deepEqual(payloads(device.frames), [
    [0xAB, 1, 6, 0x40, 0], [0xAB, 0xFD, 7, 0x47, 2, 0], [0xAB, 0xFD, 7, 0x47, 0, 0],
    [0xAB, 1, 5, 0x40], [0xAB, 1, 13, 0x43, 0x7C, 0xFC, 0xFF, 0xFF, 0xE8, 3, 0, 0],
    [0xAB, 1, 5, 0x40], [0xAB, 1, 13, 0x44, 0x84, 3, 0, 0, 180, 0, 0, 0],
    [0xAB, 1, 13, 0x4A, 0x98, 0xFE, 0xFF, 0xFF, 0xE8, 3, 0, 0],
    [0xAB, 0xFD, 13, 0x4A, 0xBC, 2, 0, 0, 0, 0, 0, 0],
    [0xAB, 0xFE, 6, 0x40, 3], [0xAB, 0xFE, 6, 0x40, 1], [0xAB, 0xFE, 6, 0x40, 2]
]);
assert(device.events.some((event, i, all) => event[0] === 'write' && event[1] === 0x40
    && all[i + 1][0] === 'input' && all[i + 1][1] === 102
    && all[i + 5][0] === 'uart' && all[i + 5][1] === 112 && all[i + 5][2] === 102));
assert.deepEqual(device.direction(), [102, 112]);

// Negative and zero angles, fragmented binary responses, leading noise,
// wrong address/command, corrupt checksum, false header, and trailing data.
for (const tenths of [-2147483648, -900, 0, 1234, 2147483647]) {
    const value = Buffer.alloc(4); value.writeInt32LE(tenths);
    const good = reply(1, 0x56, [...value]);
    const bad = Buffer.from(good); bad[bad.length - 1] ^= 1;
    const data = Buffer.concat([Buffer.from([0, 0xFF, 0xAC, 1, 0x7F]), reply(2, 0x56, [...value]),
        reply(1, 0x05, [...value]), bad, good, Buffer.from([0xFF])]);
    for (let split = 0; split <= data.length; split++) {
        device = setup(() => [data.subarray(0, split), data.subarray(split)]);
        assert.equal(device.call('Sugar.encoderMotorAngle(Sugar.EncoderMotorAddress.M1)'), tenths / 10);
        assert.equal(device.frames.length, 1);
        assert.deepEqual(device.direction(), [102, 112]);
    }
}
device = setup(frame => [reply(frame[1], 0x02)]);
assert.equal(device.call('Sugar.encoderMotorReady(Sugar.EncoderMotorAddress.M1)'), true);
device = setup();
assert.equal(device.call('Sugar.encoderMotorReady(Sugar.EncoderMotorAddress.M1)'), false);
assert.equal(device.frames.length, 50);
assert.equal(device.time(), 4000);
assert.deepEqual(device.direction(), [102, 112]);
assert(Number.isNaN(device.call('Sugar.encoderMotorAngle(Sugar.EncoderMotorAddress.M1)')));
assert.equal(device.frames.length, 100);
device.call('Sugar.encoderMotorSpeed(Sugar.EncoderMotorId.M1, 360)');
assert.equal(device.frames.at(-1)[3], 0x4A, 'Timeout must release the transaction lock');

device = setup(frame => frame[3] === 0x40 && frame.length === 5 ? [reply(1, 0x40, [0])] : []);
device.call('Sugar.encoderMotorPositionTime(Sugar.EncoderMotorId.M1, 0, 0)');
assert.deepEqual(payloads(device.frames).map(bytes => bytes.slice(1, 4)), [[1, 5, 0x40], [1, 6, 0x40], [1, 13, 0x43]]);
assert.equal(device.time(), 1, 'A valid zero enabled-state must not time out');
device = setup();
device.call('Sugar.encoderMotorPositionTime(Sugar.EncoderMotorId.All, 90, 1000)');
assert.deepEqual(payloads(device.frames).map(bytes => bytes.slice(1, 4)), [[0xFD, 6, 0x40], [0xFD, 13, 0x43]]);
assert.equal(device.time(), 0, 'Broadcast moves must not query multiple motors');
for (const expression of [
    'Sugar.encoderMotorInit(SerialPin.P2, SerialPin.P2)', 'Sugar.encoderMotorInit(1001, 1002)',
    'Sugar.encoderMotorChangeId(253)', 'Sugar.encoderMotorReady(253)', 'Sugar.encoderMotorAngle(253)',
    'Sugar.encoderMotorSetMode(1)', 'Sugar.encoderMotorTorque(1, 2)',
    'Sugar.encoderMotorPositionTime(1, NaN, 1000)', 'Sugar.encoderMotorPositionTime(1, 90, -1)',
    'Sugar.encoderMotorPositionSpeed(1, 90, -180)', 'Sugar.encoderMotorSpeedTime(1, 360, -1)'
]) {
    device = setup();
    assert.throws(() => device.call(expression), /panic 910/);
    assert.equal(device.frames.length, 0);
}
console.log(`PASS micro:bit ${target.versions.target}: 11 actuator blocks, locales, compilation/decompilation, wire frames, half duplex, fragmented/noisy responses, signed/zero angles, retries, timeout recovery, broadcasts and validation.`);
