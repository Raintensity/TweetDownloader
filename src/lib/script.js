(function(window){
	const $=eid=>document.getElementById(eid);
	const $t=tag=>document.getElementsByTagName(tag);
	const $q=q=>document.querySelectorAll(q);
	const $c=e=>document.createElement(e);

	const electron=require("electron");
	const {remote,clipboard}=electron;
	const {Menu,MenuItem}=remote;

	const fs=require("fs");
	const core=require("../modules/core");
	const template=require("./template");
	const package=require("../package");

	const remoteWindow=remote.getCurrentWindow();
	const remoteWeb=remote.getCurrentWebContents();

	const error_type={error:"エラー",message:"通知"};
	const zero=(x,n)=>(Array(n).join("0")+x).slice(-n);
	const date_format=dateObj=>dateObj.getFullYear()+"/"+zero(dateObj.getMonth()+1,2)+"/"+zero(dateObj.getDate(),2)+" "+zero(dateObj.getHours(),2)+":"+zero(dateObj.getMinutes(),2)+":"+zero(dateObj.getSeconds(),2);
	const inputText=["text","search","tel","url","email","password","number"];

	const somewhereClick={
		element:null,
		callback:null,
		handleEvent(ev){
			if(!this.element){
				document.removeEventListener(this);
				return;
			}
			let flag=0;
			ev.path.forEach(c=>flag=(c==this.element)?1:flag);
			if(flag)return;
			document.removeEventListener("click",this,true);
			this.callback();
			this.element=this.callback=null;
		},
		set(_element,_callback=()=>{}){
			if(!_element||!_element instanceof Node)throw new Error("Invalid Node.");
			this.element=_element;
			this.callback=_callback;
			document.addEventListener("click",this,true);
		}
	};

	let notify=(msg,type="message")=>{
		let notify_elem=$c("div");
		notify_elem.classList.add(type);
		notify_elem.insertAdjacentHTML("beforeend",template.notify({title:error_type[type],msg:msg}));
		notify_elem.addEventListener("click",()=>$("notify").removeChild(notify_elem));
		window.setTimeout(()=>{
			try {
				$("notify").removeChild(notify_elem);
			}catch(e){}
		},5000);
		$("notify").insertBefore(notify_elem,$("notify").firstChild);
	};

	let viewDetail=doc=>{
		$("detail_name").textContent=doc.user.name;
		let d_id_link=template.link({href:"https://twitter.com/"+doc.user.screen_name,text:"@"+doc.user.screen_name});
		$("detail_id").innerHTML=d_id_link;
		let d_text=doc.full_text?doc.full_text:doc.text;
		if(doc.entities.media&&doc.entities.media.length>0)d_text=d_text.replace(" "+doc.entities.media[0].url,"");
		$("detail_tweet").textContent=d_text;
		let d_url=template.link({href:"https://twitter.com/"+doc.user.screen_name+"/status/"+doc.id_str});
		$("detail_url").innerHTML=d_url;
		$("detail_date").textContent=date_format(new Date(doc.created_at));
		$("detail_link").textContent="";
		if(doc.entities.urls.length>0){
			for(let i=0;i<doc.entities.urls.length;i++){
				let d_link=template.link({href:doc.entities.urls[i].expanded_url});
				$("detail_link").insertAdjacentHTML("beforeend",d_link);
				$("detail_link").appendChild($c("br"));
			}
		}
		$("detail_extra_link").textContent="";
		if(doc.in_reply_to_status_id_str){
			let d_e_link=template.link({href:"https://twitter.com/"+doc.in_reply_to_screen_name+"/status/"+doc.in_reply_to_status_id_str});
			$("detail_extra_link").insertAdjacentHTML("beforeend",d_e_link);
		}
		$("detail_media").textContent="";
		if(doc.__media)for(var i=0;i<doc.__media.length;i++){
			var elem=$c("p");
			var ext=doc.__media[i].split(".").pop();
			var media=ext==="mp4"?$c("video"):$c("img");
			if(ext==="mp4")media.controls=true;
			media.src=process.cwd()+"/data/media/"+doc.__media[i];
			elem.appendChild(media);
			$("detail_media").appendChild(elem);
		}
	}

	let detail=async id=>{
		$("modal").classList.remove("hidden");
		$("loading").classList.remove("hidden");
		try{
			let doc=await core.getDetail(id);
			if(doc.length<1)throw new Error("Can't find the tweet.");
			$("detail").classList.remove("hidden");
			doc=doc[0];
			viewDetail(doc);

			somewhereClick.set($("detail"),()=>{
				$("detail").classList.add("hidden");
				$("modal").classList.add("hidden");
			});

			$("detail").scrollTop=0;
		}catch(e){
			notify(e.message,"error");
			$("modal").classList.add("hidden");
		}
		$("loading").classList.add("hidden");
	};

	let viewList=docs=>{
		if(!docs)return;
		$("list").textContent="";
		for(let i=0;i<docs.length;i++){
			let tr=$c("tr");
			tr.setAttribute("data-db",docs[i]._id);
			tr.insertAdjacentHTML("beforeend",template.list(docs[i]));
			tr.addEventListener("dblclick",function(e){
				e.preventDefault();
				detail(this.dataset.db);
			});
			$("list").appendChild(tr);
		}
	};

	let load=async()=>{
		$("modal").classList.remove("hidden");
		$("loading").classList.remove("hidden");
		try{
			let docs=await core.getList();
			viewList(docs);
		}catch(e){
			notify(e.message,"error");
		}
		$("modal").classList.add("hidden");
		$("loading").classList.add("hidden");
	};

	let search=async()=>{
		$("modal").classList.remove("hidden");
		$("loading").classList.remove("hidden");
		try{
			let docs=await core.getList($("q").value);
			viewList(docs);
		}catch(e){
			notify(e.message,"error");
		}
		$("modal").classList.add("hidden");
		$("loading").classList.add("hidden");
	};

	let remove=async dataID=>{
		$("loading").classList.remove("hidden");
		$("modal").classList.remove("hidden");
		try{
			await core.removeTweet(dataID);
			load();
		}catch(e){
			notify(e.message,"error");
		}
		$("loading").classList.add("hidden");
		$("modal").classList.add("hidden");
	};

	document.addEventListener("DOMContentLoaded",function(){
		$("version").textContent=package.custom.title+" "+package.version;
		Array.prototype.forEach.call($("menu").children,item=>{
			if(item.dataset.menu)item.addEventListener("click",e=>{
				$t("main")[0].scrollTop=0;
				Array.prototype.forEach.call($q("[data-menu]"),menu=>{
					if(menu.dataset.menu===item.dataset.menu)menu.classList.add("active");
					else menu.classList.remove("active");
				});
				Array.prototype.forEach.call($q("[data-area]"),areaes=>{
					if(areaes.dataset.area.includes(item.dataset.menu))areaes.classList.remove("hidden");
					else areaes.classList.add("hidden");
				});
			});
		});
		Array.prototype.forEach.call($q("[data-menu='list']"),e=>e.addEventListener("click",()=>load()))
		$("menu_add").addEventListener("click",e=>{
			$("t").value="";
			$("add_window").classList.remove("hidden");
			$("modal").classList.remove("hidden");
			somewhereClick.set($("add_window"),()=>{
				$("add_window").classList.add("hidden");
				$("modal").classList.add("hidden");
			});
		});
		$("search_form").addEventListener("submit",e=>{
			e.preventDefault();
			search();
		});
		$("add_form").addEventListener("submit",async e=>{
			e.preventDefault();
			if(!$("t").value)return;
			$("modal").click();
			$("modal").classList.remove("hidden");
			$("loading").classList.remove("hidden");
			try{
				await core.getTweet($("t").value);
				$("t").value="";
				$("loading").classList.add("hidden");
				$("modal").classList.add("hidden");
				load();
			}catch(e){
				$("loading").classList.add("hidden");
				notify(e.message,"error");
				$("menu_add").click();
			}
		});
		$("add_paste").addEventListener("click",()=>{
			$("t").value=clipboard.readText();
		});
		$("tool_reloadDB").addEventListener("click",()=>load());
		$("tool_reload").addEventListener("click",()=>remoteWeb.reloadIgnoringCache());
		$("tool_devtools").addEventListener("click",()=>remoteWeb.toggleDevTools());
		$("form_dummy").addEventListener("submit",e=>e.preventDefault());
		window.addEventListener("contextmenu",e=>{
			e.preventDefault();
			let eFlag=[],uri,dataID;
			e.path.forEach(elem=>{
				if(!elem.tagName)return;
				if(elem.tagName==="A"){
					eFlag.push("link");
					uri=elem.href;
				};
				if(elem.tagName==="INPUT"){
					if(elem.type.toUpperCase()==="PASSWORD"&&!elem.disabled)eFlag.push("input_pass");
					else if(inputText.indexOf(elem.type.toLowerCase())>=0&&!elem.disabled)eFlag.push("input_text");
				}else if(elem.tagName==="TEXTAREA"&&!elem.disabled)eFlag.push("input_text");
				if(elem.dataset.db){
					eFlag.push("data");
					dataID=elem.dataset.db;
				}
			});
			let selection=window.getSelection().toString().replace(/^\s+|\s+$/g,"").replace(/ +/g," ");
			if(selection)eFlag.push("selected");
			if(eFlag.length===0)return;
			let menu=new Menu();
			if(eFlag.includes("link")){
				menu.append(new MenuItem({label:"ブラウザで開く (&B)",click:()=>shell.openExternal(uri)}));
				menu.append(new MenuItem({label:"リンクアドレスをコピー (&E)",click:()=>clipboard.writeText(uri)}));
			}
			if(eFlag.includes("data"))menu.append(new MenuItem({label:"削除 (&R)",click:()=>remove(dataID)}));
			if(menu.items.length!==0&&(eFlag.includes("input_text")||eFlag.includes("selected")))menu.append(new MenuItem({type:"separator"}));
			if(eFlag.includes("input_text")&&!eFlag.includes("input_pass"))menu.append(new MenuItem({label:"切り取り (&T)",role:"cut",accelerator:"CommandOrControl+X"}));
			if((eFlag.includes("input_text")||eFlag.includes("selected"))&&!eFlag.includes("input_pass"))menu.append(new MenuItem({label:"コピー (&C)",role:"copy",accelerator:"CommandOrControl+C"}));
			if(eFlag.includes("input_text")||eFlag.includes("input_pass"))menu.append(new MenuItem({label:"貼り付け (&P)",role:"paste",accelerator:"CommandOrControl+V"}));
			if(eFlag.includes("selected")&&!eFlag.includes("input_pass"))menu.append(new MenuItem({label:"\""+selection+"\" をGoogle検索 (&S)",click:()=>shell.openExternal("https://www.google.co.jp/search?q="+encodeURIComponent(selection))}));
			menu.popup(remoteWindow);
		});
		load();
		fs.readFile(__dirname+"/license.html",{encoding:"utf-8"},(err,data)=>{
			if(err)return notify("Can't read the license file.","error");
			$("license").innerHTML=data;
		});
	});
})(window);
