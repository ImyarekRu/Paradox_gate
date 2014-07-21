var path = require("path"),
	fs = require('fs'),
	th = require("telehash"),
	marked = require('marked')
	sanitizer = require('sanitizer'),
	http = require('http');
	
marked.setOptions({
  //renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: true,
  //pedantic: true,
  sanitize: true,
  smartLists: true
  //smartypants: false
});
var header=fs.readFileSync("./header.html", {'encoding':'utf8'});
var footer=fs.readFileSync("./footer.html", {'encoding':'utf8'});

function defined(obj){
	return (typeof(obj)!='undefined');
};
global.th_renderer = new marked.Renderer();
th_renderer.link = function (href, title, text) {
	if(text=="dl"){
		return " <a href='https://github.com/ImyarekRu/Paradox' style='display:inline-block;margin-top:4px;' target='_blank' onclick='alert(\"Скачивание файлов доступно только пользователям Paradox. По этой ссылке Вы можете получить свой экземпляр.\");' title='Скачивание файлов доступно только пользователям Paradox.'> файл </a>";
	}
	else
	{
		return ' <a href="' + href + '" title="'+title+'" target="_blank">'+text+'</a> ';
	};
};
function th_SanitizePosts(post){
	var tmpstr="";
	var posts=[JSON.parse(post)];
	//console.log("before sanitizing",posts[0]);
	for(var i in posts){
		posts[i].hashname="qweqweqwe";
		tmpstr=sanitizer.sanitize(posts[i].txt);
		posts[i].src=sanitizer.escape(tmpstr.replace(/\n/g,"\\n"));
		posts[i].txt=marked(tmpstr,{renderer:th_renderer}).replace(/[\n\r]/g,"<br>").replace(/id\=\".*?\"/g,"");
		if(defined(posts[i].cmnts)){
			for(var j in posts[i].cmnts){
				tmpstr=sanitizer.sanitize(posts[i].cmnts[j].txt);
				posts[i].cmnts[j].src=sanitizer.escape(tmpstr.replace(/\n/g,"\\n"));
				posts[i].cmnts[j].txt=marked(tmpstr,{renderer:th_renderer}).replace(/[\n\r]/g,"<br>").replace(/id\=\".*?\"/g,"");
			}
		}
	};
	//console.log("after sanitizing",posts[0].cmnts);
	return posts;
};

function RenderOut(buf,resstream)
{
	try{
		buf=th_SanitizePosts(buf);
		//console.log(buf[0].txt);
		var tts=new Date(parseInt(buf[0].lts));
		var html=header+"<b>"+buf[0].nick+"</b> в p2p соцсети <b>Paradox</b> "+tts.toLocaleString()+"<hr></div>	";
		html+='<div style="margin:0 20px;">'+buf[0].txt
		html+='<div style="display: inline-block;float: right;">';
		html+='<label>'+buf[0].cmnts.length+' комментариев</label>';
		html+='<div class="small-10 small-offset-2 columns" >';
		for(var i in buf[0].cmnts)
		{
			html+=	'<div><br>'+buf[0].cmnts[i].txt;
			html+=	'<p style="font-size:.8em;">'+buf[0].cmnts[i].nick+' | '+ (new Date(buf[0].cmnts[i].lts).toLocaleString())+'</p>';
			html+=	'</div>';
			html+=	'<hr>';		
		};
		html+="</div></div>"+footer;
		resstream.write(html);
		resstream.end();
	}catch(err)
	{
		//console.log(err);
	};
};
/////////////////////////////////////////////////////////////////////////////
///////////////////////////// СЕРВЕР ////////
///////////////////////////////////////////////////////////////////////////// 
var tempserver = http.createServer(function (req, res1) {
	var peerreq=req.url.toString().substr(req.url.toString().indexOf("?")+1);
	gth.thtp.request("thtp://"+peerreq,function(err,res){
		if(err)
		res.end("error");
		else
		{
			var buf="";
			res.on('readable', function() {
				var chunk;
				while (null !== (chunk = res.read())) {
					console.log('got %d bytes of data', chunk.length);
					buf+=chunk;
				}
				console.log(buf);
				RenderOut(buf,res1);
			});
		};
	});
});

tempserver.listen(56765);

//th.debug(console.log);
gth=null;
th.init({id:path.resolve("client.json"),seeds:path.resolve("seeds.json")},function(err,self){
  if(err) return console.log(err);
  require("./index.js").install(self);
  gth=self;
  console.log("telehash ready "+self.hashname);
});