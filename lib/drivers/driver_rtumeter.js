const { deviceType, driverClasses, dataRefreshRate, dataType } = require(__dirname + '/../types.js');
const DriverBase = require(__dirname + '/driver_base.js');

class RTUMeter extends DriverBase {
	constructor(stateInstance, inverter, options) {
		super(stateInstance, inverter,
			{
				name: 'RTUMeter',
				driverClass: driverClasses.rtuMeter,
				...options,
			});

		//https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/stateroles.md
		const newFields = [
			{
				info: 'RTU meter info',
				type: deviceType.meter,
				states: [
					{
						state: { id: 'meter.voltageL1', name: 'Phase 1 voltage', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:2110, len:2' },
						register: { reg: 32260, type: dataType.uint32, gain: 100 }
					},
					{
						state: { id: 'meter.voltageL2', name: 'Phase 2 voltage', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:2112, len:2' },
						register: { reg: 32262, type: dataType.uint32, gain: 100 }
					},
					{
						state: { id: 'meter.voltageL3', name: 'Phase 3 voltage', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:2114, len:2' },
						register: { reg: 32264, type: dataType.uint32, gain: 100 }
					},
					{
						state: { id: 'meter.currentL1', name: 'Phase 1 Current', type: 'number', unit: 'A', role: 'value.current', desc: 'reg:2102, len:2' },
						register: { reg: 32272, type: dataType.int32, gain: 10 }
					},
					{
						state: { id: 'meter.currentL2', name: 'Phase 2 Current', type: 'number', unit: 'A', role: 'value.current', desc: 'reg:2104, len:2' },
						register: { reg: 32274, type: dataType.int32, gain: 10 }
					},
					{
						state: { id: 'meter.currentL3', name: 'Phase 3 Current', type: 'number', unit: 'A', role: 'value.current', desc: 'reg:2106, len:2' },
						register: { reg: 32276, type: dataType.int32, gain: 10 }
					},
					{
						state: { id: 'meter.activePower', name: 'ActivePower', type: 'number', unit: 'kW', role: 'value.power.active', desc: 'reg:2126, len:2 (>0: feed-in to grid. <0: supply from grid.)' },
						register: { reg: 32278, type: dataType.int32, gain: 1000 }
					},
					{
						state: { id: 'meter.reactivePower', name: 'Reactive Power', type: 'number', unit: 'VAr', role: 'value.power.reactive', desc: 'reg:2134, len:2' },
						register: { reg: 32280, type: dataType.int32 }
					},
					{
						state: { id: 'meter.powerFactor', name: 'Power Factor', type: 'number', unit: '', role: 'value', desc: 'reg:????, len:1' },
						register: { reg: 32284, type: dataType.int16, gain: 1000 }
					},
					{
						state: { id: 'meter.voltageL1-L2', name: 'Voltage L1-L2', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:2118 , len:2' },
						register: { reg: 32266, type: dataType.uint32, gain: 100 }
					},
					{
						state: { id: 'meter.voltageL2-L3', name: 'Voltage L2-L3', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:2120  , len:2' },
						register: { reg: 32268, type: dataType.uint32, gain: 100 }
					},
					{
						state: { id: 'meter.voltageL3-L1', name: 'Voltage L3-L1', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:2122, len:2' },
						register: { reg: 32270, type: dataType.uint32, gain: 100 }
					},
					{
						state: { id: 'meter.activePowerL1', name: 'Active Power L1', type: 'number', unit: 'kW', role: 'value.power', desc: 'reg:2128, len:2' },
						register: { reg: 32335, type: dataType.int32, gain: 1000 }
					},
					{
						state: { id: 'meter.activePowerL2', name: 'Active Power L2', type: 'number', unit: 'kW', role: 'value.power', desc: 'reg:2130, len:2' },
						register: { reg: 32337, type: dataType.int32, gain: 1000 }
					},
					{
						state: { id: 'meter.activePowerL3', name: 'Active Power L3', type: 'number', unit: 'kW', role: 'value.power', desc: 'reg:2132, len:2' },
						register: { reg: 32339, type: dataType.int32, gain: 1000 }
					},
					{
						state: { id: 'meter.positiveActiveEnergy', name: 'Positive Active Energy', type: 'number', unit: 'kWh', role: 'value.power.consumption', desc: 'reg:2174, len:4' },
						register: { reg: 32357, type: dataType.int64, gain: 100 }
					},
					{
						state: { id: 'meter.reverseActiveEnergy', name: 'Reverse Active Energy', type: 'number', unit: 'kWh', role: 'value.power.consumption', desc: 'reg:2166, len:4' },
						register: { reg: 32349, type: dataType.int64, gain: 100 }
					},
					{
						state: { id: 'meter.accumulatedReactivePower', name: 'Accumulated Reactive Power', type: 'number', unit: 'kVarh', role: 'value.power.reactive.consumption', desc: 'reg:32361, len:4' },
						register: { reg: 32361, type: dataType.int64, gain: 100 }
					}
				]
			}
		];
		this.registerFields.push.apply(this.registerFields, newFields);
	}

	async updateStates(modbusClient, refreshRate, duration) {
		if (!this.serialport) this.initSerial();
		return 0
	}

	initSerial() {
		const { SerialPort } = require('serialport');
		this.serialport = new SerialPort({ path: "/dev/ttySPV", baudRate: 9600 });
		const { InterByteTimeoutParser } = require('@serialport/parser-inter-byte-timeout');
		this.parser = this.serialport.pipe(new InterByteTimeoutParser({ interval: 50 }));
		this.ts = 0;
		this.serialport.on("open", () => { this.log.info("rtumeter.port opened") });
		this.serialport.on("error", (err) => { this.log.error("rtumeter.port error: ", err.message) });
		this.parser.on("data", this.ondata(data));
	}

	async ondata(data) {
		let val;
		let path = ""
		if (data.length < 32) return;
		if (data[10] + 13 != data.length) return;
		if (data[3] == 0x4e) {
			if (Date.now() - this.ts > 1000) {
				val = round(-data.readFloatBE(11) / 1000, 3);
				if (val != this.stateCache.get("meter.activePower").value) {
					this.stateCache.set("meter.activePower", val)
					await this.adapter.setState("meter.activePower", { val: val, ack: true });
					this.stateCache.set("meter.activePower", val);
				}
				this.ts = Date.now();
			}
			return;
		}
		if (data[3] == 0x58) {
			val = round(data.readFloatBE(71), 3);
			this.stateCache.set('meter.positiveActiveEnergy', val)
			val = round(data.readFloatBE(87), 3);
			this.stateCache.set('meter.reverseActiveEnergy', val)
			return;
		}
	}

}

module.exports = { RTUMeter };
