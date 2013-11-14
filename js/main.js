/*
  See http://snapsvg.io/start/
*/

// First lets create our drawing surface out of existing SVG element
// If you want to create new surface just provide dimensions
// like s = Snap(800, 600);
var s = Snap("#svg");
// Lets create big circle in the middle:
var stickHead = s.circle(250, 70, 50);
// By default its black, lets change its attributes
stickHead.attr({
    fill: "#bada55",
    stroke: "#000",
    strokeWidth: 5
});
var lineStyle = {stroke: "#000", strokeWidth: 10};
var stickBody = s.line(250, 120, 250, 295).attr(lineStyle);
var stickLeftArm = s.line(250, 150, 250-70, 125).attr(lineStyle);
var stickRightArm = s.line(250, 150, 250+70, 125).attr(lineStyle);
var stickLeftLeg = s.line(250, 290, 250-90, 295+100).attr(lineStyle);
var stickRightLeg = s.line(250, 290, 250+90, 295+100).attr(lineStyle);
var stickPerson = s.group(stickHead, stickBody, stickLeftArm, stickRightArm, stickLeftLeg, stickRightLeg);
// stickPerson.animate({transform: "t100 0"}, 2000);
var origTransform = stickPerson.transform().local;
stickPerson.drag(
    function onMove(dx, dy, x, y, event) {
        this.transform(origTransform + ['T', dx, dy].join(' '));
    },
    function onStart(x, y, event) {
        origTransform = stickPerson.transform().local || ['t', 0, 0].join(' ');
    },
    function onEnd(x, y, event) {
    });

