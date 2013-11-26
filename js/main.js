/*
  See http://snapsvg.io/start/
*/
var state = new StateManager();
var mainSvg = Snap("#svg");

// s will be our drawing surface
var s = mainSvg.select('.draw-area');

// dragArea is on top of s, so we can draw over the whole surface
var dragArea = mainSvg.select('.drag-area');
var mouseArea = mainSvg.select('.mouse-area');

mainSvg.drag(
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
    line: null,
    onStart: function onStart(x, y, event) {
        x = event.offsetX;
        y = event.offsetY;
        this.line = s.path(['M', x, y].join(' '));
        this.line.data('points', [x, y]);
        this.line.attr(viewModel.currentStyle());
    },
    onMove: function onMove(dx, dy, x, y, event) {
        var points = this.line.data('points');
        points.push(points[0] + dx, points[1] + dy);
        this.line.attr('path', ['M', points[0], points[1], 'R'].concat(points).join(' '));
    },
    onEnd: function onEnd(x, y, event) {
        state.perform(s, InsertSVG(this.line.remove()));
        this.line = null;
    }
};

var lineTool = {
    line: null,
    onStart: function onStart(x, y, event) {
        x = event.offsetX;
        y = event.offsetY;
        this.line = s.path(['M', x, y].join(' '));
        this.line.data('points', [x, y, x, y]);
        this.line.attr(viewModel.currentStyle());
    },
    onMove: function onMove(dx, dy, x, y, event) {
        var points = this.line.data('points');
        points.splice(2, 2, points[0] + dx, points[1] + dy);
        this.line.attr('path', ['M', points[0], points[1], 'L'].concat(points).join(' '));
    },
    onEnd: function onEnd(x, y, event) {
        state.perform(s, InsertSVG(this.line.remove()));
        this.line = null;
    }
};

var mouseTool = {
    target: null,
    origTransform: null,
    onStart: function onStart(x, y, event) {
        if (event.target.classList.contains('mouse-area')) {
            this.clearSelection();
            return;
        }
        this.target = WrapSnap(event.target);
        this.origTransform = this.target.attr('transform').toString();
        this.target.node.classList.add('selected');
    },
    onMove: function onMove(dx, dy, x, y, event) {
        if (this.target === null) {
            return;
        }
        this.target.attr('transform', this.origTransform + 't' + [dx, dy].join(','));
    },
    onEnd: function onEnd(x, y, event) {
        if (this.target === null) {
            return;
        }
        this.target.commit(s, state);
    },
    strokeChanged: function (newStroke) {
        if (this.target === null) {
            return;
        }
        this.target.attr('stroke', newStroke);
    },
    clearSelection: function clearSelection() {
        if (this.target !== null) {
            this.target.commit(s, state);
            this.target.node.classList.remove('selected');
            this.target = null;
            this.origTransform = null;
        }
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
        line: lineTool,
        mouse: mouseTool
    };
    this.mainSvg = mainSvg;
    this.drawStyle = {fill: 'none', stroke: "#000000", strokeWidth: 10, strokeLinecap: 'round'};
    this.eraserStyle = {fill: 'none', stroke: "white", strokeWidth: 10, strokeLinecap: 'round'};
    this.s = s;
    this.state = state;
    this.changeTool = function(model, event) {
    	this.tool(event.currentTarget.dataset.tool);
    };
    this.undo = function undo() {
        mouseTool.clearSelection();
        self.state.undo(self.s);
    };
    this.redo = function redo() {
        mouseTool.clearSelection();
        self.state.redo(self.s);
    };
    // Knockout won't do css bindings on SVG elements
    this.tool.subscribe(function (tool) {
        dragArea.node.classList.toggle('hide', tool === 'mouse');
        mouseArea.node.classList.toggle('hide', tool !== 'mouse');
        mouseTool.clearSelection();
    });
    this.stroke = ko.computed({
        owner: this,
        read: function () { return this.drawStyle.stroke; },
        write: function (val) {
            this.drawStyle.stroke = val;
            mouseTool.strokeChanged(val);
        }
    }).extend({throttle: 250});
}
var viewModel = new ViewModel();
ko.applyBindings(viewModel);

