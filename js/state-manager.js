function StateManager() {
    this.undoStack = [];
    this.redoStack = [];
}
StateManager.prototype.undo = function StateManager_undo() {
    if (this.undoStack.length > 0) {
        var performer = this.undoStack.pop();
        performer.undo();
        this.redoStack.push(performer.redo);
    }
    return this.undoStack.length;
};
StateManager.prototype.redo = function StateManager_redo() {
    if (this.redoStack.length > 0) {
        this._perform(this.redoStack.pop());
    }
    return this.redoStack.length;
};
StateManager.prototype.perform = function StateManager_perform(action) {
    this.redoStack.splice(0, this.redoStack.length);
    this._perform(action);
};
StateManager.prototype._perform = function StateManager__perform(action) {
    this.undoStack.push({undo: action(), redo: action});
};
