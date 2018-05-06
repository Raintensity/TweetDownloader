const https=require("https");
const fs=require("fs");
const sha256=require("js-sha256").sha256;
var twitter={};

twitter.token=null;
twitter.getTweet=function(mediaDir,turl,callback){
	var tid=turl.split("?")[0];
	if(tid.includes("https://twitter.com/"))tid=tid.split("/")[5];
	new Promise((resolve,reject)=>{
		if(this.token)return resolve();
		require("../modules/gettoken")((err,data)=>{
			if(err)reject(new Error("Can't get the token."));
			this.token=data;
			resolve();
		});
	}).then(()=>{
		return new Promise((resolve,reject)=>{
			var options={
				hostname:"api.twitter.com",
				path:"/1.1/statuses/show.json?id="+tid,
				headers:{
					Authorization: "Bearer "+this.token
				}
			};
			https.get(options,res=>{
				var buffer="";
				res.setEncoding("utf-8");
				res.on("data",chunk=>buffer+=chunk);
				res.on("end",()=>{
					var data=JSON.parse(buffer);
					if(data.errors)reject(new Error(data.errors[0].message));
					else resolve(data);
				});
			}).on("error",e=>reject(e));
		});
	}).then(_data=>{
		return new Promise((resolve,reject)=>{
			if(!_data.truncated)return resolve(_data);
			var options={
				hostname:"api.twitter.com",
				path:"/1.1/statuses/show.json?id="+tid+"&tweet_mode=extended",
				headers:{
					Authorization: "Bearer "+this.token
				}
			};
			https.get(options,res=>{
				var buffer="";
				res.setEncoding("utf-8");
				res.on("data",chunk=>buffer+=chunk);
				res.on("end",()=>{
					var data=JSON.parse(buffer);
					if(data.errors)reject(new Error(data.errors[0].message));
					else resolve(data);
				});
			}).on("error",e=>reject(e));
		});
	}).then(data=>{
		return new Promise((resolve,reject)=>{
			if(!data.extended_entities||!data.extended_entities.media||data.extended_entities.media.length<1)resolve(data);
			var promise_array=[];
			var media=data.extended_entities.media;
			for(var i=0;i<media.length;i++){
				promise_array.push(new Promise((i_resolve,i_reject)=>{
					var url=null;
					if(media[i].type==="photo")url=media[i].media_url_https+":orig";
					else if(media[i].type==="video"||media[i].type==="animated_gif"){
						var bitrate=-1;
						for(var j=0;j<media[i].video_info.variants.length;j++){
							if(!media[i].video_info.variants[j].bitrate)continue;
							if(media[i].video_info.variants[j].bitrate>bitrate)url=media[i].video_info.variants[j].url.split("?")[0];
						}
						if(!url)resolve(null);
					}else resolve(null);
					var ext=url.split(".").pop().split(":")[0];
					var name=url.split("/").pop().split(".")[0];
					var bname=sha256(name)+"."+ext;
					https.get(url,res=>{
						var buffer=[];
						res.on("data",chunk=>buffer.push(chunk));
						res.on("end",()=>{
							var data=Buffer.concat(buffer);
							fs.writeFile(mediaDir+bname,data,err=>{
								if(err)i_reject(err);
								else i_resolve(bname);
							});
						});
					}).on("error",e=>i_reject(e));
				}));
			}
			Promise.all(promise_array).then(values=>{
				values=values.filter(val=>val);
				data.__media=values;
				resolve(data);
			}).catch(e=>reject(e));
		});
	}).then(data=>{
		callback(null,data);
	}).catch(e=>{
		callback(e);
	});
};

module.exports=twitter;
