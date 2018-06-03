const electron=require("electron");
const {app,dialog,shell,ipcMain}=electron;
const fs=require("fs");
require("./init")();

const settings=require("./modules/settings");
const package=require("./package");

const path=settings.get("general.path")||process.cwd()+"/data";
let scSettings=[];

app.setPath("appData",path+"/app");
app.setPath("userData",path+"/app");

let win=null;
let mediaWin=null;

let createMediaWin=path=>{
	if(mediaWin)return mediaWin.loadURL(path);
	mediaWin=new electron.BrowserWindow({
		width:0,
		height:0,
		title:"Media Viewer",
		frame:false,
		resizable:false,
		minimizable:false,
		show:false,
		parent:win,
		webPreferences:{
			preload:__dirname+"/lib/media.js"
		}
	});
	mediaWin.setMenu(null);
	mediaWin.on("closed",()=>mediaWin=null);
	mediaWin.loadURL(path);
};

app.on("ready",()=>{
	win=new electron.BrowserWindow({
		width:1024,
		height:768,
		title:package.custom.title
	});
	win.setMenu(null);
	win.on("closed",()=>{
		win=null;
		if(scSettings.length>0){
			for(let i=0;i<scSettings.length;i++){
				settings.save(scSettings[i].key,scSettings[i].value);
			}
		}
	});
	win.webContents.on("new-window",(e,url)=>{
		e.preventDefault();
		shell.openExternal(url);
	});
	ipcMain.on("main:sc-settings",(evt,arg)=>scSettings.push(arg));
	ipcMain.on("main:media",(evt,arg)=>createMediaWin(arg));
	ipcMain.on("media:ready",(evt,arg)=>{
		if(!mediaWin)return;
		mediaWin.setSize(arg.size.width|0,arg.size.height|0);
		mediaWin.setPosition(arg.pos.x|0,arg.pos.y|0);
		mediaWin.show();
	});
	ipcMain.on("media:error",(evt,arg)=>{
		if(!mediaWin)return;
		mediaWin.close();
	});
	win.loadURL(__dirname+"/lib/main.html");
	//win.webContents.openDevTools();
});

app.on("window-all-closed",()=>app.quit());
