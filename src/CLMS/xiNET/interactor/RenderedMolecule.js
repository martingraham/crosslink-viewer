//      xiNET Interaction Viewer
//      Copyright 2013 Rappsilber Laboratory
//
//      This product includes software developed at
//      the Rappsilber Laboratory (http://www.rappsilberlab.org/).
//
//      Molecule.js
//
//      authors: Colin Combe

//josh - should these be moved to Config.js?
Molecule.LABELMAXLENGTH = 90; // maximal width reserved for protein-labels
Molecule.labelY = -5; //label Y offset, better if calc'd half height of label once rendered

function Molecule() {}

Molecule.prototype.addStoichiometryLabel = function(stoich) {
    if (this.labelSVG) { //complexes don't have labels (yet?)
        this.labelSVG.childNodes[0].data = this.labelSVG.childNodes[0].data + ' [' + stoich + ']';
    }
}

Molecule.prototype.mouseDown = function(evt) {
    this.controller.preventDefaultsAndStopPropagation(evt);
    //stop layout
    if (this.controller.d3cola) {
        this.controller.d3cola.stop();
    }
    this.controller.dragElement = this;
    this.controller.dragStart = evt;

    d3.select("#container-menu").style("display", "none");

    return false;
};

Molecule.prototype.touchStart = function(evt) {
    this.controller.preventDefaultsAndStopPropagation(evt);
    //stop layout
    if (this.controller.d3cola) {
        this.controller.d3cola.stop();
    }
    this.controller.dragElement = this;
    //store start location
    //var p = this.controller.getTouchEventPoint(evt); //oh dear - now broken
    this.controller.dragStart = evt; //this.controller.mouseToSVG(p.x, p.y);
    return false;
};

Molecule.prototype.mouseOver = function(evt) {
    var p = this.controller.getEventPoint(evt);
    this.controller.model.get("tooltipModel")
        .set("header", CLMSUI.modelUtils.makeTooltipTitle.interactor(this.participant))
        .set("contents", CLMSUI.modelUtils.makeTooltipContents.interactor(this.participant))
        .set("location", {
            pageX: p.x,
            pageY: p.y
        });
};

Molecule.prototype.mouseOut = function(evt) {
    this.controller.model.setHighlightedProteins([]); // mjg apr 18
    this.controller.model.get("tooltipModel").set("contents", null);
};

Molecule.prototype.getBlobRadius = function() {
    return 15;
};

Molecule.prototype.showHighlight = function(show) {
    //     // default do nothing
    //     /*
    //     if (show === true) {
    //         //~ this.highlight.setAttribute("stroke", xiNET.highlightColour.toRGB());
    //         this.highlight.setAttribute("stroke-opacity", "1");
    //     } else {
    //         //~ if (this.isSelected == false) {
    //                 this.highlight.setAttribute("stroke-opacity", "0");
    //         //~ }
    //         //~ this.highlight.setAttribute("stroke", xiNET.selectedColour.toRGB());
    //     }
    //     * */
    // };
    // CLMS.xiNET.RenderedProtein.prototype.showHighlight = function(show) {
    var d3HighSel = d3.select(this.highlight);
    this.isHighlighted = show ? true : false; // mjg apr 18
    if (show === true) {
        //~ this.highlight.setAttribute("stroke", CLMS.xiNET.highlightColour.toRGB());
        d3HighSel
            .classed("selectedProtein", false)
            .classed("highlightedProtein", true)
            .attr("stroke-opacity", "1");
    } else {
        if (this.isSelected == false) {
            d3HighSel.attr("stroke-opacity", "0");
        }
        //~ this.highlight.setAttribute("stroke", CLMS.xiNET.selectedColour.toRGB());
        d3HighSel
            .classed("selectedProtein", true)
            .classed("highlightedProtein", false);
    }
};

