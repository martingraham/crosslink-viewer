//		xiNET Cross-link Viewer
//		Copyright 2013 Rappsilber Laboratory
//
//    	This product includes software developed at
//    	the Rappsilber Laboratory (http://www.rappsilberlab.org/).
//
//		author: Colin Combe
//
//		Link.js

"use strict";

//'superclass' for Protein, CLMS.xiNET.RenderedCrossLink, CLMS.xiNET.RenderedProteinLink
CLMS.xiNET.RenderedLink = function (){};
// event handler for starting dragging or rotation (or flipping internal links)
CLMS.xiNET.RenderedLink.prototype.mouseDown = function(evt) {
//    //console.log("clickable mouse down");
	this.controller.preventDefaultsAndStopPropagation(evt);//see MouseEvents.js
	//if a force layout exists then stop it
	if (this.controller.force){
		this.controller.force.stop();
	}
	this.controller.dragElement = this;
	this.controller.clearSelection();
	this.setSelected(true);
	//store start location
	var p = this.controller.getEventPoint(evt);// seems to be correct, see above
	this.controller.dragStart = this.controller.mouseToSVG(p.x, p.y);
	return false;
}

// highlight on mouseover, all 'subclasses' need a showHighlight method
CLMS.xiNET.RenderedLink.prototype.mouseOver = function(evt){
	//console.log("clickable mouse over");
	this.controller.preventDefaultsAndStopPropagation(evt);
	this.showHighlight(true, true);
	this.controller.setTooltip(this.tooltip);
	return false;
}

CLMS.xiNET.RenderedLink.prototype.mouseOut = function(evt){
	//console.log("clickable mouse out");
	this.controller.preventDefaultsAndStopPropagation(evt);
	//    if (this.controller.dragElement == undefined) {
	this.showHighlight(false, true);
	//    } else {
	//        if (this.controller.dragElement != this){// todo: improve, actually needs to know
	//            // if drag element is part of dragging subgraph
	//            this.showHighlight(false, true);
	//        }
	//    }
	this.controller.hideTooltip();
	return false;
}

CLMS.xiNET.RenderedLink.prototype.touchStart = function(evt) {
//    //console.log("clickable mouse down");
	this.controller.preventDefaultsAndStopPropagation(evt);//see MouseEvents.js
	//if a force layout exists then stop it
	if (this.controller.force !== undefined){
		this.controller.force.stop();
	}
	this.controller.dragElement = this;
			this.controller.clearSelection();
			this.setSelected(true);
	//store start location
	var p = this.controller.getTouchEventPoint(evt);// seems to be correct, see above
	this.controller.dragStart = this.controller.mouseToSVG(p.x, p.y);
	return false;
}


