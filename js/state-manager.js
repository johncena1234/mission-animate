function StateManager(undoStack, redoStack) {
    this.undoStack = ko.observableArray((undoStack || []).slice());
    this.redoStack = ko.observableArray((redoStack || []).slice());
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
StateManager.prototype.copy = function StateManager_copy() {
    return new StateManager(this.undoStack(), this.redoStack());
};
StateManager.prototype.toJSON = function StateManager_toJSON() {
    return {
        op: 'StateManager',
        args: [this.undoStack(), this.redoStack()]
    };
};
StateManager.prototype.undo = function StateManager_undo(s) {
    var seq = this.undoStack().length;
    if (seq > 0) {
        var action = this.undoStack.pop();
        action.undo(s, seq);
        this.redoStack.push(action);
    }
};
StateManager.prototype.cache = function StateManager_cache(s) {
    this.cachedSVG = s.innerSVG();
    return this;
};
StateManager.prototype.restore = function StateManager_restore(s) {
    forEachSVG(s, '*', function (elem) {
        elem.remove();
    });
    if (this.cachedSVG) {
        forEachSVG(Snap.parse(this.cachedSVG), '*', function (elem) {
            s.append(elem);
        });
    } else {
        this.undoStack().forEach(function (action, i) {
            action.redo(s, 1 + i);
        });
    }
    return this;
};
StateManager.prototype.redo = function StateManager_redo(s) {
    if (this.redoStack().length > 0) {
        this._perform(s, this.redoStack.pop());
    }
};
StateManager.prototype.perform = function StateManager_perform(s, action) {
    this.redoStack.splice(0, this.redoStack().length);
    this._perform(s, action);
};
StateManager.prototype._perform = function StateManager__perform(s, action) {
    this.undoStack.push(action);
    action.redo(s, this.undoStack().length);
};

function seqSelector(seq) {
    return '*[data-seq="' + seq + '"]';
}

function forEachSVG(s, sel, f) {
    Array.prototype.forEach.call(s.selectAll(sel), f);
}

function WrapSnap(elem) {
    return {
        node: elem,
        snap: Snap(elem),
        from: {},
        to: {},
        hasModifications: false,
        attr: function WrapSnap_attr(attr, value) {
            if (value === undefined) {
                return this.snap.attr(attr);
            } else {
                if (this.from[attr] === undefined) {
                    this.hasModifications = true;
                    this.from[attr] = this.snap.attr(attr).toString();
                }
                this.to[attr] = value;
                this.snap.attr(attr, value);
            }
        },
        commit: function WrapSnap_commit(s, state) {
            if (!this.hasModifications) return;
            state.perform(s,
                ModifySVG(
                    this.node.dataset.seq,
                    this.from,
                    this.to));
            this.hasModifications = false;
            this.from = {};
            this.to = {};
        }
    };
}

function InsertSVG(svgText) {
    return {
        toJSON: function InsertSVG_toJSON() {
            return {op: 'InsertSVG', args: [svgText]};
        },
        undo: function InsertSVG_undo(s, seq) {
            forEachSVG(
                s,
                seqSelector(seq),
                function (elem) { elem.remove(); });
        },
        redo: function InsertSVG_redo(s, seq) {
            var elem = Snap.parse(svgText).select('*');
            elem.node.dataset.seq = seq;
            s.append(elem);
        }
    };
}

function ModifySVG(seq, from, to) {
    return {
        toJSON: function ModifySVG_toJSON() {
            return {op: 'ModifySVG', args: [seq, from, to]};
        },
        undo: function ModifySVG_undo(s, _seq) {
            forEachSVG(
                s,
                seqSelector(seq),
                function (elem) { elem.attr(from); });
        },
        redo: function ModifySVG_redo(s, _seq) {
            forEachSVG(
                s,
                seqSelector(seq),
                function (elem) { elem.attr(to); });
        }
    };
}
