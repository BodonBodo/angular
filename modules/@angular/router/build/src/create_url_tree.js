"use strict";
var url_tree_1 = require('./url_tree');
var tree_1 = require('./utils/tree');
var collection_1 = require('./utils/collection');
var shared_1 = require('./shared');
function createUrlTree(route, urlTree, commands, queryParameters, fragment) {
    if (commands.length === 0) {
        return tree(tree_1.rootNode(urlTree), urlTree, queryParameters, fragment);
    }
    var normalizedCommands = normalizeCommands(commands);
    if (navigateToRoot(normalizedCommands)) {
        return tree(new tree_1.TreeNode(urlTree.root, []), urlTree, queryParameters, fragment);
    }
    var startingNode = findStartingNode(normalizedCommands, urlTree, route);
    var updated = normalizedCommands.commands.length > 0 ?
        updateMany(startingNode.children.slice(0), normalizedCommands.commands) :
        [];
    var newRoot = constructNewTree(tree_1.rootNode(urlTree), startingNode, updated);
    return tree(newRoot, urlTree, queryParameters, fragment);
}
exports.createUrlTree = createUrlTree;
function tree(root, urlTree, queryParameters, fragment) {
    var q = queryParameters ? stringify(queryParameters) : urlTree.queryParameters;
    var f = fragment ? fragment : urlTree.fragment;
    return new url_tree_1.UrlTree(root, q, f);
}
function navigateToRoot(normalizedChange) {
    return normalizedChange.isAbsolute && normalizedChange.commands.length === 1 &&
        normalizedChange.commands[0] == "/";
}
var NormalizedNavigationCommands = (function () {
    function NormalizedNavigationCommands(isAbsolute, numberOfDoubleDots, commands) {
        this.isAbsolute = isAbsolute;
        this.numberOfDoubleDots = numberOfDoubleDots;
        this.commands = commands;
    }
    return NormalizedNavigationCommands;
}());
function normalizeCommands(commands) {
    if ((typeof commands[0] === "string") && commands.length === 1 && commands[0] == "/") {
        return new NormalizedNavigationCommands(true, 0, commands);
    }
    var numberOfDoubleDots = 0;
    var isAbsolute = false;
    var res = [];
    for (var i = 0; i < commands.length; ++i) {
        var c = commands[i];
        if (!(typeof c === "string")) {
            res.push(c);
            continue;
        }
        var parts = c.split('/');
        for (var j = 0; j < parts.length; ++j) {
            var cc = parts[j];
            if (i == 0) {
                if (j == 0 && cc == ".") {
                }
                else if (j == 0 && cc == "") {
                    isAbsolute = true;
                }
                else if (cc == "..") {
                    numberOfDoubleDots++;
                }
                else if (cc != '') {
                    res.push(cc);
                }
            }
            else {
                if (cc != '') {
                    res.push(cc);
                }
            }
        }
    }
    return new NormalizedNavigationCommands(isAbsolute, numberOfDoubleDots, res);
}
function findStartingNode(normalizedChange, urlTree, route) {
    if (normalizedChange.isAbsolute) {
        return tree_1.rootNode(urlTree);
    }
    else {
        var urlSegment = findUrlSegment(route, urlTree, normalizedChange.numberOfDoubleDots);
        return findMatchingNode(urlSegment, tree_1.rootNode(urlTree));
    }
}
function findUrlSegment(route, urlTree, numberOfDoubleDots) {
    var segments = route.urlSegments.value;
    var urlSegment = segments[segments.length - 1];
    var path = urlTree.pathFromRoot(urlSegment);
    if (path.length <= numberOfDoubleDots) {
        throw new Error("Invalid number of '../'");
    }
    return path[path.length - 1 - numberOfDoubleDots];
}
function findMatchingNode(segment, node) {
    if (node.value === segment)
        return node;
    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
        var c = _a[_i];
        var r = findMatchingNode(segment, c);
        if (r)
            return r;
    }
    throw new Error("Cannot find url segment '" + segment + "'");
}
function constructNewTree(node, original, updated) {
    if (node === original) {
        return new tree_1.TreeNode(node.value, updated);
    }
    else {
        return new tree_1.TreeNode(node.value, node.children.map(function (c) { return constructNewTree(c, original, updated); }));
    }
}
function updateMany(nodes, commands) {
    var outlet = getOutlet(commands);
    var nodesInRightOutlet = nodes.filter(function (c) { return c.value.outlet === outlet; });
    if (nodesInRightOutlet.length > 0) {
        var nodeRightOutlet = nodesInRightOutlet[0];
        nodes[nodes.indexOf(nodeRightOutlet)] = update(nodeRightOutlet, commands);
    }
    else {
        nodes.push(update(null, commands));
    }
    return nodes;
}
function getPath(commands) {
    if (!(typeof commands[0] === "string"))
        return commands[0];
    var parts = commands[0].toString().split(":");
    return parts.length > 1 ? parts[1] : commands[0];
}
function getOutlet(commands) {
    if (!(typeof commands[0] === "string"))
        return shared_1.PRIMARY_OUTLET;
    var parts = commands[0].toString().split(":");
    return parts.length > 1 ? parts[0] : shared_1.PRIMARY_OUTLET;
}
function update(node, commands) {
    var rest = commands.slice(1);
    var next = rest.length === 0 ? null : rest[0];
    var outlet = getOutlet(commands);
    var path = getPath(commands);
    if (!node && !(typeof next === 'object')) {
        var urlSegment = new url_tree_1.UrlSegment(path, {}, outlet);
        var children = rest.length === 0 ? [] : [update(null, rest)];
        return new tree_1.TreeNode(urlSegment, children);
    }
    else if (!node && typeof next === 'object') {
        var urlSegment = new url_tree_1.UrlSegment(path, stringify(next), outlet);
        return recurse(urlSegment, node, rest.slice(1));
    }
    else if (node && outlet !== node.value.outlet) {
        return node;
    }
    else if (node && typeof path === 'object') {
        var newSegment = new url_tree_1.UrlSegment(node.value.path, stringify(path), node.value.outlet);
        return recurse(newSegment, node, rest);
    }
    else if (node && typeof next === 'object' && compare(path, stringify(next), node.value)) {
        return recurse(node.value, node, rest.slice(1));
    }
    else if (node && typeof next === 'object') {
        var urlSegment = new url_tree_1.UrlSegment(path, stringify(next), outlet);
        return recurse(urlSegment, node, rest.slice(1));
    }
    else if (node && compare(path, {}, node.value)) {
        return recurse(node.value, node, rest);
    }
    else {
        var urlSegment = new url_tree_1.UrlSegment(path, {}, outlet);
        return recurse(urlSegment, node, rest);
    }
}
function stringify(params) {
    var res = {};
    collection_1.forEach(params, function (v, k) { return res[k] = v.toString(); });
    return res;
}
function compare(path, params, segment) {
    return path == segment.path && collection_1.shallowEqual(params, segment.parameters);
}
function recurse(urlSegment, node, rest) {
    if (rest.length === 0) {
        return new tree_1.TreeNode(urlSegment, []);
    }
    var children = node ? node.children.slice(0) : [];
    return new tree_1.TreeNode(urlSegment, updateMany(children, rest));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlX3VybF90cmVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NyZWF0ZV91cmxfdHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEseUJBQXNELFlBQVksQ0FBQyxDQUFBO0FBQ25FLHFCQUFtQyxjQUFjLENBQUMsQ0FBQTtBQUNsRCwyQkFBc0Msb0JBQW9CLENBQUMsQ0FBQTtBQUUzRCx1QkFBdUMsVUFBVSxDQUFDLENBQUE7QUFFbEQsdUJBQThCLEtBQXFCLEVBQUUsT0FBZ0IsRUFBRSxRQUFlLEVBQ3hELGVBQW1DLEVBQUUsUUFBNEI7SUFDN0YsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELElBQU0sa0JBQWtCLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkQsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxlQUFRLENBQWEsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzlGLENBQUM7SUFFRCxJQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDMUUsSUFBTSxPQUFPLEdBQUcsa0JBQWtCLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDO1FBQ2xELFVBQVUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxRQUFRLENBQUM7UUFD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RUFBRSxDQUFDLElBQUssT0FBQSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFyQixDQUFxQixDQUFDLENBQUM7SUFDakQsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFFRCxpQkFBaUIsSUFBWSxFQUFFLE1BQTRCLEVBQUUsT0FBbUI7SUFDOUUsTUFBTSxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsSUFBSSxJQUFJLHlCQUFZLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMxRSxDQUFDO0FBRUQsaUJBQWlCLFVBQXNCLEVBQUUsSUFBaUMsRUFDeEQsSUFBVztJQUMzQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsTUFBTSxDQUFDLElBQUksZUFBUSxDQUFhLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBQ0QsSUFBTSxRQUFRLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNwRCxNQUFNLENBQUMsSUFBSSxlQUFRLENBQWEsVUFBVSxFQUFFLFVBQVUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMxRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVXJsVHJlZSwgVXJsU2VnbWVudCwgZXF1YWxVcmxTZWdtZW50cyB9IGZyb20gJy4vdXJsX3RyZWUnO1xuaW1wb3J0IHsgVHJlZU5vZGUsIHJvb3ROb2RlIH0gZnJvbSAnLi91dGlscy90cmVlJztcbmltcG9ydCB7IGZvckVhY2gsIHNoYWxsb3dFcXVhbCB9IGZyb20gJy4vdXRpbHMvY29sbGVjdGlvbic7XG5pbXBvcnQgeyBSb3V0ZXJTdGF0ZSwgQWN0aXZhdGVkUm91dGUgfSBmcm9tICcuL3JvdXRlcl9zdGF0ZSc7XG5pbXBvcnQgeyBQYXJhbXMsIFBSSU1BUllfT1VUTEVUIH0gZnJvbSAnLi9zaGFyZWQnO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVXJsVHJlZShyb3V0ZTogQWN0aXZhdGVkUm91dGUsIHVybFRyZWU6IFVybFRyZWUsIGNvbW1hbmRzOiBhbnlbXSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeVBhcmFtZXRlcnM6IFBhcmFtcyB8IHVuZGVmaW5lZCwgZnJhZ21lbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IFVybFRyZWUge1xuICBpZiAoY29tbWFuZHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHRyZWUocm9vdE5vZGUodXJsVHJlZSksIHVybFRyZWUsIHF1ZXJ5UGFyYW1ldGVycywgZnJhZ21lbnQpO1xuICB9XG5cbiAgY29uc3Qgbm9ybWFsaXplZENvbW1hbmRzID0gbm9ybWFsaXplQ29tbWFuZHMoY29tbWFuZHMpO1xuICBpZiAobmF2aWdhdGVUb1Jvb3Qobm9ybWFsaXplZENvbW1hbmRzKSkge1xuICAgIHJldHVybiB0cmVlKG5ldyBUcmVlTm9kZTxVcmxTZWdtZW50Pih1cmxUcmVlLnJvb3QsIFtdKSwgdXJsVHJlZSwgcXVlcnlQYXJhbWV0ZXJzLCBmcmFnbWVudCk7XG4gIH1cblxuICBjb25zdCBzdGFydGluZ05vZGUgPSBmaW5kU3RhcnRpbmdOb2RlKG5vcm1hbGl6ZWRDb21tYW5kcywgdXJsVHJlZSwgcm91dGUpO1xuICBjb25zdCB1cGRhdGVkID0gbm9ybWFsaXplZENvbW1hbmRzLmNvbW1hbmRzLmxlbmd0aCA+IDAgP1xuICAgICAgdXBkYXRlTWFueShzdGFydGluZ05vZGUuY2hpbGRyZW4uc2xpY2UoMCksIG5vcm1hbGl6ZWRDb21tYW5kcy5jb21tYW5kcykgOlxuICAgICAgW107XG4gIGNvbnN0IG5ld1Jvb3QgPSBjb25zdHJ1Y3ROZXdUcmVlKHJvb3ROb2RlKHVybFRyZWUpLCBzdGFydGluZ05vZGUsIHVwZGF0ZWQpO1xuXG4gIHJldHVybiB0cmVlKG5ld1Jvb3QsIHVybFRyZWUsIHF1ZXJ5UGFyYW1ldGVycywgZnJhZ21lbnQpO1xufVxuXG5mdW5jdGlvbiB0cmVlKHJvb3Q6IFRyZWVOb2RlPFVybFNlZ21lbnQ+LCB1cmxUcmVlOiBVcmxUcmVlLCBxdWVyeVBhcmFtZXRlcnM6IFBhcmFtcyB8IHVuZGVmaW5lZCwgZnJhZ21lbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IFVybFRyZWUge1xuICBjb25zdCBxID0gcXVlcnlQYXJhbWV0ZXJzID8gc3RyaW5naWZ5KHF1ZXJ5UGFyYW1ldGVycykgOiB1cmxUcmVlLnF1ZXJ5UGFyYW1ldGVycztcbiAgY29uc3QgZiA9IGZyYWdtZW50ID8gZnJhZ21lbnQgOiB1cmxUcmVlLmZyYWdtZW50O1xuICByZXR1cm4gbmV3IFVybFRyZWUocm9vdCwgcSwgZik7XG59XG5cbmZ1bmN0aW9uIG5hdmlnYXRlVG9Sb290KG5vcm1hbGl6ZWRDaGFuZ2U6IE5vcm1hbGl6ZWROYXZpZ2F0aW9uQ29tbWFuZHMpOiBib29sZWFuIHtcbiAgcmV0dXJuIG5vcm1hbGl6ZWRDaGFuZ2UuaXNBYnNvbHV0ZSAmJiBub3JtYWxpemVkQ2hhbmdlLmNvbW1hbmRzLmxlbmd0aCA9PT0gMSAmJlxuICAgIG5vcm1hbGl6ZWRDaGFuZ2UuY29tbWFuZHNbMF0gPT0gXCIvXCI7XG59XG5cbmNsYXNzIE5vcm1hbGl6ZWROYXZpZ2F0aW9uQ29tbWFuZHMge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgaXNBYnNvbHV0ZTogYm9vbGVhbiwgcHVibGljIG51bWJlck9mRG91YmxlRG90czogbnVtYmVyLFxuICAgICAgICAgICAgICBwdWJsaWMgY29tbWFuZHM6IGFueVtdKSB7fVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVDb21tYW5kcyhjb21tYW5kczogYW55W10pOiBOb3JtYWxpemVkTmF2aWdhdGlvbkNvbW1hbmRzIHtcbiAgaWYgKCh0eXBlb2YgY29tbWFuZHNbMF0gPT09IFwic3RyaW5nXCIpICYmIGNvbW1hbmRzLmxlbmd0aCA9PT0gMSAmJiBjb21tYW5kc1swXSA9PSBcIi9cIikge1xuICAgIHJldHVybiBuZXcgTm9ybWFsaXplZE5hdmlnYXRpb25Db21tYW5kcyh0cnVlLCAwLCBjb21tYW5kcyk7XG4gIH1cblxuICBsZXQgbnVtYmVyT2ZEb3VibGVEb3RzID0gMDtcbiAgbGV0IGlzQWJzb2x1dGUgPSBmYWxzZTtcbiAgY29uc3QgcmVzID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21tYW5kcy5sZW5ndGg7ICsraSkge1xuICAgIGNvbnN0IGMgPSBjb21tYW5kc1tpXTtcblxuICAgIGlmICghKHR5cGVvZiBjID09PSBcInN0cmluZ1wiKSkge1xuICAgICAgcmVzLnB1c2goYyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBwYXJ0cyA9IGMuc3BsaXQoJy8nKTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnRzLmxlbmd0aDsgKytqKSB7XG4gICAgICBsZXQgY2MgPSBwYXJ0c1tqXTtcblxuICAgICAgLy8gZmlyc3QgZXhwIGlzIHRyZWF0ZWQgaW4gYSBzcGVjaWFsIHdheVxuICAgICAgaWYgKGkgPT0gMCkge1xuICAgICAgICBpZiAoaiA9PSAwICYmIGNjID09IFwiLlwiKSB7ICAvLyAgJy4vYSdcbiAgICAgICAgICAvLyBza2lwIGl0XG4gICAgICAgIH0gZWxzZSBpZiAoaiA9PSAwICYmIGNjID09IFwiXCIpIHsgIC8vICAnL2EnXG4gICAgICAgICAgaXNBYnNvbHV0ZSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAoY2MgPT0gXCIuLlwiKSB7ICAvLyAgJy4uL2EnXG4gICAgICAgICAgbnVtYmVyT2ZEb3VibGVEb3RzKys7XG4gICAgICAgIH0gZWxzZSBpZiAoY2MgIT0gJycpIHtcbiAgICAgICAgICByZXMucHVzaChjYyk7XG4gICAgICAgIH1cblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNjICE9ICcnKSB7XG4gICAgICAgICAgcmVzLnB1c2goY2MpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBOb3JtYWxpemVkTmF2aWdhdGlvbkNvbW1hbmRzKGlzQWJzb2x1dGUsIG51bWJlck9mRG91YmxlRG90cywgcmVzKTtcbn1cblxuZnVuY3Rpb24gZmluZFN0YXJ0aW5nTm9kZShub3JtYWxpemVkQ2hhbmdlOiBOb3JtYWxpemVkTmF2aWdhdGlvbkNvbW1hbmRzLCB1cmxUcmVlOiBVcmxUcmVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgcm91dGU6IEFjdGl2YXRlZFJvdXRlKTogVHJlZU5vZGU8VXJsU2VnbWVudD4ge1xuICBpZiAobm9ybWFsaXplZENoYW5nZS5pc0Fic29sdXRlKSB7XG4gICAgcmV0dXJuIHJvb3ROb2RlKHVybFRyZWUpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHVybFNlZ21lbnQgPVxuICAgICAgZmluZFVybFNlZ21lbnQocm91dGUsIHVybFRyZWUsIG5vcm1hbGl6ZWRDaGFuZ2UubnVtYmVyT2ZEb3VibGVEb3RzKTtcbiAgICByZXR1cm4gZmluZE1hdGNoaW5nTm9kZSh1cmxTZWdtZW50LCByb290Tm9kZSh1cmxUcmVlKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmluZFVybFNlZ21lbnQocm91dGU6IEFjdGl2YXRlZFJvdXRlLCB1cmxUcmVlOiBVcmxUcmVlLCBudW1iZXJPZkRvdWJsZURvdHM6IG51bWJlcik6IFVybFNlZ21lbnQge1xuICBjb25zdCBzZWdtZW50cyA9ICg8YW55PnJvdXRlLnVybFNlZ21lbnRzKS52YWx1ZTtcbiAgY29uc3QgdXJsU2VnbWVudCA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdO1xuICBjb25zdCBwYXRoID0gdXJsVHJlZS5wYXRoRnJvbVJvb3QodXJsU2VnbWVudCk7XG4gIGlmIChwYXRoLmxlbmd0aCA8PSBudW1iZXJPZkRvdWJsZURvdHMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIG51bWJlciBvZiAnLi4vJ1wiKTtcbiAgfVxuICByZXR1cm4gcGF0aFtwYXRoLmxlbmd0aCAtIDEgLSBudW1iZXJPZkRvdWJsZURvdHNdO1xufVxuXG5mdW5jdGlvbiBmaW5kTWF0Y2hpbmdOb2RlKHNlZ21lbnQ6IFVybFNlZ21lbnQsIG5vZGU6IFRyZWVOb2RlPFVybFNlZ21lbnQ+KTogVHJlZU5vZGU8VXJsU2VnbWVudD4ge1xuICBpZiAobm9kZS52YWx1ZSA9PT0gc2VnbWVudCkgcmV0dXJuIG5vZGU7XG4gIGZvciAobGV0IGMgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgIGNvbnN0IHIgPSBmaW5kTWF0Y2hpbmdOb2RlKHNlZ21lbnQsIGMpO1xuICAgIGlmIChyKSByZXR1cm4gcjtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBmaW5kIHVybCBzZWdtZW50ICcke3NlZ21lbnR9J2ApO1xufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3ROZXdUcmVlKG5vZGU6IFRyZWVOb2RlPFVybFNlZ21lbnQ+LCBvcmlnaW5hbDogVHJlZU5vZGU8VXJsU2VnbWVudD4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZWQ6IFRyZWVOb2RlPFVybFNlZ21lbnQ+W10pOiBUcmVlTm9kZTxVcmxTZWdtZW50PiB7XG4gIGlmIChub2RlID09PSBvcmlnaW5hbCkge1xuICAgIHJldHVybiBuZXcgVHJlZU5vZGU8VXJsU2VnbWVudD4obm9kZS52YWx1ZSwgdXBkYXRlZCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBUcmVlTm9kZTxVcmxTZWdtZW50PihcbiAgICAgIG5vZGUudmFsdWUsIG5vZGUuY2hpbGRyZW4ubWFwKGMgPT4gY29uc3RydWN0TmV3VHJlZShjLCBvcmlnaW5hbCwgdXBkYXRlZCkpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVNYW55KG5vZGVzOiBUcmVlTm9kZTxVcmxTZWdtZW50PltdLCBjb21tYW5kczogYW55W10pOiBUcmVlTm9kZTxVcmxTZWdtZW50PltdIHtcbiAgY29uc3Qgb3V0bGV0ID0gZ2V0T3V0bGV0KGNvbW1hbmRzKTtcbiAgY29uc3Qgbm9kZXNJblJpZ2h0T3V0bGV0ID0gbm9kZXMuZmlsdGVyKGMgPT4gYy52YWx1ZS5vdXRsZXQgPT09IG91dGxldCk7XG4gIGlmIChub2Rlc0luUmlnaHRPdXRsZXQubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IG5vZGVSaWdodE91dGxldCA9IG5vZGVzSW5SaWdodE91dGxldFswXTsgIC8vIHRoZXJlIGNhbiBiZSBvbmx5IG9uZVxuICAgIG5vZGVzW25vZGVzLmluZGV4T2Yobm9kZVJpZ2h0T3V0bGV0KV0gPSB1cGRhdGUobm9kZVJpZ2h0T3V0bGV0LCBjb21tYW5kcyk7XG4gIH0gZWxzZSB7XG4gICAgbm9kZXMucHVzaCh1cGRhdGUobnVsbCwgY29tbWFuZHMpKTtcbiAgfVxuICByZXR1cm4gbm9kZXM7XG59XG5cbmZ1bmN0aW9uIGdldFBhdGgoY29tbWFuZHM6IGFueVtdKTogYW55IHtcbiAgaWYgKCEodHlwZW9mIGNvbW1hbmRzWzBdID09PSBcInN0cmluZ1wiKSkgcmV0dXJuIGNvbW1hbmRzWzBdO1xuICBjb25zdCBwYXJ0cyA9IGNvbW1hbmRzWzBdLnRvU3RyaW5nKCkuc3BsaXQoXCI6XCIpO1xuICByZXR1cm4gcGFydHMubGVuZ3RoID4gMSA/IHBhcnRzWzFdIDogY29tbWFuZHNbMF07XG59XG5cbmZ1bmN0aW9uIGdldE91dGxldChjb21tYW5kczogYW55W10pOiBzdHJpbmcge1xuICBpZiAoISh0eXBlb2YgY29tbWFuZHNbMF0gPT09IFwic3RyaW5nXCIpKSByZXR1cm4gUFJJTUFSWV9PVVRMRVQ7XG4gIGNvbnN0IHBhcnRzID0gY29tbWFuZHNbMF0udG9TdHJpbmcoKS5zcGxpdChcIjpcIik7XG4gIHJldHVybiBwYXJ0cy5sZW5ndGggPiAxID8gcGFydHNbMF0gOiBQUklNQVJZX09VVExFVDtcbn1cblxuZnVuY3Rpb24gdXBkYXRlKG5vZGU6IFRyZWVOb2RlPFVybFNlZ21lbnQ+fG51bGwsIGNvbW1hbmRzOiBhbnlbXSk6IFRyZWVOb2RlPFVybFNlZ21lbnQ+IHtcbiAgY29uc3QgcmVzdCA9IGNvbW1hbmRzLnNsaWNlKDEpO1xuICBjb25zdCBuZXh0ID0gcmVzdC5sZW5ndGggPT09IDAgPyBudWxsIDogcmVzdFswXTtcbiAgY29uc3Qgb3V0bGV0ID0gZ2V0T3V0bGV0KGNvbW1hbmRzKTtcbiAgY29uc3QgcGF0aCA9IGdldFBhdGgoY29tbWFuZHMpO1xuXG4gIC8vIHJlYWNoIHRoZSBlbmQgb2YgdGhlIHRyZWUgPT4gY3JlYXRlIG5ldyB0cmVlIG5vZGVzLlxuICBpZiAoIW5vZGUgJiYgISh0eXBlb2YgbmV4dCA9PT0gJ29iamVjdCcpKSB7XG4gICAgY29uc3QgdXJsU2VnbWVudCA9IG5ldyBVcmxTZWdtZW50KHBhdGgsIHt9LCBvdXRsZXQpO1xuICAgIGNvbnN0IGNoaWxkcmVuID0gcmVzdC5sZW5ndGggPT09IDAgPyBbXSA6IFt1cGRhdGUobnVsbCwgcmVzdCldO1xuICAgIHJldHVybiBuZXcgVHJlZU5vZGU8VXJsU2VnbWVudD4odXJsU2VnbWVudCwgY2hpbGRyZW4pO1xuXG4gIH0gZWxzZSBpZiAoIW5vZGUgJiYgdHlwZW9mIG5leHQgPT09ICdvYmplY3QnKSB7XG4gICAgY29uc3QgdXJsU2VnbWVudCA9IG5ldyBVcmxTZWdtZW50KHBhdGgsIHN0cmluZ2lmeShuZXh0KSwgb3V0bGV0KTtcbiAgICByZXR1cm4gcmVjdXJzZSh1cmxTZWdtZW50LCBub2RlLCByZXN0LnNsaWNlKDEpKTtcblxuICAgIC8vIGRpZmZlcmVudCBvdXRsZXQgPT4gcHJlc2VydmUgdGhlIHN1YnRyZWVcbiAgfSBlbHNlIGlmIChub2RlICYmIG91dGxldCAhPT0gbm9kZS52YWx1ZS5vdXRsZXQpIHtcbiAgICByZXR1cm4gbm9kZTtcblxuICAgIC8vIHBhcmFtcyBjb21tYW5kXG4gIH0gZWxzZSBpZiAobm9kZSAmJiB0eXBlb2YgcGF0aCA9PT0gJ29iamVjdCcpIHtcbiAgICBjb25zdCBuZXdTZWdtZW50ID0gbmV3IFVybFNlZ21lbnQobm9kZS52YWx1ZS5wYXRoLCBzdHJpbmdpZnkocGF0aCksIG5vZGUudmFsdWUub3V0bGV0KTtcbiAgICByZXR1cm4gcmVjdXJzZShuZXdTZWdtZW50LCBub2RlLCByZXN0KTtcblxuICAgIC8vIG5leHQgb25lIGlzIGEgcGFyYW1zIGNvbW1hbmQgJiYgY2FuIHJldXNlIHRoZSBub2RlXG4gIH0gZWxzZSBpZiAobm9kZSAmJiB0eXBlb2YgbmV4dCA9PT0gJ29iamVjdCcgJiYgY29tcGFyZShwYXRoLCBzdHJpbmdpZnkobmV4dCksIG5vZGUudmFsdWUpKSB7XG4gICAgcmV0dXJuIHJlY3Vyc2Uobm9kZS52YWx1ZSwgbm9kZSwgcmVzdC5zbGljZSgxKSk7XG5cbiAgICAvLyBuZXh0IG9uZSBpcyBhIHBhcmFtcyBjb21tYW5kICYmIGNhbm5vdCByZXVzZSB0aGUgbm9kZVxuICB9IGVsc2UgaWYgKG5vZGUgJiYgdHlwZW9mIG5leHQgPT09ICdvYmplY3QnKSB7XG4gICAgY29uc3QgdXJsU2VnbWVudCA9IG5ldyBVcmxTZWdtZW50KHBhdGgsIHN0cmluZ2lmeShuZXh0KSwgb3V0bGV0KTtcbiAgICByZXR1cm4gcmVjdXJzZSh1cmxTZWdtZW50LCBub2RlLCByZXN0LnNsaWNlKDEpKTtcblxuICAgIC8vIG5leHQgb25lIGlzIG5vdCBhIHBhcmFtcyBjb21tYW5kICYmIGNhbiByZXVzZSB0aGUgbm9kZVxuICB9IGVsc2UgaWYgKG5vZGUgJiYgY29tcGFyZShwYXRoLCB7fSwgbm9kZS52YWx1ZSkpIHtcbiAgICByZXR1cm4gcmVjdXJzZShub2RlLnZhbHVlLCBub2RlLCByZXN0KTtcblxuICAgIC8vIG5leHQgb25lIGlzIG5vdCBhIHBhcmFtcyBjb21tYW5kICYmIGNhbm5vdCByZXVzZSB0aGUgbm9kZVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHVybFNlZ21lbnQgPSBuZXcgVXJsU2VnbWVudChwYXRoLCB7fSwgb3V0bGV0KTtcbiAgICByZXR1cm4gcmVjdXJzZSh1cmxTZWdtZW50LCBub2RlLCByZXN0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzdHJpbmdpZnkocGFyYW1zOiB7W2tleTogc3RyaW5nXTogYW55fSk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgY29uc3QgcmVzID0ge307XG4gIGZvckVhY2gocGFyYW1zLCAodiwgaykgPT4gcmVzW2tdID0gdi50b1N0cmluZygpKTtcbiAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gY29tcGFyZShwYXRoOiBzdHJpbmcsIHBhcmFtczoge1trZXk6IHN0cmluZ106IGFueX0sIHNlZ21lbnQ6IFVybFNlZ21lbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIHBhdGggPT0gc2VnbWVudC5wYXRoICYmIHNoYWxsb3dFcXVhbChwYXJhbXMsIHNlZ21lbnQucGFyYW1ldGVycyk7XG59XG5cbmZ1bmN0aW9uIHJlY3Vyc2UodXJsU2VnbWVudDogVXJsU2VnbWVudCwgbm9kZTogVHJlZU5vZGU8VXJsU2VnbWVudD4gfCBudWxsLFxuICAgICAgICAgICAgICAgICAgcmVzdDogYW55W10pOiBUcmVlTm9kZTxVcmxTZWdtZW50PiB7XG4gIGlmIChyZXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBuZXcgVHJlZU5vZGU8VXJsU2VnbWVudD4odXJsU2VnbWVudCwgW10pO1xuICB9XG4gIGNvbnN0IGNoaWxkcmVuID0gbm9kZSA/IG5vZGUuY2hpbGRyZW4uc2xpY2UoMCkgOiBbXTtcbiAgcmV0dXJuIG5ldyBUcmVlTm9kZTxVcmxTZWdtZW50Pih1cmxTZWdtZW50LCB1cGRhdGVNYW55KGNoaWxkcmVuLCByZXN0KSk7XG59Il19