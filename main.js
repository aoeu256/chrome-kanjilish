function keys(obj) {
	var ary = [];
	for(var prop in obj) {
		ary.push(prop);
	}
	return ary;
}

var Main = {
	data: {},	
	nloaded: 0,
	loadFiles: [],
	dicts: {'Heisig':true, 'Kanjidic':false, 'KIC':false};
	config: {'Enable-Keys':true},
	options: {
		enabled: false,
		enableToolbar: true
	},
	
	onTabSelect: function(tabId) {
		if(Main.options.enabled)
			chrome.tabs.sendMessage(tabId, {"type":"enable"});
		else
			chrome.tabs.sendMessage(tabId, {"type":"disable"});
	},
	inlineToggle: function(tab, mode) {
		Main.options.enabled = !Main.options.enabled;
		if(Main.options.enabled) {
			chrome.browserAction.setBadgeBackgroundColor({"color":[255,255,0,255]});
			chrome.browserAction.setBadgeText({"text":"On"});	
			if(tab) chrome.tabs.sendMessage(tab.id, {"type":"enable"});
		} else {
			chrome.browserAction.setBadgeBackgroundColor({"color":[0,0,0,255]});
			chrome.browserAction.setBadgeText({"text":"Off"});	
			if(tab) chrome.tabs.sendMessage(tab.id, {"type":"disable"});
		}
	},
	loadData: function(dat) {
		var extendList = function(dic, key, s) {
			var lst = dic[key] || {};
			
			for(var i=0; i<s.length/2; i++)
				lst[s[i*2]] = true;
			dic[key] = lst;
		}

		$(dat).find("entry").each(function() {				
			var elt = $(this);
			extendList(Main.data, elt.attr('key'), elt.attr('kanji'));
		});
		Main.nloaded++;
		if(Main.nloaded == Main.loadFiles.length) {
			for(var key in Main.data)
				Main.data[key] = keys(Main.data[key]);

			console.log(Main.data['accompany']); // test loading			
		}
	},
	initChrome: function () {
		chrome.browserAction.onClicked.addListener(Main.inlineToggle);
		chrome.tabs.onSelectionChanged.addListener(Main.onTabSelect);

		chrome.contextMenus.create({'title': 'Toggle toolbar', 'contexts': ['page'], 'onclick':function(info, tab) {	
			Main.options.enableToolbar = true;
			chrome.tabs.sendMessage(tab.id, {"type":"updateToolbar", 'state':Main.options.enableToolbar});
		}});

		chrome.contextMenus.create({'title': 'Lookup character', 'contexts': ['selection'], 'onclick':function(info, tab) {
			options = Main.options;
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
		  
			chrome.tabs.sendMessage(tab.id, {"type":"popup", 'text':options.reverseDict[info.selectionText] || 'Could not look up character'});
		}});
	},
	load: function () {
		for(var d in Main.dicts) Main.loadfiles.push(d+'.xml');
		for(var filename in Main.loadFiles)
			$.get(Main.loadFiles[filename], Main.loadData);
		
		Main.inlineToggle();

		chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
			console.log(sender.tab ? " content script:" + sender.tab.url : "from the extension" + request);
			if (request.greeting == "getDict") {
				sendResponse({"data": Main.data, "options": Main.options});
			} else if(request.greeting === "options") {
				sendResponse(Main.options);
			} else {
				sendResponse({}); // snub them.
			}
		});
	}
};

Main.initChrome();
$(document).ready(Main.load);