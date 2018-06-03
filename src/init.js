const fs=require("fs");
const settings=require("./modules/settings");

const init=()=>{
	try{
		fs.accessSync(process.cwd()+"/TweetDownloader.json");
	}catch(e){
		fs.writeFileSync(process.cwd()+"/TweetDownloader.json","{}");
	}
	let path=settings.get("general.path")||process.cwd()+"/data";

	try{
		fs.accessSync(path);
	}catch(e){
		fs.mkdirSync(path);
	}
	try{
		fs.accessSync(path+"/app");
	}catch(e){
		fs.mkdirSync(path+"/app");
	}
	try{
		fs.accessSync(path+"/media");
	}catch(e){
		fs.mkdirSync(path+"/media");
	}
};

module.exports=init;
