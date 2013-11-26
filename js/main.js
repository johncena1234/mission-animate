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

function ViewModel() {
    var self = this;
    this.tool = ko.observable("pencil");
    this.currentTool = function () {
        return this.tools[this.tool()];
    };
    this.drawStyle = {fill: 'none', stroke: "#000000", strokeWidth: 10, strokeLinecap: 'round'};
    this.eraserStyle = {fill: 'none', stroke: "white", strokeWidth: 10, strokeLinecap: 'round'};
    this.tools = {
        pencil: new PencilTool(this, this.drawStyle),
        eraser: new PencilTool(this, this.eraserStyle),
        line: new LineTool(this, this.drawStyle),
        mouse: new MouseTool(this)
    };
    this.mainSvg = mainSvg;
    this.s = s;
    this.state = state;
    this.changeTool = function changeTool(model, event) {
    	this.tool(event.currentTarget.dataset.tool);
    };
    this.toolClasses = function toolClasses(element) {
        return {active: element.dataset.tool === this.tool()};
    };
    this.undo = function undo() {
        this.tools.mouse.clearSelection();
        self.state.undo(self.s);
    };
    this.redo = function redo() {
        this.tools.mouse.clearSelection();
        self.state.redo(self.s);
    };
    // Knockout won't do css bindings on SVG elements
    this.tool.subscribe(function (tool) {
        dragArea.node.classList.toggle('hide', tool === 'mouse');
        mouseArea.node.classList.toggle('hide', tool !== 'mouse');
        this.tools.mouse.clearSelection();
    }, this);
    this.stroke = ko.computed({
        owner: this,
        read: function readStroke() {
            return this.drawStyle.stroke;
        },
        write: function writeStroke(val) {
            this.drawStyle.stroke = val;
            this.tools.mouse.strokeChanged(val);
        }
    }).extend({throttle: 250});

    function onMove(dx, dy, x, y, event) {
        self.currentTool().onMove(dx, dy, x, y, event);
    }
    function onStart(x, y, event) {
        self.currentTool().onStart(x, y, event);
    }
    function onEnd(x, y, event) {
        self.currentTool().onEnd(x, y, event);
    }
    dragArea.drag(onMove, onStart, onEnd);
    s.drag(onMove, onStart, onEnd);
    mouseArea.drag(onMove, onStart, onEnd);
}
var viewModel = new ViewModel();
ko.applyBindings(viewModel);
