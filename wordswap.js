var content = {
	enabled: true,
	oldBody: null,
	debug: false
};

function _is_valid_character(ch)
{
	if(!ch || (typeof ch != "string" || ch.length != 1))
	  return false;

	var code = ch.charCodeAt(0);
	
	// this is A-Za-z0-9 and apostrophes
	return ((code >= 48 && code <= 57) || (code >= 65 && code <= 90)  ||
	        (code >= 97 && code <= 122) || (code >= 138 && code <= 142) ||
			(code >= 154 && code <= 159) || (code >= 192 && code <= 255));
			// code == 44
}

function keys(obj) {
    var ary = [];
	for(var prop in obj) {
        ary.push(prop);
    }
    return ary;
}

function wordsplit(s) {
	var tokens = [];
	var lastc = c = 0;
	while(c < s.length) {
		while (_is_valid_character(s[c]) && c < s.length) c++;
		if(c > lastc) {
			tokens.push([0, s.substr(lastc, c-lastc)]);		
			lastc = c;
		}
		while (!_is_valid_character(s[c]) && c < s.length) c++;
		if(c > lastc) {
			tokens.push([1, s.substr(lastc, c-lastc)]);
			lastc = c;
		}
	}
	return tokens;
}
 
function isVowels(b) {
	var vow = toSet('aeiou');
	var g = b.toLowerCase();
	for(var c in g) {
		if(!vow[g[c]])
			return false;
	}
	return true;
 }
 
function toSet(ary) {
	var obj = {};
	for(var i=0; i<ary.length; i++) obj[ary[i]] = true;
	return obj;
}

function replaceVowel(text, symbols) {
	var symb = symbols[Math.floor(Math.random()*symbols.length)];
	for(var c=0; c<text.length; c++) { // first Vowel
		if(vowel[text[c]]) {
			text = text.substr(0, c) + symb + text.substr(c+1, text.length);
			break;
		}
	}
	return text;
}

function convertWord(text, zis) {
	var zi = zis[Math.floor(Math.random() * zis.length)];
	return zi + text.substr(1);
}

var dict;

var singleEnds = ["'", "s", "y"];
var doubleEnds = ["ed", "ic", "'s", "er", "ly"];
var tripleEnds = ["ing", "est", "ful", "ish", "ity"];
var quadEnds   = ["less", "able", "ment", "ness", "ally"];
var fifthEnds  = ['fully'];
var sixthEnds  = ['lessly'];
var vowel = {'a':true, 'e':true, 'i':true, 'o':true, 'u':true};

var endingsDict = [singleEnds, doubleEnds, tripleEnds, quadEnds, fifthEnds, sixthEnds];
for(var i=0; i<endingsDict.length; i++) endingsDict[i] = toSet(endingsDict[i]);

function rootWord(key) {
	if (dict[key]) 
		return key;
	
	var nkey;
	for(var end=0; end<endingsDict.length && end<key.length-2; end++) { // truncate endings
		ending = key.substr(key.length-end-1, key.length);
		if(endingsDict[end][ending]) {
			var nkey = key.substr(0, key.length-end-1);
			if(key[key.length-1] === 'i')
				nkey = key.substr(0, key.length-1) + "y";
				
			if(dict[nkey])
				break;
			nkey += "e";
			if(dict[nkey])
				break;
		}
	}
	return '';
}

function doString(s) {
	var newBody="";
	var splits = wordsplit(s);
	var text, sep;
	var i = 0;
	var presep = true;
	while(i<splits.length) {
		if(splits[i][0]) { // seperator
			sep = splits[i][1];
			if(i < splits.length) {
				i++;
				continue;
			} else {
				newBody += sep;
				break;				
			}
		}
		text = splits[i][1];
		var key = rootWord(text.toLowerCase());
		var val = dict[key];		
		if(val) text = convertWord(text, val);
		
		if(sep && (sep !== " ") || (sep === " " && !val)) {
			newBody += sep;
			sep = '';
		}
		newBody += text;
		i++;
	}
	return newBody;
}

function enable() {
	chrome.extension.sendRequest({"greeting": "getDict"}, function(response) {
		dict = response.data;
		startArray = $('body').contents();
		
		content.oldBody = $('body').html();
		
		function recurseSwitch(ary) {
			for(var i=0; i<ary.length; i++) {
				if(!ary[i]) continue;
				if(ary[i].childNodes && ary[i].childNodes.length>0) {
					recurseSwitch(ary[i].childNodes);
				} else if(ary[i].data) {
					ary[i].data = doString(ary[i].data);					
				} else if (ary[i].textContent) { // && (ary[i].nodeType === 1 || ary[i].nodeType == 3)) {
					ary[i].innerHTML = doString(ary[i].innerHTML);
				}
			}
		}

		recurseSwitch(startArray);
	});
}

function disable() {
	if(content.oldBody) 
		$('body').html(content.oldBody); 
}

function getSelectionCoordinates(start) {
    var x = 0, y = 0, range;
    if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(sel.rangeCount - 1);
            range.collapse(start);
            var dummy = document.createElement("span");
            range.insertNode(dummy);
            var rect = dummy.getBoundingClientRect();
            x = rect.left;
            y = rect.top;
            dummy.parentNode.removeChild(dummy);
        }
    } else if (document.selection && document.selection.type != "Control") {
        range = document.selection.createRange();
        range.collapse(start);
        x = range.boundingLeft;
        y = range.boundingTop;
    }
    return {x: x, y: y};
}

function popup(text) {
	var text = ''+text;
	var coords = getSelectionCoordinates();
	var popup = $('<div>'+text+'</div>');
	popup.css({'position': 'absolute', 'border':'solid thin black', 'background-color':'Beige', 'left':coords.x, 'top':coords.y, 'z-index':1000});
	popup.appendTo('body');
	popup.delay(100+text.length*35).fadeOut(400);
}

function createToolbar() {
	var toolbar = $('<div id="kanji-immersion-toolbar"></div>');
	toolbar.css({'position': 'fixed', 'top': '-5px', 'left': 0, 
		'width': '100%', 'z-index': 100, 'margin': 0, 'padding': 0});
	toolbar.html('<input id="kit-txt" size="35" type="text"/><button id="kit-convert">Convert</button>');
	toolbar.appendTo('body');
	
	var submit = function() {
		$('#kit-txt')[0].value = doString($('#kit-txt')[0].value);
		$('#kit-txt').select();
	}
	$('#kit-convert').click(function() { submit(); });
	$('#kit-txt').keypress(function(evt){ if(evt.which==13)submit(); });
	
}

function updateToolbar() {
	var elt = $('#kanji-immersion-toolbar');
	if(elt.length==0)
		createToolbar();
	else
		elt.remove();
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(content.debug) console.log(JSON.stringify(request));
	switch(request.type) {
		case 'enable': enable(); break;
		case 'disable': disable(); break;
		case 'popup': popup(request.text); break;
		case 'updateToolbar': updateToolbar(request.state); break;
	}
});

$(document).ready(function() {
	//console.log(JSON.stringify(newWordSplit('wat th')));
	//console.log(JSON.stringify(newWordSplit('| |wat<_th ')));
	chrome.extension.sendRequest({'greeting': 'options'}, function(options) {
		if(options.enabled) enable();
		if(options.enableToolbar) updateToolbar(true);
	});
});