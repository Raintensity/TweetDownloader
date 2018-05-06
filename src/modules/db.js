const nedb=require("nedb");

function db(dbPath){
	this.database=new nedb({filename:dbPath,autoload:true});
};

db.prototype.load=function(callback){
	this.database.loadDatabase();
	this.database.find({}).sort({id_str:-1}).exec((err,docs)=>callback(err,docs));
};

db.prototype.search=function(key,callback){
	this.database.loadDatabase();
	this.database.find(key).sort({id_str:-1}).exec((err,docs)=>callback(err,docs));
};

db.prototype.insert=function(record,callback){
	this.database.insert(record,err=>callback(err));
};

db.prototype.remove=function(key,callback){
	this.database.loadDatabase();
	this.database.remove({_id:key},{},(err,num)=>callback(err,num));
};

module.exports=db;
