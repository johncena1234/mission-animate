function PencilTool(viewModel, style) {
    this.viewModel = viewModel;
    this.style = style;
}
PencilTool.prototype.line = null;
PencilTool.prototype.onStart = function PencilTool_onStart(x, y, event) {
    x = event.offsetX;
    y = event.offsetY;
    this.line = s.path(['M', x, y].join(' '));
    this.line.data('points', [x, y]);
    this.line.attr(this.style);
};
PencilTool.prototype.onMove = function PencilTool_onMove(dx, dy, x, y, event) {
    if (this.line === null) {
        return;
    }
    var points = this.line.data('points');
    points.push(points[0] + dx, points[1] + dy);
    this.line.attr('path', ['M', points[0], points[1], 'R'].concat(points).join(' '));
};
PencilTool.prototype.onEnd = function PencilTool_onEnd(x, y, event) {
    if (this.line === null) {
        return;
    }
    this.viewModel.frames.currentFrame().perform(
        this.viewModel.s,
        InsertSVG(this.line.remove().toString()));
    this.line = null;
};

function LineTool() {
    PencilTool.apply(this, arguments);
}
LineTool.prototype = Object.create(PencilTool.prototype);
LineTool.prototype.onMove = function LineTool_onMove(dx, dy, x, y, event) {
    if (this.line === null) {
        return;
    }
    var points = this.line.data('points');
    points.splice(2, 2, points[0] + dx, points[1] + dy);
    this.line.attr('path', ['M', points[0], points[1], 'L'].concat(points).join(' '));
}

function MouseTool(viewModel) {
    this.viewModel = viewModel;
}
MouseTool.prototype.target = null;
MouseTool.prototype.origTransform = null;
MouseTool.prototype.onStart = function MouseTool_onStart(x, y, event) {
    this.clearSelection();
    if (event.target.classList.contains('mouse-area')) {
        return;
    }
    this.target = WrapSnap(event.target);
    this.origTransform = this.target.attr('transform').toString();
    this.target.node.classList.add('selected');
};
MouseTool.prototype.onMove = function MouseTool_onMove(dx, dy, x, y, event) {
    if (this.target === null) {
        return;
    }
    this.target.attr('transform', this.origTransform + 't' + [dx, dy].join(','));
};
MouseTool.prototype.onEnd = function MouseTool_onEnd(x, y, event) {
    if (this.target === null) {
        return;
    }
    this.target.commit(this.viewModel.s, this.viewModel.frames.currentFrame());
};
MouseTool.prototype.strokeChanged = function MouseTool_strokeChanged(newStroke) {
    if (this.target === null) {
        return;
    }
    this.target.attr('stroke', newStroke);
};
MouseTool.prototype.clearSelection = function MouseTool_clearSelection() {
    if (this.target === null) {
        return;
    }
    this.target.commit(s, this.viewModel.frames.currentFrame());
    this.target.node.classList.remove('selected');
    this.target = null;
    this.origTransform = null;
};
