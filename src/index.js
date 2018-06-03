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
	ipcMain.on("main:sc-settings",(evt,arg)=>{
		console.log(arg);
		scSettings.push(arg);
	});
	win.loadURL(__dirname+"/lib/main.html");
	//win.webContents.openDevTools();
});

app.on("window-all-closed",()=>app.quit());
