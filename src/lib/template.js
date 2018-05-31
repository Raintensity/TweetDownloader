const util=require("../modules/util");

const template={
	list:doc=>{
		let tweet=doc.full_text?doc.full_text:doc.text;
		if(doc.entities.media&&doc.entities.media.length>0)tweet=tweet.replace(" "+doc.entities.media[0].url,"");
		let date=util.dateFormat(new Date(doc.created_at));
		return `<td>${doc.user.name}</td><td>${doc.user.screen_name}</td><td>${tweet}</td><td>${date}</td>`
	},
	detail:function(doc,path){
		return {
			detail_name:doc.user.name,
			detail_id:this.link({href:"https://twitter.com/"+doc.user.screen_name,text:"@"+doc.user.screen_name}),
			detail_tweet:()=>{
				let d_text=doc.full_text?doc.full_text:doc.text;
				if(doc.entities.media&&doc.entities.media.length>0)d_text=d_text.replace(" "+doc.entities.media[0].url,"");
				return d_text;
			},
			detail_url:this.link({href:"https://twitter.com/"+doc.user.screen_name+"/status/"+doc.id_str}),
			detail_date:util.dateFormat(new Date(doc.created_at)),
			detail_link:()=>{
				let d_link="";
				if(doc.entities.urls.length>0)for(let i=0;i<doc.entities.urls.length;i++)d_link+=template.link({href:doc.entities.urls[i].expanded_url})+"<br>";
				return d_link;
			},
			detail_extra_link:doc.in_reply_to_status_id_str?template.link({href:"https://twitter.com/"+doc.in_reply_to_screen_name+"/status/"+doc.in_reply_to_status_id_str}):"",
			detail_media:()=>{
				if(!doc.__media)return "";
				let arr=[];
				for(let i=0;i<doc.__media.length;i++){
					let elem=document.createElement("p");
					let ext=doc.__media[i].split(".").pop();
					let media=document.createElement(ext==="mp4"?"video":"img");
					if(ext==="mp4")media.controls=true;
					media.src=path+doc.__media[i];
					elem.appendChild(media);
					arr.push(elem);
				}
				return arr;
			}
		}
	},
	notify:doc=>`<h4>${doc.title}</h4><p>${doc.msg}</p>`,
	link:doc=>`<a href="${doc.href}" target="_blank">${doc.text?doc.text:doc.href}</a>`
};

module.exports=template;
