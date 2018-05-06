var parse=function(str){
	var result={};
	
	var queryList=str.split(" ");
	var queryAND=[];
	var queryFrom=null;
	for(var i=0;i<queryList.length;i++){
		if(!queryList[i])continue;
		if(queryList[i].includes(":")){
			var query=queryList[i].split(":");
			if(!query[1])continue;
			if(query[0]=="from")queryFrom={"user.screen_name":new RegExp(query[1],"i")};
		}else{
			var queryOR=[];
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
};

module.exports=parse;