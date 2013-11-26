function StateManager() {
    this.seqNumber = 0;
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
StateManager.prototype.undo = function StateManager_undo(s) {
    if (this.undoStack().length > 0) {
        var performer = this.undoStack.pop();
        performer.undo(s, performer.seq);
        this.redoStack.push(performer.redo);
        this.seqNumber = this.seqNumber - 1;
    }
};
StateManager.prototype.redo = function StateManager_redo(s) {
    if (this.redoStack().length > 0) {
        this.seqNumber = this.seqNumber + 1;
        this._perform(s, this.redoStack.pop());
    }
};
StateManager.prototype.perform = function StateManager_perform(s, action) {
    this.seqNumber = this.seqNumber + 1;
    this.redoStack.splice(0, this.redoStack().length);
    this._perform(s, action);
};
StateManager.prototype._perform = function StateManager__perform(s, action) {
    var seq = this.seqNumber;
    this.undoStack.push({undo: action(s, seq), redo: action, seq: seq});
};

function seqSelector(seq) {
    return '*[data-seq="' + seq + '"]';
}

function forEachSVG(s, sel, f) {
    Array.prototype.forEach.call(s.selectAll(sel), f);
}

function attributesToObject(namedNodeMap, res) {
    if (res === undefined) {
        res = {};
    }
    Array.prototype.forEach.call(namedNodeMap, function (attr) {
        res[attr.name] = attr.value;
    });
    return res;
}

function InsertSVG(elem) {
    function perform(s, seq) {
        var elem = Snap.parse(perform.svgText).select('*');
        elem.node.dataset.seq = seq;
        s.append(elem);
        return undo;
    }
    function undo(s, seq) {
        forEachSVG(
            s,
            seqSelector(seq),
            function (elem) { elem.remove(); });
    }
    perform.svgText = elem.toString();
    return perform;
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
                    this.snap,
                    this.from,
                    this.to));
            this.hasModifications = false;
            this.from = {};
            this.to = {};
        }
    };
}

function ModifySVG(elem, from, to) {
    function perform(s, _seq) {
        forEachSVG(
            s,
            seqSelector(perform.seq),
            function (elem) { elem.attr(perform.to); });
        return undo;
    }
    function undo(s, _seq) {
        forEachSVG(
            s,
            seqSelector(perform.seq),
            function (elem) { elem.attr(perform.from); });
    }
    perform.seq = elem.node.dataset.seq;
    perform.from = from;
    perform.to = to;
    return perform;
}