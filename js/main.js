/*
  See http://snapsvg.io/start/
*/
var mainSvg = Snap("#svg");

// s will be our drawing surface
var s = mainSvg.select('.draw-area');

// dragArea is on top of s, so we can draw over the whole surface
var dragArea = mainSvg.select('.drag-area');
var mouseArea = mainSvg.select('.mouse-area');

function ViewModel() {
    this.mainSvg = mainSvg;
    this.s = s;
    this.frames = new FrameManager();
    this.drawStyle = {fill: 'none', stroke: "#000000", strokeWidth: 10, strokeLinecap: 'round'};
    this.eraserStyle = {fill: 'none', stroke: "white", strokeWidth: 10, strokeLinecap: 'round'};
    this.tools = {
        pencil: new PencilTool(this, this.drawStyle),
        eraser: new PencilTool(this, this.eraserStyle),
        line: new LineTool(this, this.drawStyle),
        mouse: new MouseTool(this)
    };
    this.tool = ko.observable("pencil");
    this.currentTool = function () {
        return this.tools[this.tool()];
    };
    this.nextFrame = function nextFrame() {
        this.frames.nextFrame(this.s);
    };
    this.prevFrame = function prevFrame() {
        this.frames.prevFrame(this.s);
    };
    this.insertFrame = function insertFrame() {
        this.frames.insertFrame(this.s);
    };
    this.deleteFrame = function deleteFrame() {
        this.frames.deleteFrame(this.s);
    };
    this.changeTool = function changeTool(model, event) {
    	this.tool(event.currentTarget.dataset.tool);
    };
    this.toolClasses = function toolClasses(element) {
        return {active: element.dataset.tool === this.tool()};
    };
    this.undo = function undo() {
        this.tools.mouse.clearSelection();
        this.frames.currentFrame().undo(this.s);
    };
    this.redo = function redo() {
        this.tools.mouse.clearSelection();
        this.frames.currentFrame().redo(this.s);
    };
    this.save = function save() {
        this.tools.mouse.clearSelection();
        var blob = new Blob(
            [JSON.stringify(this.frames)],
            {type: 'text/plain;charset=utf-8'});
        saveAs(blob, 'anim-' + Date.now() + '.json');
    };
    this.load = function load() {
        $('#load-file-input').click();
    };
    this.loadFile = function loadFile(file) {
        var reader = new FileReader();
        var self = this;
        reader.onload = function fileRead() {
            var obj = fromJSON(JSON.parse(this.result));
            self.frames.replaceState(self.s, obj);
        };
        reader.readAsText(file);
    };
    $('#load-file-input').on('change', (function fileChange(event) {
        Array.prototype.forEach.call(event.target.files, this.loadFile, this);
    }).bind(this));

    // Knockout won't do css bindings on SVG elements, so we manually
    // toggle the hide class for the drag areas when the tool changes
    this.tool.subscribe(function toolChanged(tool) {
        dragArea.node.classList.toggle('hide', tool === 'mouse');
        mouseArea.node.classList.toggle('hide', tool !== 'mouse');
        this.tools.mouse.clearSelection();
    }, this);

    // Before the frame changes we need to unselect elements and commit
    // any pending changes from the mouse tool
    this.frames.currentFrame.subscribe(function frameChanged(newFrame) {
        this.tools.mouse.clearSelection();
    }, this, 'beforeChange');

    // Change stroke color of drawStyle
    // and any element selected by the mouse tool
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

    // Attach drag handlers
    function onMove(dx, dy, x, y, event) {
        this.currentTool().onMove(dx, dy, x, y, event);
    }
    function onStart(x, y, event) {
        this.currentTool().onStart(x, y, event);
    }
    function onEnd(x, y, event) {
        this.currentTool().onEnd(x, y, event);
    }
    dragArea.drag(
        onMove, onStart, onEnd,
        this, this, this);
    s.drag(
        onMove, onStart, onEnd,
        this, this, this);
    mouseArea.drag(
        onMove, onStart, onEnd,
        this, this, this);
}
var viewModel = new ViewModel();
ko.applyBindings(viewModel);