Molecule.prototype.setSelected = function(select) {
    //do nothing
    /*
     if (select && this.isSelected === false) {
         this.controller.selected.set(this.id, this);
         this.isSelected = true;
         this.highlight.setAttribute("stroke", Config.selectedColour);
         this.highlight.setAttribute("stroke-opacity", "1");
     }
     else if (select === false && this.isSelected === true) {
         this.controller.selected.remove(this.id);
         this.isSelected = false;
         this.highlight.setAttribute("stroke-opacity", "0");
         this.highlight.setAttribute("stroke", Config.highlightColour);
     }*/
};

Molecule.prototype.getPosition = function() {
    return [this.cx, this.cy];
}

// more accurately described as setting transform for top svg elements (sets scale also)
Molecule.prototype.setPosition = function(xPos, yPos) {
    this.px = this.cx;
    this.py = this.cy;
    this.cx = xPos;
    this.cy = yPos;
    console.log("!", this.cx, this.cy);

    // if (this.participant.form === 1) {
    console.log(this.name, "before", this.upperGroup.getAttribute("transform"));
    this.upperGroup.setAttribute("transform", "translate(" + this.cx + " " + this.cy + ")" +
        " scale(" + (this.controller.z) + ") "); // + "rotate(" + this.rotation + ")");
    console.log(this.name, "after", this.upperGroup.getAttribute("transform"));
        // } else {
    //     this.upperGroup.setAttribute("transform", "translate(" + this.x + " " + this.y + ")" +
    //         " scale(" + (this.controller.z) + ") ");
    // }
};

Molecule.prototype.getAggregateSelfLinkPath = function() {
    var intraR = this.getBlobRadius() + 7;
    var sectorSize = 45;
    var arcStart = Molecule.trig(intraR, 25 + sectorSize);
    var arcEnd = Molecule.trig(intraR, -25 + sectorSize);
    var cp1 = Molecule.trig(intraR, 40 + sectorSize);
    var cp2 = Molecule.trig(intraR, -40 + sectorSize);
    return 'M 0,0 ' +
        'Q ' + cp1.x + ',' + -cp1.y + ' ' + arcStart.x + ',' + -arcStart.y +
        ' A ' + intraR + ' ' + intraR + ' 0 0 1 ' + arcEnd.x + ',' + -arcEnd.y +
        ' Q ' + cp2.x + ',' + -cp2.y + ' 0,0';
}

Molecule.rotatePointAboutPoint = function(p, o, theta) {
    theta = (theta / 360) * Math.PI * 2; //TODO: change theta arg to radians not degrees
    var rx = Math.cos(theta) * (p[0] - o[0]) - Math.sin(theta) * (p[1] - o[1]) + o[0];
    var ry = Math.sin(theta) * (p[0] - o[0]) + Math.cos(theta) * (p[1] - o[1]) + o[1];
    return [rx, ry];
}

Molecule.prototype.checkLinks = function() {
    function checkAll(linkMap) {
        var links = linkMap.values();
        var c = links.length;
        for (var l = 0; l < c; l++) {
            links[l].check();
        }
    }
    checkAll(this.naryLinks);
    checkAll(this.binaryLinks);
    checkAll(this.sequenceLinks);
    if (this.selfLink !== null) {
        this.selfLink.check();
    }
}

