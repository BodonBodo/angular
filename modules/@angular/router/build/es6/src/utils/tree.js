export class Tree {
    constructor(root) {
        this._root = root;
    }
    get root() { return this._root.value; }
    parent(t) {
        const p = this.pathFromRoot(t);
        return p.length > 1 ? p[p.length - 2] : null;
    }
    children(t) {
        const n = findNode(t, this._root);
        return n ? n.children.map(t => t.value) : [];
    }
    firstChild(t) {
        const n = findNode(t, this._root);
        return n && n.children.length > 0 ? n.children[0].value : null;
    }
    siblings(t) {
        const p = findPath(t, this._root, []);
        if (p.length < 2)
            return [];
        const c = p[p.length - 2].children.map(c => c.value);
        return c.filter(cc => cc !== t);
    }
    pathFromRoot(t) { return findPath(t, this._root, []).map(s => s.value); }
    contains(tree) { return contains(this._root, tree._root); }
}
export function rootNode(tree) {
    return tree._root;
}
function findNode(expected, c) {
    if (expected === c.value)
        return c;
    for (let cc of c.children) {
        const r = findNode(expected, cc);
        if (r)
            return r;
    }
    return null;
}
function findPath(expected, c, collected) {
    collected.push(c);
    if (expected === c.value)
        return collected;
    for (let cc of c.children) {
        const cloned = collected.slice(0);
        const r = findPath(expected, cc, cloned);
        if (r)
            return r;
    }
    return [];
}
function contains(tree, subtree) {
    if (tree.value !== subtree.value)
        return false;
    for (let subtreeNode of subtree.children) {
        const s = tree.children.filter(child => child.value === subtreeNode.value);
        if (s.length === 0)
            return false;
        if (!contains(s[0], subtreeNode))
            return false;
    }
    return true;
}
export class TreeNode {
    constructor(value, children) {
        this.value = value;
        this.children = children;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy91dGlscy90cmVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0lBSUUsWUFBWSxJQUFpQjtRQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQUMsQ0FBQztJQUVyRCxJQUFJLElBQUksS0FBUSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBRTFDLE1BQU0sQ0FBQyxDQUFJO1FBQ1QsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQixNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQy9DLENBQUM7SUFFRCxRQUFRLENBQUMsQ0FBSTtRQUNYLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDL0MsQ0FBQztJQUVELFVBQVUsQ0FBQyxDQUFJO1FBQ2IsTUFBTSxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ2pFLENBQUM7SUFFRCxRQUFRLENBQUMsQ0FBSTtRQUNYLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FB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QUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNqRCxDQUFDO0lBRUQsTUFBTSxDQUFDLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRDtJQUNFLFlBQW1CLEtBQVEsRUFBUyxRQUF1QjtRQUF4QyxVQUFLLEdBQUwsS0FBSyxDQUFHO1FBQVMsYUFBUSxHQUFSLFFBQVEsQ0FBZTtJQUFHLENBQUM7QUFDakUsQ0FBQztBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIFRyZWU8VD4ge1xuICAvKiogQGludGVybmFsICovXG4gIF9yb290OiBUcmVlTm9kZTxUPjtcblxuICBjb25zdHJ1Y3Rvcihyb290OiBUcmVlTm9kZTxUPikgeyB0aGlzLl9yb290ID0gcm9vdDsgfVxuXG4gIGdldCByb290KCk6IFQgeyByZXR1cm4gdGhpcy5fcm9vdC52YWx1ZTsgfVxuXG4gIHBhcmVudCh0OiBUKTogVCB8IG51bGwge1xuICAgIGNvbnN0IHAgPSB0aGlzLnBhdGhGcm9tUm9vdCh0KTtcbiAgICByZXR1cm4gcC5sZW5ndGggPiAxID8gcFtwLmxlbmd0aCAtIDJdIDogbnVsbDtcbiAgfVxuXG4gIGNoaWxkcmVuKHQ6IFQpOiBUW10ge1xuICAgIGNvbnN0IG4gPSBmaW5kTm9kZSh0LCB0aGlzLl9yb290KTtcbiAgICByZXR1cm4gbiA/IG4uY2hpbGRyZW4ubWFwKHQgPT4gdC52YWx1ZSkgOiBbXTtcbiAgfVxuXG4gIGZpcnN0Q2hpbGQodDogVCk6IFQgfCBudWxsIHtcbiAgICBjb25zdCBuID0gZmluZE5vZGUodCwgdGhpcy5fcm9vdCk7XG4gICAgcmV0dXJuIG4gJiYgbi5jaGlsZHJlbi5sZW5ndGggPiAwID8gbi5jaGlsZHJlblswXS52YWx1ZSA6IG51bGw7XG4gIH1cblxuICBzaWJsaW5ncyh0OiBUKTogVFtdIHtcbiAgICBjb25zdCBwID0gZmluZFBhdGgodCwgdGhpcy5fcm9vdCwgW10pO1xuICAgIGlmIChwLmxlbmd0aCA8IDIpIHJldHVybiBbXTtcblxuICAgIGNvbnN0IGMgPSBwW3AubGVuZ3RoIC0gMl0uY2hpbGRyZW4ubWFwKGMgPT4gYy52YWx1ZSk7XG4gICAgcmV0dXJuIGMuZmlsdGVyKGNjID0+IGNjICE9PSB0KTtcbiAgfVxuXG4gIHBhdGhGcm9tUm9vdCh0OiBUKTogVFtdIHsgcmV0dXJuIGZpbmRQYXRoKHQsIHRoaXMuX3Jvb3QsIFtdKS5tYXAocyA9PiBzLnZhbHVlKTsgfVxuXG4gIGNvbnRhaW5zKHRyZWU6IFRyZWU8VD4pOiBib29sZWFuIHsgcmV0dXJuIGNvbnRhaW5zKHRoaXMuX3Jvb3QsIHRyZWUuX3Jvb3QpOyB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByb290Tm9kZTxUPih0cmVlOiBUcmVlPFQ+KTogVHJlZU5vZGU8VD4ge1xuICByZXR1cm4gdHJlZS5fcm9vdDtcbn1cblxuZnVuY3Rpb24gZmluZE5vZGU8VD4oZXhwZWN0ZWQ6IFQsIGM6IFRyZWVOb2RlPFQ+KTogVHJlZU5vZGU8VD4gfCBudWxsIHtcbiAgaWYgKGV4cGVjdGVkID09PSBjLnZhbHVlKSByZXR1cm4gYztcbiAgZm9yIChsZXQgY2Mgb2YgYy5jaGlsZHJlbikge1xuICAgIGNvbnN0IHIgPSBmaW5kTm9kZShleHBlY3RlZCwgY2MpO1xuICAgIGlmIChyKSByZXR1cm4gcjtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZmluZFBhdGg8VD4oZXhwZWN0ZWQ6IFQsIGM6IFRyZWVOb2RlPFQ+LCBjb2xsZWN0ZWQ6IFRyZWVOb2RlPFQ+W10pOiBUcmVlTm9kZTxUPltdIHtcbiAgY29sbGVjdGVkLnB1c2goYyk7XG4gIGlmIChleHBlY3RlZCA9PT0gYy52YWx1ZSkgcmV0dXJuIGNvbGxlY3RlZDtcblxuICBmb3IgKGxldCBjYyBvZiBjLmNoaWxkcmVuKSB7XG4gICAgY29uc3QgY2xvbmVkID0gY29sbGVjdGVkLnNsaWNlKDApO1xuICAgIGNvbnN0IHIgPSBmaW5kUGF0aChleHBlY3RlZCwgY2MsIGNsb25lZCk7XG4gICAgaWYgKHIpIHJldHVybiByO1xuICB9XG5cbiAgcmV0dXJuIFtdO1xufVxuXG5mdW5jdGlvbiBjb250YWluczxUPih0cmVlOiBUcmVlTm9kZTxUPiwgc3VidHJlZTogVHJlZU5vZGU8VD4pOiBib29sZWFuIHtcbiAgaWYgKHRyZWUudmFsdWUgIT09IHN1YnRyZWUudmFsdWUpIHJldHVybiBmYWxzZTtcblxuICBmb3IgKGxldCBzdWJ0cmVlTm9kZSBvZiBzdWJ0cmVlLmNoaWxkcmVuKSB7XG4gICAgY29uc3QgcyA9IHRyZWUuY2hpbGRyZW4uZmlsdGVyKGNoaWxkID0+IGNoaWxkLnZhbHVlID09PSBzdWJ0cmVlTm9kZS52YWx1ZSk7XG4gICAgaWYgKHMubGVuZ3RoID09PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKCFjb250YWlucyhzWzBdLCBzdWJ0cmVlTm9kZSkpIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgY2xhc3MgVHJlZU5vZGU8VD4ge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdmFsdWU6IFQsIHB1YmxpYyBjaGlsZHJlbjogVHJlZU5vZGU8VD5bXSkge31cbn0iXX0=