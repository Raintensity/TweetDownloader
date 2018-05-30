var parse={
	turl:function(turl){
		if(!turl)throw new Error("Empty url.");
		let url=turl.split("?")[0];
		let slash=url.split("/");
		if(url.includes("https://twitter.com/")){
			if(slash[5])tid=slash[5];
			else throw new Error("Invalid url.");
		}
		else{
			let slash=url.split("/");
			tid=slash.pop();
			if(!tid)tid=slash.pop();
			if(!tid)throw new Error("Invalid url.");
		}
		return tid;
	},
	searchQuery:function(str){
		let result={};
		let queryList=str.split(" ");
		let queryAND=[];
		let queryFrom=null;
		for(let i=0;i<queryList.length;i++){
			if(!queryList[i])continue;
			if(queryList[i].includes(":")){
				let query=queryList[i].split(":");
				if(!query[1])continue;
				if(query[0]=="from")queryFrom={"user.screen_name":new RegExp(query[1],"i")};
			}else{
				let queryOR=[];
				queryOR.push({"text":new RegExp(queryList[i],"i")});
				queryOR.push({"full_text":new RegExp(queryList[i],"i")});
				queryAND.push({"$or":queryOR});
			}
		}
		
		if(queryAND.length>1||queryAND.length>0&&queryFrom){
			if(queryFrom)queryAND.push(queryFrom);
			result={"$and":queryAND};
		}else if(queryAND.length===1)result=queryAND[0];
		else if(queryFrom)result=queryFrom;
		return result;
	}
};

module.exports=parse;
