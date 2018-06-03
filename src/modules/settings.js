const fs=require("fs");

let loaded=null;
const settings={
	load:()=>{
		try{
			fs.accessSync(process.cwd()+"/TweetDownloader.json");
			let file=fs.readFileSync(process.cwd()+"/TweetDownloader.json","utf-8");
			loaded=JSON.parse(file);
		}catch(e){
			throw e;
		}
	},
	getAll:()=>{
		if(!loaded)settings.load();
		return loaded;
	},
	get:name=>{
		if(!loaded)settings.load();
		let parseName=name.toLowerCase().split(".");
		let temp=loaded;
		for(let i=0;i<parseName.length;i++){
			if(temp.hasOwnProperty(parseName[i]))temp=temp[parseName[i]];
			else return null;
		}
		return temp;
	},
	save:(key,value)=>{
		if(!loaded)settings.load();
		let parseName=key.toLowerCase().split(".");
		let last=parseName.pop();
		let temp=loaded;
		for(let i=0;i<parseName.length;i++){
			if(!temp.hasOwnProperty(parseName[i]))temp[parseName[i]]={};
			temp=temp[parseName[i]];
		}
		temp[last]=value;
		try{
			fs.writeFileSync(process.cwd()+"/TweetDownloader.json",JSON.stringify(loaded));
		}catch(e){
			throw e;
		}
	}
};

module.exports=settings;
