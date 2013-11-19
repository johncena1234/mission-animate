/*
  See http://snapsvg.io/start/
*/
var state = new StateManager();
var mainSvg = Snap("#svg");

// s will be our drawing surface
var s = mainSvg.group();

// dragArea is on top of s, so we can draw over the whole surface
var dragArea = mainSvg.rect(0,0,500,500);
dragArea.attr({
    fill:"rgba(0,0,0,0)"
});

var undoButton = $('button.undo');
// The undo button starts off disabled
undoButton.attr('disabled', true);
undoButton.on('click', function (event) {
    event.preventDefault();
    var undoCount = state.undo();
    undoButton.attr('disabled', undoCount === 0);
});

var line = null;
var lineStyle = {stroke: "#000", strokeWidth: 10};
dragArea.drag(
    function onMove(dx, dy, x, y, event) {
    	x = parseFloat(line.asPX("x1"));
    	y = parseFloat(line.asPX("y1"));
    	line.attr({x2: x + dx, y2: y + dy});
    },
    function onStart(x, y, event) {
    	line = s.line(event.offsetX,event.offsetY,event.offsetX,event.offsetY);	
    	line.attr(lineStyle);
    },
    function onEnd(x, y, event) {
        var curLine = line.remove();
        function undoLine() {
            curLine.remove();
        }
        function redoLine() {
            s.append(curLine);
            return undoLine;
        }
        state.perform(redoLine);
        undoButton.attr('disabled', false);
    });
