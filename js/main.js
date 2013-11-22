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
        viewModel.currentTool().onMove(dx, dy, x, y, event);
    },
    function onStart(x, y, event) {
        viewModel.currentTool().onStart(x, y, event);
    },
    function onEnd(x, y, event) {
        viewModel.currentTool().onEnd(x, y, event);
    });

var pencilTool = {
    onStart: function onStart(x, y, event) {
        x = event.offsetX;
        y = event.offsetY;
        line = s.path(['M', x, y].join(' '));
        line.data('points', [x, y]);
        line.attr(viewModel.currentStyle());
    },
    onMove: function onMove(dx, dy, x, y, event) {
        var points = line.data('points');
        points.push(points[0] + dx, points[1] + dy);
        line.attr('path', ['M', points[0], points[1], 'R'].concat(points).join(' '));
    },
    onEnd: function onEnd(x, y, event) {
        state.perform(s, InsertSVG(line.remove()));
    }
};

var lineTool = {
    onStart: function onStart(x, y, event) {
        x = event.offsetX;
        y = event.offsetY;
        line = s.path(['M', x, y].join(' '));
        line.data('points', [x, y, x, y]);
        line.attr(viewModel.currentStyle());
    },
    onMove: function onMove(dx, dy, x, y, event) {
        var points = line.data('points');
        points.splice(2, 2, points[0] + dx, points[1] + dy);
        line.attr('path', ['M', points[0], points[1], 'L'].concat(points).join(' '));
    },
    onEnd: function onEnd(x, y, event) {
        state.perform(s, InsertSVG(line.remove()));
    }
};

function ViewModel() {
    var self = this;
    this.tool = ko.observable("pencil");
    this.currentTool = function () {
        return this.tools[this.tool()];
    };
    this.currentStyle = function () {
        if (this.tool() === 'eraser') {
            return this.eraserStyle;
        } else {
            return this.drawStyle;
        }
    };
    this.tools = {
        pencil: pencilTool,
        eraser: pencilTool,
        line: lineTool
    }
    this.mainSvg = mainSvg;
    this.drawStyle = {fill: 'none', stroke: "#000000", strokeWidth: 10, strokeLinecap: 'round'};
    this.eraserStyle = {fill: 'none', stroke: "white", strokeWidth: 10, strokeLinecap: 'round'};
    this.s = s;
    this.state = state;
    this.changeTool = function(model, event) {
    	this.tool(event.currentTarget.dataset.tool);
    };
    this.undo = function undo() {
        self.state.undo(self.s);
    };
    this.redo = function redo() {
        self.state.redo(self.s);
    };
}
var viewModel = new ViewModel();
ko.applyBindings(viewModel);

