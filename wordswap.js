var content = {
	enabled: true,
	oldBody: null
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
	var curToken = "";
	var curSplitter = "";
	var tokens = [];
	var splitter = [];
	for(var c=0; c<s.length; c++) {
		if (_is_valid_character(s[c])) {
			curToken += s[c];
			if(curSplitter) splitter.push(curSplitter);
			curSplitter = "";
		}
			
		else {
			curSplitter += s[c];
			if(curToken) tokens.push(curToken);
			curToken = "";
		}
	}
	if(curSplitter) splitter.push(curSplitter);
	if(curToken) tokens.push(curToken);
		
	return [tokens, splitter];
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
	var words = splits[0];
	var seps = splits[1];
	var splitOff = 0;
	var sep = "";
	
	// WORD <SEP> WORD
	// <SEP> WORD <SEP> WORD <SEP>

	if(seps.length > words.length) {// more seps
		newBody = seps[0];
		splitOff++;
	}
	
	for(var i=0; i<words.length; i++) {
		var key = rootWord(words[i].toLowerCase());
		var val = dict[key];
		var text = words[i];
		
		if(val) text = convertWord(text, val);
		
		var sep = seps[i+splitOff];
		if(sep && (sep !== " ") || (sep === " " && !val)) {
			newBody += sep;
		}
		newBody += text;
		
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
				//nodeType === 1 // P
				//nodeType === 2 
				//nodeType === 3
				/*if(ary[i].children && ary[i].children.length>0) {
					for(var i=0; i<ary[i].childNodes.length; i++) {
						if(ary[i].childNodes[i].data)
							recurseSwitch(ary[i].children);
						else
							
					}
				}*/
				if(ary[i].childNodes && ary[i].childNodes.length>0) {
					recurseSwitch(ary[i].childNodes);
				} else if (ary[i].innerText && ary[i].innerText !== "") { // && (ary[i].nodeType === 1 || ary[i].nodeType == 3)) {
					ary[i].innerHTML = doString(ary[i].innerHTML);
				} else if(ary[i].data) {
					ary[i].data = doString(ary[i].data);
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
        y = range.boundingTop-4;
    }
    return {x: x, y: y};
}

function popup(text) {
	var text = ''+text;
	var coords = getSelectionCoordinates();
	var popup = $('<div>'+text+'</div>');
	popup.css({'position': 'absolute', 'border':'solid thin black', 'background-color':'Beige', 'left':coords.x, 'top':coords.y});
	popup.appendTo('body');
	popup.delay(100+text.length*35).fadeOut(400);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log('got request '+request.type);
	switch(request.type) {
		case 'enable': enable(); break;
		case 'disable': disable(); break;
		case 'popup': popup(request.text); break;
	}
});


$(document).ready(function() {
	chrome.extension.sendRequest({'greeting': 'options'}, function(options) {
		if(options.enabled) enable();
	});
});