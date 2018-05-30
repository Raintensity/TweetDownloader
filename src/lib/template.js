const util=require("../modules/util");

const template={
	list:doc=>{
		let tweet=doc.full_text?doc.full_text:doc.text;
		if(doc.entities.media&&doc.entities.media.length>0)tweet=tweet.replace(" "+doc.entities.media[0].url,"");
		let date=util.dateFormat(new Date(doc.created_at));
		return `<td>${doc.user.name}</td><td>${doc.user.screen_name}</td><td>${tweet}</td><td>${date}</td>`
	},
	notify:doc=>`<h3>${doc.title}</h3><p>${doc.msg}</p>`,
	link:doc=>`<a href="${doc.href}" target="_blank">${doc.text?doc.text:doc.href}</a>`
};

module.exports=template;
