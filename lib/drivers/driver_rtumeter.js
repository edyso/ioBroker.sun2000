const {deviceType,driverClasses,dataRefreshRate,dataType} = require(__dirname + '/../types.js');
const DriverBase = require(__dirname + '/driver_base.js');
const SerialPort = require('serialport');

class RTUMeter extends DriverBase{
	constructor(stateInstance,inverter,options) {
		super(stateInstance,inverter,
			{
				name: 'RTUMeter',
				driverClass : driverClasses.rtuMeter,
				...options,
			});
        
        this.initSerial();
		//https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/stateroles.md
		const newFields = [
			{
				info : 'RTU meter info',
				type : deviceType.meter,
				states: [
					{
						state: {id: 'meter.voltageL1', name: 'Phase 1 voltage', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:32260, len:2'},
						register: {reg: 32260, type: dataType.uint32, gain: 100}
					},
					{
						state: {id: 'meter.voltageL2', name: 'Phase 2 voltage', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:32262, len:2'},
						register: {reg: 32262, type: dataType.uint32, gain:100}
					},
					{
						state: {id: 'meter.voltageL3', name: 'Phase 3 voltage', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:32264, len:2'},
						register: {reg: 32264, type: dataType.uint32, gain:100}
					},
					{
						state: {id: 'meter.currentL1', name: 'Phase 1 Current', type: 'number', unit: 'A', role: 'value.current', desc: 'reg:32272, len:2'},
						register: {reg: 32272, type: dataType.int32, gain:10}
					},
					{
						state: {id: 'meter.currentL2', name: 'Phase 2 Current', type: 'number', unit: 'A', role: 'value.current', desc: 'reg:32274, len:2'},
						register: {reg: 32274, type: dataType.int32, gain:10}
					},
					{
						state: {id: 'meter.currentL3', name: 'Phase 3 Current', type: 'number', unit: 'A', role: 'value.current', desc: 'reg:32276, len:2'},
						register: {reg: 32276, type: dataType.int32, gain:10}
					},
					{
						state: {id: 'meter.activePower', name: 'ActivePower', type: 'number', unit: 'kW', role: 'value.power.active', desc: 'reg:32278, len:2 (>0: feed-in to grid. <0: supply from grid.)' },
						register: { reg: 32278, type: dataType.int32, gain:1000}
					},
					{
						state: {id: 'meter.reactivePower', name: 'Reactive Power', type: 'number', unit: 'VAr', role: 'value.power.reactive', desc: 'reg:32280, len:2'},
						register: {reg: 32280, type: dataType.int32}
					},
					{
						state: {id: 'meter.powerFactor', name: 'Power Factor', type: 'number', unit: '', role: 'value', desc: 'reg:32284, len:1'},
						register: {reg: 32284, type: dataType.int16, gain: 1000}
					},
					{
						state: {id: 'meter.voltageL1-L2', name: 'Voltage L1-L2', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:32266 , len:2'},
						register: {reg: 32266 , type: dataType.uint32, gain: 100}
					},
					{
						state: {id: 'meter.voltageL2-L3', name: 'Voltage L2-L3', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:32268  , len:2'},
						register: {reg: 32268, type: dataType.uint32, gain: 100}
					},
					{
						state: {id: 'meter.voltageL3-L1', name: 'Voltage L3-L1', type: 'number', unit: 'V', role: 'value.voltage', desc: 'reg:32270, len:2'},
						register: {reg: 32270, type: dataType.uint32, gain: 100}
					},
					{
						state: {id: 'meter.activePowerL1', name: 'Active Power L1', type: 'number', unit: 'kW', role: 'value.power', desc: 'reg:32335, len:2'},
						register: {reg: 32335, type: dataType.int32, gain: 1000}
					},
					{
						state: {id: 'meter.activePowerL2', name: 'Active Power L2', type: 'number', unit: 'kW', role: 'value.power', desc: 'reg:32337, len:2'},
						register: {reg: 32337, type: dataType.int32, gain: 1000}
					},
					{
						state: {id: 'meter.activePowerL3', name: 'Active Power L3', type: 'number', unit: 'kW', role: 'value.power', desc: 'reg:32339, len:2'},
						register: {reg: 32339, type: dataType.int32, gain: 1000}
					},
					{
						state: {id: 'meter.positiveActiveEnergy', name: 'Positive Active Energy', type: 'number', unit: 'kWh', role: 'value.power.consumption', desc: 'reg:32357, len:4'},
						register: {reg: 32357, type: dataType.int64, gain: 100}
					},
					{
						state: {id: 'meter.reverseActiveEnergy', name: 'Reverse Active Energy', type: 'number', unit: 'kWh', role: 'value.power.consumption', desc: 'reg:32349, len:4'},
						register: {reg: 32349, type: dataType.int64, gain: 100}
					},
					{
						state: {id: 'meter.accumulatedReactivePower', name: 'Accumulated Reactive Power', type: 'number', unit: 'kVarh', role: 'value.power.reactive.consumption', desc: 'reg:32361, len:4'},
						register: {reg: 32361, type: dataType.int64, gain: 100}
					}
				]
			}
		];
		this.registerFields.push.apply(this.registerFields,newFields);
		//this.postUpdateHooks.push.apply(this.postUpdateHooks,newHooks);
	}

    async updateStates(modbusClient,refreshRate,duration){
        
    }

    initSerial(){
        this.serialport=new SerialPort({path: "dev/ttySMeter",baudRate: 9600});
    }

}

module.exports = {RTUMeter};
