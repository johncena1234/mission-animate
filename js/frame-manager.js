function FrameManager(currentFrame, beforeFrames, afterFrames) {
    this.currentFrame = ko.observable(currentFrame || new StateManager());
    this.beforeFrames = ko.observableArray(beforeFrames || []);
    this.afterFrames = ko.observableArray(afterFrames || []);
    this.frameCount = ko.computed({
        owner: this,
        read: function readFrameCount() {
            return 1 + this.beforeFrames().length + this.afterFrames().length;
        }
    });
    this.frameNum = ko.computed({
        owner: this,
        read: function readFrameNum() {
            return 1 + this.beforeFrames().length;
        }
    });
    this.hasPrevFrame = ko.computed({
        owner: this,
        read: function readHasPrevFrame() {
            return this.beforeFrames().length > 0;
        }
    });
    this.hasNextFrame = ko.computed({
        owner: this,
        read: function readHasNextFrame() {
            return this.afterFrames().length > 0;
        }
    });
};

FrameManager.prototype.download = function FrameManager_download() {
    $('#myModal')
        .toggleClass('loading', true)
        .modal({show: true});
    $('#myModal .download-button').prop('disabled', true);
    var canvas = document.createElement('canvas');
    var w = 500;
    var h = 500;
    canvas.width = w;
    canvas.height = h;
    var gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: window.URL.createObjectURL(GIF_WORKER_BLOB),
        width: w,
        height: h});
    gif.on('finished', function(blob) {
        $('#myModal').toggleClass('loading', false);
        $('#myModal img.modal-img')
            .attr('src', window.URL.createObjectURL(blob));
        $('#myModal .download-button')
            .prop('disabled', false)
            .data('blob', blob);
    });
    var frameQueue = this.beforeFrames().concat(
        [this.currentFrame()],
        this.afterFrames().slice().reverse());
    var i = 0;
    function renderOneFrame() {
        $('#myModal .percent-done').text((100 * i/(1 + frameQueue.length)).toFixed(0) + '%');
        if (i < frameQueue.length) {
            var frame = frameQueue[i];
            canvg(canvas, frame.render(w, h));
            gif.addFrame(canvas, {copy: true, delay: 100});
            i += 1;
            window.setTimeout(renderOneFrame, 0);
        } else {
            gif.render();
        }
    }
    renderOneFrame();
};

FrameManager.prototype.insertFrame = function FrameManager_insertFrame(s) {
    var oldFrame = this.currentFrame();
    var frame = oldFrame.copy();
    this.currentFrame(frame);
    this.beforeFrames.push(oldFrame);
    oldFrame.cache(s);
};
FrameManager.prototype.deleteFrame = function FrameManager_deleteFrame(s) {
    var frame = this.afterFrames.pop() || this.beforeFrames.pop() || new StateManager();
    this.currentFrame(frame);
    frame.restore(s);
};
FrameManager.prototype.nextFrame = function FrameManager_nextFrame(s) {
    var frame = this.afterFrames.pop();
    if (frame !== undefined) {
        var oldFrame = this.currentFrame();
        this.currentFrame(frame);
        this.beforeFrames.push(oldFrame);
        oldFrame.cache(s);
        frame.restore(s);
    }
};
FrameManager.prototype.prevFrame = function FrameManager_prevFrame(s) {
    var frame = this.beforeFrames.pop();
    if (frame !== undefined) {
        var oldFrame = this.currentFrame();
        this.currentFrame(frame);
        this.afterFrames.push(oldFrame);
        oldFrame.cache(s);
        frame.restore(s);
    }
};
FrameManager.prototype.replaceState = function FrameManager_replaceState(s, other) {
    this.beforeFrames(other.beforeFrames());
    this.afterFrames(other.afterFrames());
    this.currentFrame(other.currentFrame());
    this.currentFrame().restore(s);
};
FrameManager.prototype.toJSON = function FrameManager_toJSON() {
    return {
        op: 'FrameManager',
        args: [this.currentFrame(), this.beforeFrames(), this.afterFrames()]
    }
};
