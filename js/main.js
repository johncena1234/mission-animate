/*
  See http://snapsvg.io/start/
*/
var state = new StateManager();
var mainSvg = Snap("#svg");

// s will be our drawing surface
var s = mainSvg.select('.draw-area');

// dragArea is on top of s, so we can draw over the whole surface
var dragArea = mainSvg.select('.drag-area');

var line = null;
dragArea.drag(
    function onMove(dx, dy, x, y, event) {
    	x = parseFloat(line.asPX("x1"));
    	y = parseFloat(line.asPX("y1"));
    	line.attr({x2: x + dx, y2: y + dy});
    },
    function onStart(x, y, event) {
    	line = s.line(
            event.offsetX, event.offsetY,
            event.offsetX, event.offsetY);	
    	line.attr(viewModel.lineStyle);
    },
    function onEnd(x, y, event) {
        state.perform(s, InsertSVG(line.remove()));
    });

function ViewModel() {
    var self = this;
    this.mainSvg = mainSvg;
    this.lineStyle = {stroke: "#000000", strokeWidth: 10};
    this.s = s;
    this.state = state;
    this.undo = function undo() {
        self.state.undo(self.s);
    };
    this.redo = function redo() {
        self.state.redo(self.s);
    };
}
var viewModel = new ViewModel();
ko.applyBindings(viewModel);
