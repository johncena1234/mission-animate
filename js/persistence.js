var JSONClasses = {
    FrameManager: FrameManager,
    StateManager: StateManager,
    InsertSVG: InsertSVG,
    ModifySVG: ModifySVG
};
function fromJSON(obj) {
    if (typeof obj === 'object' && typeof obj.op === 'string') {
        var cls = JSONClasses[obj.op];
        var res = Object.create(cls.prototype);
        return cls.apply(res, fromJSON(obj.args)) || res;
    } else if (Array.isArray(obj)) {
        return Array.prototype.map.call(obj, fromJSON);
    } else {
        return obj;
    }
}
