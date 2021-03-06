(function(window){
	const $=eid=>document.getElementById(eid);
	const $q=q=>document.querySelectorAll(q);

	const electron=require("electron");
	const {remote,clipboard,ipcRenderer}=electron;
	const {Menu,MenuItem}=remote;

	const fs=require("fs");
	const core=require("../modules/core");
	const settings=require("../modules/settings");
	const template=require("./template");
	const package=require("../package");

	const path=settings.get("general.path")||process.cwd()+"/data";
	const remoteWindow=remote.getCurrentWindow();
	const remoteWeb=remote.getCurrentWebContents();

	const error_type={error:"エラー",message:"通知"};
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
		let notify_elem=document.createElement("div");
		notify_elem.classList.add(type);
		notify_elem.insertAdjacentHTML("beforeend",template.notify({title:error_type[type],msg:msg}));
		notify_elem.addEventListener("click",()=>$("notify").removeChild(notify_elem));
		window.setTimeout(()=>{
			try{
				$("notify").removeChild(notify_elem);
			}catch(e){}
		},5000);
		$("notify").insertBefore(notify_elem,$("notify").firstChild);
	};

	let viewDetail=doc=>{
		let tplObj=template.detail(doc,path+"/media/");
		Object.keys(tplObj).forEach(eid=>{
			if(typeof tplObj[eid]==="function")tplObj[eid]=tplObj[eid]();
			if(Array.isArray(tplObj[eid])){
				$(eid).textContent="";
				for(let i=0;i<tplObj[eid].length;i++)$(eid).appendChild(tplObj[eid][i]);
			}else{
				$(eid).innerHTML=tplObj[eid];
			}
		});
		Array.prototype.forEach.call($("detail_media").getElementsByTagName("img"),elem=>{
			elem.addEventListener("click",e=>ipcRenderer.send("main:media",elem.src));
		});
		Array.prototype.forEach.call($("detail_media").getElementsByTagName("video"),elem=>{
			elem.addEventListener("click",e=>ipcRenderer.send("main:media",elem.src));
		});
	}

	let detail=async id=>{
		$("modal").classList.remove("hidden");
		$("loading").classList.remove("hidden");
		try{
			let doc=await core.getDetail(id);
			if(doc.length<1)throw new Error("Can't find the tweet.");
			doc=doc[0];
			viewDetail(doc);

			somewhereClick.set($("detail"),()=>{
				$("detail").classList.add("hidden");
				$("modal").classList.add("hidden");
			});

			$("detail").classList.remove("hidden");
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
			let tr=document.createElement("tr");
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
		$("list").dataset.filter="";
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
		if(!$("q").value||$("q").value==="")$("list").dataset.filter="";
		$("modal").classList.remove("hidden");
		$("loading").classList.remove("hidden");
		try{
			let docs=await core.getList($("q").value);
			$("list").dataset.filter="true";
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

	let updateSettings=e=>{
		let key=e.target.id.split("-")[1],value=(e.target.value==="")?null:e.target.value;
		if(e.target.dataset.reboot)ipcRenderer.send("main:sc-settings",{key:key,value:value});
		else settings.save(key,value);
	};

	document.addEventListener("DOMContentLoaded",function(){
		$("version").textContent=package.custom.title+" "+package.version;
		Array.prototype.forEach.call($("menu").children,item=>{
			if(item.dataset.menu)item.addEventListener("click",e=>{
				document.getElementsByTagName("main")[0].scrollTop=0;
				Array.prototype.forEach.call($q("[data-menu]"),menu=>{
					if(menu.dataset.menu===item.dataset.menu)menu.classList.add("active");
					else menu.classList.remove("active");
				});
				Array.prototype.forEach.call($q("[data-area]"),areaes=>{
					if(areaes.dataset.area.includes(item.dataset.menu))areaes.classList.remove("hidden");
					else areaes.classList.add("hidden");
				});
			});
			if(item.dataset.menu&&item.dataset.menu==="list")item.addEventListener("click",e=>{
				if($("list").dataset.filter)load();
			});
			else if(item.dataset.menu&&item.dataset.menu==="search")item.addEventListener("click",e=>{
				if($("q").value&&$("q").value!=="")search();
			});
		});
		Array.prototype.forEach.call($q("[data-menu='list']"),e=>e.addEventListener("dblclick",()=>load()))
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
		$("set-general.path-null").addEventListener("change",e=>{
			$("set-general.path").disabled=e.target.checked;
			if(e.target.checked)$("set-general.path").value="";
		});
		Array.prototype.forEach.call($q("[data-form='settings']"),elem=>{
			Array.prototype.forEach.call(elem.querySelectorAll("[id^='set-']"),item=>{
				let name=item.id.split("-")[1],name_chk=item.id.split("-")[2]||null;
				let value=settings.get(name);
				if(name_chk!==null&&value===null)item.checked=true;
				else if(name_chk!==null&&value!==null)item.checked=false;
				else item.value=value;
				let evt=document.createEvent("HTMLEvents");
				evt.initEvent("change",false,true);
				item.dispatchEvent(evt);
			});
			elem.addEventListener("change",updateSettings);
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
				$("modal").classList.add("hidden");
				load();
			}catch(e){
				notify(e.message,"error");
				$("menu_add").click();
			}
			$("loading").classList.add("hidden");
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
			if(eFlag.includes("input_text")&&eFlag.includes("selected")&&!eFlag.includes("input_pass"))menu.append(new MenuItem({label:"切り取り (&T)",role:"cut",accelerator:"CommandOrControl+X"}));
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
