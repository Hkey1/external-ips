const os     = require('node:os');
const assert = require('node:assert');

function normalizeFamily(family){
	if(family==='IPv6' || family==='v6' || family==='6' || family===6){
		return 6;
	} else if(family==='IPv4' || family==='v4' || family==='4' || family===4){
		return 4;
	} else if(family===false || family===null || family===undefined){
		return false;
	} else throw new Error('bad family='+family);
}
class AbstractObject {
	constructor(family){
		assert(this.constructor!==AbstractObject); //Abstract
		assert.equal(typeof this.__next,   'function');
		assert.equal(typeof this.__random, 'function');
		this.family = normalizeFamily(family);
	}
	patchAgent(agent, defaultFamily=false){
		defaultFamily = normalizeFamily(defaultFamily);
		assert.equal(typeof agent,                  'object');
		assert.equal(typeof agent.createConnection, 'function');
		const old  = agent.createConnection;
		const self = this;
		agent.createConnection = (options, callback)=>{
			const family = options.family ? normalizeFamily(options.family)||defaultFamily : defaultFamily;
			if((!family || !self.family || self.family===family) && !options.localAddress){
				const ip = self.random();
				if(ip){
					options.localAddress = ip.address ? ip.address : ip;
				}
			}
			return old.call(agent, options, callback);
		}
	}
	checkFamily(family){
		family = normalizeFamily(family);
		family===false || this.family===false || assert.equal(family, this.family);
		return family;
	}
	random(family){
		const ip = this._random(family);
		if(ip){
			return ip.address; 
		} //else console.log('!!!!!!!ip.rnd', this.constructor.name, this.length)
	}
	next(family){
		const ip = this._next(family);
		if(ip){
			return ip.address; 
		} //else console.log('!!!!!!!ip.nxt', this.constructor.name, this.length)
	}
	_random(family){
		return this.__random(this.checkFamily(family)) 
	}
	_next(family){
		return this.__next(this.checkFamily(family))
	}
};

class IP extends AbstractObject{
	constructor(info){
		assert(info.address); assert(info.family);
		super(info.family);
		assert(this.family)
		this.info    = info;
		this.address = info.address;
	}
	toString(){
		return this.address;
	}
	__random(){return this}
	__next(){return this}	
};

fid = 0
class FamilyList extends AbstractObject{
	ips       = [];
	lastIndex = 0; 
	constructor(family){
		super(family);
		this.fid = fid++; 
		//Object.defineProperty(this, 'lastIndex', {
		//	value: 0,
		//	enumerable: false,
		//	writable  : true,
		//})
	}
	push(...ips){
		ips.forEach(ip=>{
			assert(ip instanceof IP);
			assert(ip.family)
			this.checkFamily(ip.family)
		});
		return this.ips.push(...ips);
	}
	get length(){
		return this.ips.length;
	}
	__random(){
		const pos = Math.floor(this.length*Math.random());
		const res = this.ips[pos]; 
		//console.log(this.ips);
		//console.log('__random', 'length='+this.length, 'pos='+pos, res)
		return res;
	}
	__next(){
		const res      = this.ips[this.lastIndex];
		this.lastIndex = (this.lastIndex+1)%this.length;
		return res;
	}
	print(){
		console.log('v'+(this.family || '*'), this.length, this.ips.map(ip=>ip+''))
	}
};


class MainList extends AbstractObject{
	constructor(){
		super(false);
		this.all = new FamilyList(false);
		this.v4  = new FamilyList(4);
		this.v6  = new FamilyList(6);
		Object.defineProperty(this, 'byFamily', {
			value     : {
				false : this.all,
				4     : this.v4,
				6     : this.v6,
			},
			enumerable: false,
			writable  : false,
		});		
	}
	get length(){
		return this.all.length;
	}
	get ips(){
		return this.all.ips;
	}
	__random(family){
		return this.byFamily[family].random(family);
	}
	__next(){
		return this.byFamily[family].random(family);
	}
	push(...ips){
		ips.forEach(ip=>assert(ip instanceof IP));
		if(ips.length===1){
			const ip = ips[0];
			this.all.push(ip);
			this.byFamily[ip.family].push(ip);
		} else {
			ips.forEach(ip=>this.push(ip))
		}
	}
	print(){
		this.v4.print();
		this.v6.print();
	}
};

const mainList = new MainList();
Object.values(os.networkInterfaces()).forEach(arr=>{
	mainList.push(...arr.filter(ip=>!ip.internal).map(ip=>new IP(ip)))
});

//console.log('--------------')
//mainList.print();
//console.log('/--------------')

mainList.MainList       = MainList;
mainList.IP             = IP;
mainList.AbstractObject = AbstractObject;
mainList.FamilyList     = FamilyList;

module.exports = mainList;