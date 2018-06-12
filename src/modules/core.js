const fs=require("fs");
const sha256=require("js-sha256");

const nedb=require("./db");
const parse=require("./parse");
const settings=require("./settings");
const twitter=require("./twitter");

const path=settings.get("general.path")||process.cwd()+"/data";
const db=new nedb(path+"/tweet.db");

const core={
	getTweet:async function(turl){
		let tid=parse.turl(turl);
		let tweet=await twitter.tweet(tid);
		if(tweet.errors)throw new Error(tweet.errors[0].message);
		if(tweet.extended_entities&&tweet.extended_entities.media&&tweet.extended_entities.media.length>0){
			let medias=await twitter.pic(tweet.extended_entities.media);
			tweet.__media=[];
			for(let i=0;i<medias.length;i++){
				let [name,ext]=medias[i].name.split(".");
				name=sha256(name);
				fs.writeFileSync(path+"/media/"+name+"."+ext,medias[i].data);
				tweet.__media.push(name+"."+ext);
			}
		}
		let find=await db.search({id_str:tweet.id_str});
		if(find&&find.length>0)throw new Error("This tweet has already saved.");
		await db.insert(tweet);
		return true;
	},
	removeTweet:async function(dataID){
		let tweet=await db.search({_id:dataID});
		if(tweet.length===0)throw new Error("Can't find the tweet on database.");
		tweet=tweet[0];
		if(tweet.__media)for(let i=0;i<tweet.__media.length;i++){
			fs.unlinkSync(path+"/media/"+tweet.__media[i]);
		}
		await db.remove(dataID);
		return true;
	},
	getList:async function(str){
		let query=str?parse.searchQuery(str):null;
		return query?await db.search(query):await db.load();
	},
	getDetail:async function(id){
		return await db.search({_id:id});
	}
};

module.exports=core;
