const nedb=require("nedb");

function db(dbPath){
	this.database=new nedb({filename:dbPath,autoload:true});
};

db.prototype.load=function(){
	return this.search({});
};

db.prototype.search=function(key){
	return new Promise((resolve,reject)=>{
		this.database.loadDatabase();
		this.database.find(key).sort({id:-1}).exec((err,docs)=>err?reject(err):resolve(docs));
	});
};

db.prototype.insert=function(record){
	return new Promise((resolve,reject)=>{
		this.database.loadDatabase();
		this.database.insert(record,err=>err?reject(err):resolve());
	});
};

db.prototype.remove=function(key){
	return new Promise((resolve,reject)=>{
		this.database.loadDatabase();
		this.database.remove({_id:key},{},(err,num)=>err?reject(err):resolve());
	});
};

module.exports=db;
