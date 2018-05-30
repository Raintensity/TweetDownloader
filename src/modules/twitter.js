const https=require("https");

var twitter={
	_token:null,
	$get:function(options,type="json"){
		return new Promise((resolve,reject)=>{
			https.get(options,res=>{
				if(type=="json"){
					var buffer="";
					res.setEncoding("utf-8");
					res.on("data",chunk=>buffer+=chunk);
					res.on("end",()=>resolve(JSON.parse(buffer)));
				}else if(type=="binary"){
					var buffer=[];
					res.on("data",chunk=>buffer.push(chunk));
					res.on("end",()=>resolve(Buffer.concat(buffer)));
				}
			}).on("error",err=>reject(err));
		});
	},
	tweet:async function(tid){
		try{
			if(!this._token)this._token=await require("./gettoken")();
		}catch(e){
			throw e;
		}
		var options={
			hostname:"api.twitter.com",
			path:"/1.1/statuses/show.json?id="+tid,
			headers:{
				Authorization: "Bearer "+this._token
			}
		};
		return this.$get(options).then(data=>{
			if(data.truncated){
				options.path+="&tweet_mode=extended";
				return this.$get(options);
			}else return Promise.resolve(data);
		});
	},
	pic:function(mediaObj){
		var medias=[];
		for(var i=0;i<mediaObj.length;i++){
			var url=null;
			if(mediaObj[i].type==="photo")url=mediaObj[i].media_url_https+":orig";
			else if(mediaObj[i].type==="video"||mediaObj[i].type==="animated_gif"){
				var bitrate=-1;
				for(var j=0;j<mediaObj[i].video_info.variants.length;j++){
					if(!mediaObj[i].video_info.variants[j].bitrate)continue;
					if(mediaObj[i].video_info.variants[j].bitrate>bitrate)url=mediaObj[i].video_info.variants[j].url.split("?")[0];
				}
			}
			if(url)medias.push(this.$get(url,"binary").then(data=>Promise.resolve({name:url.split("/").pop().split(":")[0],data:data})));
		}
		return Promise.all(medias);
	}
};

module.exports=twitter;