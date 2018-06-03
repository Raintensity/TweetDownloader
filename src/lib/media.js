const electron=require("electron");
const {ipcRenderer}=electron;

const error=err=>ipcRenderer.send("media:error",err);

window.addEventListener("load",()=>{
	let img=document.getElementsByTagName("video")[0]||document.getElementsByTagName("img")[0];
	if(!img)return error(new Error("Can't open the file."));
	let iSize=img.tagName==="VIDEO"?{width:img.videoWidth,height:img.videoHeight}:{width:img.naturalWidth,height:img.naturalHeight};
	let sSize=electron.screen.getPrimaryDisplay().workAreaSize;
	let sPos=electron.screen.getPrimaryDisplay().workArea;
	let rSize={},rPos={};

	if(sSize.width>=iSize.width&&sSize.height>=iSize.height)rSize=iSize;
	else{
		let wr=sSize.width/iSize.width,hr=sSize.height/iSize.height;
		if(wr>hr)rSize={width:iSize.width*hr,height:iSize.height*hr};
		else rSize={width:iSize.width*wr,height:iSize.height*wr}
	}
	rPos={x:sSize.width/2-rSize.width/2+sPos.x,y:sSize.height/2-rSize.height/2+sPos.y};
	img.width=rSize.width;
	img.height=rSize.height;
	ipcRenderer.send("media:ready",{size:rSize,pos:rPos});

	document.body.setAttribute("style","margin:0;padding:0;font-size:0;user-select:none;overflow:hidden;background-color:#000;");
	let dragArea=document.createElement("div");
	dragArea.setAttribute("style","position:fixed;width:calc(100% - 10px);height:calc(100% - 10px"+(img.tagName==="VIDEO"?" - 32px":"")+");-webkit-app-region:drag;top:5px;left:5px;z-index:100;");
	document.body.appendChild(dragArea);
});
