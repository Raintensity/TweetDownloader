(function(window){
	const $=eid=>document.getElementById(eid);
	const $t=tag=>document.getElementsByTagName(tag);
	const $q=q=>document.querySelectorAll(q);
	const $c=e=>document.createElement(e);

	const electron=require("electron");
	const {remote,clipboard}=electron;
	const {Menu,MenuItem}=remote;
	const fs=require("fs");
	const twitter=require("../modules/gettweet");
	const nedb=require("../modules/db");
	const search_parse=require("../modules/search-parse");
	const package=require("../package");

	const db=new nedb(process.cwd()+"/data/tweet.db");
	const remoteWindow=remote.getCurrentWindow();
	const remoteWeb=remote.getCurrentWebContents();

	const error_type={error:"エラー",message:"通知"};
	const zero=(x,n)=>(Array(n).join("0")+x).slice(-n);
	const date_format=dateObj=>dateObj.getFullYear()+"/"+zero(dateObj.getMonth()+1,2)+"/"+zero(dateObj.getDate(),2)+" "+zero(dateObj.getHours(),2)+":"+zero(dateObj.getMinutes(),2)+":"+zero(dateObj.getSeconds(),2);
	const inputText=["text","search","tel","url","email","password","number"];

	var somewhereClick={
		element:null,
		callback:null,
		handleEvent(ev){
			if(!this.element){
				document.removeEventListener(this);
				return;
			}
			var flag=0;
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

	var notify=(msg,type="message")=>{
		var notify_elem=$c("div");
		notify_elem.classList.add("type");
		var notify_title=$c("h4");
		notify_title.textContent=error_type[type];
		notify_elem.appendChild(notify_title);
		var notify_msg=$c("p");
		notify_msg.textContent=msg;
		notify_elem.appendChild(notify_msg);
		notify_elem.addEventListener("click",()=>$("notify").removeChild(notify_elem));
		window.setTimeout(()=>{
			try {
				$("notify").removeChild(notify_elem);
			}catch(e){}
		},5000);
		$("notify").insertBefore(notify_elem,$("notify").firstChild);
	};

	var detail=id=>{
		$("modal").classList.remove("hidden");
		$("loading").classList.remove("hidden");
		db.search({_id:id},(err,doc)=>{
			if(err||doc.length<1){
				$("loading").classList.add("hidden");
				$("modal").classList.add("hidden");
				notify((err)?err.message:"Can't find the tweet.","error");
				return;
			}
			doc=doc[0];
			$("loading").classList.add("hidden");
			$("detail").classList.remove("hidden");
			$("detail_name").textContent=doc.user.name;
			var d_id_link=$c("a");
			d_id_link.href="https://twitter.com/"+doc.user.screen_name;
			d_id_link.target="_blank";
			d_id_link.textContent="@"+doc.user.screen_name;
			$("detail_id").textContent="";
			$("detail_id").appendChild(d_id_link);
			$("detail_tweet").textContent=doc.full_text?doc.full_text:doc.text;
			if(doc.entities.media&&doc.entities.media.length>0)$("detail_tweet").textContent=$("detail_tweet").textContent.replace(" "+doc.entities.media[0].url,"");
			var d_url=$c("a");
			d_url.href="https://twitter.com/"+doc.user.screen_name+"/status/"+doc.id_str;
			d_url.target="_blank";
			d_url.textContent=d_url.href;
			$("detail_url").textContent="";
			$("detail_url").appendChild(d_url);
			$("detail_date").textContent=date_format(new Date(doc.created_at));
			$("detail_link").textContent="";
			if(doc.entities.urls.length>0){
				for(var i=0;i<doc.entities.urls.length;i++){
					var d_link=$c("a");
					d_link.href=doc.entities.urls[i].expanded_url;
					d_link.target="_blank";
					d_link.textContent=d_link.href;
					$("detail_link").appendChild(d_link);
					$("detail_link").appendChild($c("br"));
				}
			}
			$("detail_extra_link").textContent="";
			if(doc.in_reply_to_status_id_str){
				var d_e_link=$c("a");
				d_e_link.href="https://twitter.com/"+doc.in_reply_to_screen_name+"/status/"+doc.in_reply_to_status_id_str;
				d_e_link.target="_blank";
				d_e_link.textContent=d_e_link.href;
				$("detail_extra_link").appendChild(d_e_link);
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

			somewhereClick.set($("detail"),()=>{
				$("detail").classList.add("hidden");
				$("modal").classList.add("hidden");
			});

			$("detail").scrollTop=0;
		});
	};

	var view=docs=>{
		if(!docs)return;
		$("list").textContent="";
		for(var i=0;i<docs.length;i++){
			var tr=$c("tr");
			tr.setAttribute("data-db",docs[i]._id);

			var td1=$c("td");
			td1.textContent=docs[i].user.name;
			tr.appendChild(td1);

			var td2=$c("td");
			td2.textContent="@"+docs[i].user.screen_name;
			tr.appendChild(td2);

			var td3=$c("td");
			td3.textContent=docs[i].full_text?docs[i].full_text:docs[i].text;
			if(docs[i].entities.media&&docs[i].entities.media.length>0)td3.textContent=td3.textContent.replace(" "+docs[i].entities.media[0].url,"");
			tr.appendChild(td3);

			var td4=$c("td");
			var dateObj=new Date(docs[i].created_at);
			td4.textContent=date_format(dateObj);
			tr.appendChild(td4);

			tr.addEventListener("dblclick",function(e){
				e.preventDefault();
				detail(this.dataset.db);
			});
			$("list").appendChild(tr);
		}
	};

	var load=()=>{
		$("modal").classList.remove("hidden");
		$("loading").classList.remove("hidden");
		db.load((err,docs)=>{
			$("modal").classList.add("hidden");
			$("loading").classList.add("hidden");
			if(err)return notify("Failed read the database.","error");
			view(docs);
		});
	};

	var search=()=>{
		var query=search_parse($("q").value);
		$("modal").classList.remove("hidden");
		$("loading").classList.remove("hidden");
		db.search(query,(err,docs)=>{
			$("modal").classList.add("hidden");
			$("loading").classList.add("hidden");
			if(err)return notify("Failed read the database.","error");
			view(docs);
		});
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
		$("add_form").addEventListener("submit",e=>{
			e.preventDefault();
			if(!$("t").value)return;
			$("modal").click();
			$("modal").classList.remove("hidden");
			$("loading").classList.remove("hidden");
			twitter.getTweet(process.cwd()+"/data/media/",$("t").value,(err,data)=>{
				if(err){
					$("loading").classList.add("hidden");
					notify(err.message,"error");
					$("menu_add").click();
				}else{
					db.insert(data,err=>{
						if(err){
							$("loading").classList.add("hidden");
							notify(err.message,"error");
							$("menu_add").click();
						}else{
							$("t").value="";
							$("loading").classList.add("hidden");
							$("modal").classList.add("hidden");
							load();
						}
					});
				}
			});
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
			var eFlag=[],uri,dataID;
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
			var selection=window.getSelection().toString().replace(/^\s+|\s+$/g,"").replace(/ +/g," ");
			if(selection)eFlag.push("selected");
			if(eFlag.length===0)return;
			var menu=new Menu();
			if(eFlag.includes("link")){
				menu.append(new MenuItem({label:"ブラウザで開く (&B)",click:()=>shell.openExternal(uri)}));
				menu.append(new MenuItem({label:"リンクアドレスをコピー (&E)",click:()=>clipboard.writeText(uri)}));
			}
			if(eFlag.includes("data"))menu.append(new MenuItem({label:"削除 (&R)",click:()=>db.remove(dataID,err=>{
				if(err)notify(err.message,"error");
				else load();
			})}));
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