// update all lines (e.g after a move)
Molecule.prototype.setAllLinkCoordinates = function() {
    var nLinks = this.naryLinks.values();
    var c = nLinks.length;
    for (var l = 0; l < c; l++) {
        nLinks[l].setLinkCoordinates();
    }

    var pLinks = this.renderedP_PLinks;
    var plCount = pLinks.length;
    for (var pl = 0; pl < plCount; pl++) {
        pLinks[pl].setLineCoordinates(this);
    }

    var renderedCrossLinks = this.renderedCrossLinks;
    var rclCount = renderedCrossLinks.length;
    for (var rcl = 0; rcl < rclCount; rcl++) {
        renderedCrossLinks[rcl].setLineCoordinates(this);
    }

    // links = this.binaryLinks.values();
    // c = links.length;
    // for (var l = 0; l < c; l++) {
    //     var link = links[l];
    //     link.setLinkCoordinates();
    // }
    // /*if (this.selfLink) {
    //     this.selfLink.setLinkCoordinates();
    // }*/
    // links = this.sequenceLinks.values();
    // c = links.length;
    // for (var l = 0; l < c; l++) {
    //     links[l].setLinkCoordinates();
    // }
};
/*
//todo: some tidying with regards whats in Molecule, whats in Polymer and whats in Gene,Protein, etc
Molecule.prototype.clearPositionalFeatures = function(posFeats) {
    this.annotations = [];
    if (this.annotationsSvgGroup) this.controller.emptyElement(this.annotationsSvgGroup);
}

//todo: some tidying with regards whats in Molecule, whats in Polymer and whats in Gene,Protein, etc
Molecule.prototype.setPositionalFeatures = function(posFeats) {
    if (posFeats !== undefined && posFeats !== null) {
        var y = -Molecule.STICKHEIGHT / 2;
        //draw longest regions first
        posFeats.sort(function(a, b) {
            return (b.end - b.begin) - (a.end - a.begin);
        });
        this.annotations = posFeats;
        if (this.annotations.length == 0) {
            //~ alert("no annot");
            this.annotations.push({
                begin: 1,
                end: this.size,
                description: "No annotations"
            });
        }
        for (var i = 0; i < posFeats.length; i++) {
            var anno = posFeats[i];
            anno.begin = anno.begin - 0;
            anno.end = anno.end - 0;
            anno.pieSlice = document.createElementNS(Config.svgns, "path");
            if (this.participant.form === 0) {
                anno.pieSlice.setAttribute("d", this.getAnnotationPieSliceArcPath(anno));
            } else {
                anno.pieSlice.setAttribute("d", this.getAnnotationRectPath(anno));
            }
            anno.pieSlice.setAttribute("stroke-width", 1);
            anno.pieSlice.setAttribute("fill-opacity", "0.6");
            var text = anno.description + " [" + anno.begin + " - " + anno.end + "]";
            anno.pieSlice.name = text;
            var xlv = this.controller;
            var self = this;
            anno.pieSlice.onmouseover = function(evt) {
                var el = (evt.target.correspondingUseElement) ? evt.target.correspondingUseElement : evt.target;
                xlv.preventDefaultsAndStopPropagation(evt);
                xlv.setTooltip(el.name, el.getAttribute('fill'));
                self.showHighlight(true);
            };
            if (this.annotationsSvgGroup) { //hack
                this.annotationsSvgGroup.appendChild(anno.pieSlice);
            }
        }
    }
};*/

//TODO: remove this, use rotateAboutPoint instead
Molecule.trig = function(radius, angleDegrees) {
    //x = rx + radius * cos(theta) and y = ry + radius * sin(theta)
    var radians = (angleDegrees / 360) * Math.PI * 2;
    return {
        x: (radius * Math.cos(radians)),
        y: (radius * Math.sin(radians))
    };
};


Molecule.prototype.setForm = function(form, svgP) {};

Molecule.prototype.getX = function() {
    return this.cx;
}

Molecule.prototype.getY = function() {
    return this.cy;
}

Molecule.prototype.updateName = function(annotation) {
    this.labelTextNode.textContent = this.participant.name;
};

Molecule.prototype.showLabel = function(show) {
    d3.select(this.labelSVG).attr("display", show ? null : "none");
};

/*CLMS.xiNET.RenderedProtein.prototype.hasExternalLink = function() {
    var pLinks = this.renderedP_PLinks;
    var plCount = pLinks.length;
    for (var pl = 0; pl < plCount; pl++) {
        if (pLinks[pl].crossLinks[0].isSelfLink() === false) return true;
    }
    return false;
};*/

Molecule.prototype.getRenderedParticipant = function() {
    if (this.complex && this.complex.participant.form == 0) {
        return this.complex.getRenderedParticipant();
    } else {
        return this;
    }
}
