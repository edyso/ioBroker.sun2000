const { deviceType, driverClasses, dataRefreshRate, dataType } = require(__dirname + '/../types.js');
const DriverBase = require(__dirname + '/driver_base.js');
const { SerialPort } = require('serialport');
const { InterByteTimeoutParser } = require('@serialport/parser-inter-byte-timeout');

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
					{ state: { id: 'meter.voltageL1', name: 'Phase 1 voltage', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:2110, len:2' } },
					{ state: { id: 'meter.voltageL2', name: 'Phase 2 voltage', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:2112, len:2' } },
					{ state: { id: 'meter.voltageL3', name: 'Phase 3 voltage', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:2114, len:2' } },
					{ state: { id: 'meter.currentL1', name: 'Phase 1 Current', type: 'number', unit: 'A', role: 'value.current', desc: 'reg:2102, len:2' } },
					{ state: { id: 'meter.currentL2', name: 'Phase 2 Current', type: 'number', unit: 'A', role: 'value.current', desc: 'reg:2104, len:2' } },
					{ state: { id: 'meter.currentL3', name: 'Phase 3 Current', type: 'number', unit: 'A', role: 'value.current', desc: 'reg:2106, len:2' } },
					{ state: { id: 'meter.activePower', name: 'ActivePower', type: 'number', unit: 'kW', role: 'value.power.active', desc: 'reg:2126, len:2 (>0: feed-in to grid. <0: supply from grid.)' } },
					{ state: { id: 'meter.reactivePower', name: 'Reactive Power', type: 'number', unit: 'VAr', role: 'value.power.reactive', desc: 'reg:2134, len:2' } },
					{ state: { id: 'meter.powerFactor', name: 'Power Factor', type: 'number', unit: '', role: 'value', desc: 'reg:2150, len:1' } },
					{ state: { id: 'meter.voltageL1-L2', name: 'Voltage L1-L2', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:2118 , len:2' } },
					{ state: { id: 'meter.voltageL2-L3', name: 'Voltage L2-L3', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:2120  , len:2' } },
					{ state: { id: 'meter.voltageL3-L1', name: 'Voltage L3-L1', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:2122, len:2' } },
					{ state: { id: 'meter.activePowerL1', name: 'Active Power L1', type: 'number', unit: 'kW', role: 'value.power', desc: 'reg:2128, len:2' } },
					{ state: { id: 'meter.activePowerL2', name: 'Active Power L2', type: 'number', unit: 'kW', role: 'value.power', desc: 'reg:2130, len:2' } },
					{ state: { id: 'meter.activePowerL3', name: 'Active Power L3', type: 'number', unit: 'kW', role: 'value.power', desc: 'reg:2132, len:2' } },
					{ state: { id: 'meter.positiveActiveEnergy', name: 'Positive Active Energy', type: 'number', unit: 'kWh', role: 'value.power.consumption', desc: 'reg:2174, len:2' } },
					{ state: { id: 'meter.reverseActiveEnergy', name: 'Reverse Active Energy', type: 'number', unit: 'kWh', role: 'value.power.consumption', desc: 'reg:2166, len:2' } },
					{ state: { id: 'meter.accumulatedReactivePower', name: 'Accumulated Reactive Power', type: 'number', unit: 'kVarh', role: 'value.power.reactive.consumption', desc: 'reg:2222, len:4' } }
				]
			}
		];
		this.registerFields.push.apply(this.registerFields, newFields);
		this._rtumeterRegMap = {
			2102: { id: 'meter.currentL1', conv: 1 },  //startaddress
			2104: { id: 'meter.currentL2', conv: 1 },
			2106: { id: 'meter.currentL3', conv: 1 },
			//2108: { id: 'meter.voltageavgL1L2L3', conv: 1 },
			2110: { id: 'meter.voltageL1', conv: 1 },
			2112: { id: 'meter.voltageL2', conv: 1 },
			2114: { id: 'meter.voltageL3', conv: 1 },
			//2116: { id: 'meter.voltageavgL1-L2-L3', conv: 1 },
			2118: { id: 'meter.voltageL1-L2', conv: 1 },
			2120: { id: 'meter.voltageL2-L3', conv: 1 },
			2122: { id: 'meter.voltageL3-L1', conv: 1 },
			2124: { id: 'meter.gridFrequency', conv: 1 },
			2126: { id: 'meter.activePower', conv: -.001, liveval: true },  //startaddress
			2128: { id: 'meter.activePowerL1', conv: -1 },
			2130: { id: 'meter.activePowerL2', conv: -1 },
			2132: { id: 'meter.activePowerL3', conv: -1 },
			2134: { id: 'meter.reactivePower', conv: -1 },
			//2136:{id:'meter.reactivePowerL1',conv:-1},
			//2138:{id:'meter.reactivePowerL2',conv:-1},
			//2140:{id:'meter.reactivePowerL3',conv:-1},
			//2142:{id:'meter.apparentPower',conv:1},    
			//2144:{id:'meter.apparentPowerL1',conv:1},
			//2146:{id:'meter.apparentPowerL2',conv:1},
			//2148:{id:'meter.apparentPowerL3',conv:1},
			2150: { id: 'meter.powerFactor', conv: 1 },
			//2152:{id:'meter.powerFactorL1',conv:-1},
			//2154:{id:'meter.powerFactorL2',conv:-1},
			//2156:{id:'meter.powerFactorL3',conv:-1},
			//2158:{id:'meter.totalActiveEnergy',conv:1},    
			//2160:{id:'meter.totalActiveEnergyL1',conv:1},    
			//2162:{id:'meter.totalActiveEnergyL2',conv:1},    
			//2164:{id:'meter.totalActiveEnergyL3',conv:1},
			2166: { id: 'meter.reverseActiveEnergy', conv: 1 },
			//2168:{id:'meter.reverseActiveEnergyL1',conv:1},
			//2170:{id:'meter.reverseActiveEnergyL2',conv:1},
			//2172:{id:'meter.reverseActiveEnergyL3',conv:1},
			2174: { id: 'meter.positiveActiveEnergy', conv: 1 },
			//2176:{id:'meter.positiveActiveEnergyL1',conv:1},
			//2178:{id:'meter.positiveActiveEnergyL2',conv:1},
			//2180:{id:'meter.positiveActiveEnergyL3',conv:1},
			//2214: { id: 'meter.cosphi'}, //startaddress
			//2216:0
			//2218:0
			//2220:0
			2222: { id: 'meter.accumulatedReactivePower', conv: 1 }
		}
		this._activePowerValues = [];
		this._offset = 11;
		this._ts = Date.now();
		this._maxRetries = 5;
		this._counterReopen = 0;
	}

	updateStates(modbusClient, refreshRate, duration) {
		//do nothing
		return 0;
	}

	initSerial() {
		this._serialport = new SerialPort({ path: this.adapter.settings.rtumeter.device, baudRate: 9600, autoOpen: false });
		this._parser = this._serialport.pipe(new InterByteTimeoutParser({ interval: 50 }));
		this._serialport.on('open', () => {
			this.log.info('rtumeter.port opened');
			this._counterReopen = 0;
		});
		this._serialport.on('error', (err) => { this.log.error("rtumeter.port: ", err.message) });
		this._serialport.on('close', this._onClose.bind(this));
		this._parser.on('data', this._onData.bind(this));
		this._openPort();
	}

	_openPort() {
		this._serialport.open((err) => {
			if (err) {
				this.log.error("rtumeter.port: " + err.message);
				if (this._counterReopen < this._maxRetries) {
					setTimeout(this._openPort.bind(this), 5000);
					this._counterReopen++;
				}
			}
		});
	}

	_median() {
		this._activePowerValues.sort((a, b) => a - b);
		let middle = Math.floor(this._activePowerValues.length / 2);
		if (this._activePowerValues.length % 2 === 0) {
			return (this._activePowerValues[middle - 1] + this._activePowerValues[middle]) / 2;
		} else {
			return this._activePowerValues[middle];
		}
	}

	_onData(data) {
		if (data.length < 32) return;
		if ((data[0] << 8) + data[1] != 2819) return; //0xb,0x3 read(0x3) meterid 11(0xb)
		if (data[10] + 13 != data.length) return; //13 master2slave
		let registerStart = data.readUInt16BE(2);
		let value;
		if (registerStart == 2126) {
			if (Date.now() - this._ts < 5000) {
				value = data.readFloatBE(this._offset) * this._rtumeterRegMap[2126].conv;
				this._activePowerValues.push(value);
				return;
			}
			this._ts = Date.now();
		}
		//if (!this._rtumeterRegMap[registerStart]) return;
		let register;
		for (let i = 0; i + 4 + this._offset < data.length; i += 4) {
			register = this._rtumeterRegMap[registerStart + i / 2];
			if (register) {
				value = data.readFloatBE(i + this._offset) * register.conv;
				if (register.liveval) {
					this._activePowerValues.push(value);
					value = this._median();
					value = Math.round((value + Number.EPSILON) * 1000) / 1000;
					this.adapter.setState(register.id, { val: value, ack: true });
					this.stateCache.set(register.id, value, { type: 'number', stored: register.liveval });
					this._activePowerValues = [];
				} else {
					this.stateCache.set(register.id, value, { type: 'number' });
				}
			}
		}
	}

	_onUnload(callback) {
		if (this._serialport) {
			if (this._serialport.isOpen) {
				//this._counterReopen = this._maxRetries + 1;
				this._serialport.removeListener("close", this._onClose)
				this._serialport.close();
				if (this._parser.isOpen) this._parser.close();
			}
			callback();
		}
	}

	_onClose() {
		this.log.warn("rtumeter.port closed, try reconnect");
		setTimeout(this._openPort.bind(this), 5000);
	}
}

module.exports = RTUMeter;
