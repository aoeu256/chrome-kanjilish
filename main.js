//chrome.browserAction.setBadgeBackgroundColor({color:[0, 200, 0, 100]});
var i = 0;
var data = {};
var Dictionary;
var nloaded = 0;
var loadFiles = ['Heisig.xml', 'Kanjidic.xml', 'KIC.xml'];

chrome.browserAction.onClicked.addListener(inlineToggle);

var options = {
	enabled: false
};

function inlineToggle(tab, mode) {
	options.enabled = !options.enabled;
	if(options.enabled) {
		chrome.browserAction.setBadgeBackgroundColor({"color":[255,255,0,255]});
		chrome.browserAction.setBadgeText({"text":"On"});	
		if(tab) chrome.tabs.sendMessage(tab.id, {"type":"enable"});
	} else {
		chrome.browserAction.setBadgeBackgroundColor({"color":[0,0,0,255]});
		chrome.browserAction.setBadgeText({"text":"Off"});	
		if(tab) chrome.tabs.sendMessage(tab.id, {"type":"disable"});
	}
}

function keys(obj) {
	var ary = [];
	for(var prop in obj) {
		ary.push(prop);
	}
	return ary;
}

function extendList(dic, key, s) {
	var lst = dic[key];
	
	if(!lst)
		lst = {};

	for(var i=0; i<s.length/2; i++)
		lst[s[i*2]] = true;
	dic[key] = lst;
}

function loadData(dat) {
	
	$(dat).find("entry").each(function() {				
		var elt = $(this);
		extendList(data, elt.attr('key'), elt.attr('kanji'));
	});
	nloaded++;
	if(nloaded == loadFiles.length) {
		for(var key in data) {			
			data[key] = keys(data[key]);
		}
		console.log(data['accompany']);
	}	
}

// Create one test item for each context type.
// var contexts = ["page","selection","link","editable","image","video",
                // "audio"];
// for (var i = 0; i < contexts.length; i++) {
  // var context = contexts[i];
  // var title = "Test '" + context + "' menu item";
  // var id = chrome.contextMenus.create({"title": title, "contexts":[context],
                                       // "onclick": genericOnClick});
  // console.log("'" + context + "' item:" + id);
// }

chrome.contextMenus.create({'title': 'Lookup character', 'contexts': ['selection'], 'onclick':function(info, tab) {
  //console.log("item " + info.menuItemId + " was clicked");
  //console.log("info: " + JSON.stringify(info));
  //console.log("tab: " + JSON.stringify(tab));	
  
	if(!options.reverseDict) {
		options.reverseDict = {};
		for(var k in data) {
			var val = data[k];
			for(var i=0; i<val.length; val++) {
				if(!options.reverseDict[val[i]])
					options.reverseDict[val[i]] = [k];
				else
					options.reverseDict[val[i]].push(k);
			}
		}
	}
  
	var val = options.reverseDict[info.selectionText];
	var response;
	if(val) response = val;
	else    response = 'Could not lookup character';

	chrome.tabs.sendMessage(tab.id, {"type":"popup", 'text':response});
  
}});

$(document).ready(function() {
	console.log('rdy');
	for(filename in loadFiles) {		
		$.get(loadFiles[filename], loadData);
	}
	
	inlineToggle();

	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	 
		console.log(sender.tab ? " content script:" + sender.tab.url : "from the extension" + request);
		if (request.greeting == "getDict") {
			console.log('sendin dic');
			sendResponse({"data": data, "options": options});
		} else if(request.greeting === "options") {
			sendResponse(options);
		}
		else
			sendResponse({}); // snub them.
			
		
	});
});