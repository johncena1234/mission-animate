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
        return cls.apply(res, obj.args.map(fromJSON)) || res;
    } else {
        return obj;
    }
}