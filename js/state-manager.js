function StateManager() {
    this.undoStack = ko.observableArray([]);
    this.redoStack = ko.observableArray([]);
    this.canUndo = ko.computed(
        function () { return this.undoStack().length > 0; },
        this);
    this.canRedo = ko.computed(
        function () { return this.redoStack().length > 0; },
        this);
    this.undo = this.undo.bind(this);
    this.redo = this.redo.bind(this);
    this.perform = this.perform.bind(this);
}
StateManager.prototype.undo = function StateManager_undo() {
    if (this.undoStack().length > 0) {
        var performer = this.undoStack.pop();
        performer.undo();
        this.redoStack.push(performer.redo);
    }
};
StateManager.prototype.redo = function StateManager_redo() {
    if (this.redoStack().length > 0) {
        this._perform(this.redoStack.pop());
    }
};
StateManager.prototype.perform = function StateManager_perform(action) {
    this.redoStack.splice(0, this.redoStack().length);
    this._perform(action);
};
StateManager.prototype._perform = function StateManager__perform(action) {
    this.undoStack.push({undo: action(), redo: action});
};
