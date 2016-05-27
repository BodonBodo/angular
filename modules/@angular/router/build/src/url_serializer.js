"use strict";
var url_tree_1 = require('./url_tree');
var shared_1 = require('./shared');
var tree_1 = require('./utils/tree');
var UrlSerializer = (function () {
    function UrlSerializer() {
    }
    return UrlSerializer;
}());
exports.UrlSerializer = UrlSerializer;
var DefaultUrlSerializer = (function () {
    function DefaultUrlSerializer() {
    }
    DefaultUrlSerializer.prototype.parse = function (url) {
        var p = new UrlParser(url);
        return new url_tree_1.UrlTree(p.parseRootSegment(), p.parseQueryParams(), p.parseFragment());
    };
    DefaultUrlSerializer.prototype.serialize = function (tree) {
        var node = serializeUrlTreeNode(tree_1.rootNode(tree));
        var query = serializeQueryParams(tree.queryParameters);
        var fragment = tree.fragment !== null ? "#" + tree.fragment : '';
        return "" + node + query + fragment;
    };
    return DefaultUrlSerializer;
}());
exports.DefaultUrlSerializer = DefaultUrlSerializer;
function serializeUrlTreeNode(node) {
    return "" + serializeSegment(node.value) + serializeChildren(node);
}
function serializeUrlTreeNodes(nodes) {
    var primary = serializeSegment(nodes[0].value);
    var secondaryNodes = nodes.slice(1);
    var secondary = secondaryNodes.length > 0 ? "(" + secondaryNodes.map(serializeUrlTreeNode).join("//") + ")" : "";
    var children = serializeChildren(nodes[0]);
    return "" + primary + secondary + children;
}
function serializeChildren(node) {
    if (node.children.length > 0) {
        return "/" + serializeUrlTreeNodes(node.children);
    }
    else {
        return "";
    }
}
function serializeSegment(segment) {
    var outlet = segment.outlet === shared_1.PRIMARY_OUTLET ? '' : segment.outlet + ":";
    return "" + outlet + segment.path + serializeParams(segment.parameters);
}
exports.serializeSegment = serializeSegment;
function serializeParams(params) {
    return pairs(params).map(function (p) { return (";" + p.first + "=" + p.second); }).join("");
}
function serializeQueryParams(params) {
    var strs = pairs(params).map(function (p) { return (p.first + "=" + p.second); });
    return strs.length > 0 ? "?" + strs.join("&") : "";
}
var Pair = (function () {
    function Pair(first, second) {
        this.first = first;
        this.second = second;
    }
    return Pair;
}());
function pairs(obj) {
    var res = [];
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            res.push(new Pair(prop, obj[prop]));
        }
    }
    return res;
}
var SEGMENT_RE = /^[^\/\(\)\?;=&#]+/;
function matchUrlSegment(str) {
    SEGMENT_RE.lastIndex = 0;
    var match = SEGMENT_RE.exec(str);
    return match ? match[0] : '';
}
var QUERY_PARAM_VALUE_RE = /^[^\(\)\?;&#]+/;
function matchUrlQueryParamValue(str) {
    QUERY_PARAM_VALUE_RE.lastIndex = 0;
    var match = QUERY_PARAM_VALUE_RE.exec(str);
    return match ? match[0] : '';
}
var UrlParser = (function () {
    function UrlParser(remaining) {
        this.remaining = remaining;
    }
    UrlParser.prototype.peekStartsWith = function (str) { return this.remaining.startsWith(str); };
    UrlParser.prototype.capture = function (str) {
        if (!this.remaining.startsWith(str)) {
            throw new Error("Expected \"" + str + "\".");
        }
        this.remaining = this.remaining.substring(str.length);
    };
    UrlParser.prototype.parseRootSegment = function () {
        if (this.remaining == '' || this.remaining == '/') {
            return new tree_1.TreeNode(new url_tree_1.UrlSegment('', {}, shared_1.PRIMARY_OUTLET), []);
        }
        else {
            var segments = this.parseSegments(false);
            return new tree_1.TreeNode(new url_tree_1.UrlSegment('', {}, shared_1.PRIMARY_OUTLET), segments);
        }
    };
    UrlParser.prototype.parseSegments = function (hasOutletName) {
        if (this.remaining.length == 0) {
            return [];
        }
        if (this.peekStartsWith('/')) {
            this.capture('/');
        }
        var path = matchUrlSegment(this.remaining);
        this.capture(path);
        var outletName;
        if (hasOutletName) {
            if (path.indexOf(":") === -1) {
                throw new Error("Not outlet name is provided");
            }
            if (path.indexOf(":") > -1 && hasOutletName) {
                var parts = path.split(":");
                outletName = parts[0];
                path = parts[1];
            }
        }
        else {
            if (path.indexOf(":") > -1) {
                throw new Error("Not outlet name is allowed");
            }
            outletName = shared_1.PRIMARY_OUTLET;
        }
        var matrixParams = {};
        if (this.peekStartsWith(';')) {
            matrixParams = this.parseMatrixParams();
        }
        var secondary = [];
        if (this.peekStartsWith('(')) {
            secondary = this.parseSecondarySegments();
        }
        var children = [];
        if (this.peekStartsWith('/') && !this.peekStartsWith('//')) {
            this.capture('/');
            children = this.parseSegments(false);
        }
        var segment = new url_tree_1.UrlSegment(path, matrixParams, outletName);
        var node = new tree_1.TreeNode(segment, children);
        return [node].concat(secondary);
    };
    UrlParser.prototype.parseQueryParams = function () {
        var params = {};
        if (this.peekStartsWith('?')) {
            this.capture('?');
            this.parseQueryParam(params);
            while (this.remaining.length > 0 && this.peekStartsWith('&')) {
                this.capture('&');
                this.parseQueryParam(params);
            }
        }
        return params;
    };
    UrlParser.prototype.parseFragment = function () {
        if (this.peekStartsWith('#')) {
            return this.remaining.substring(1);
        }
        else {
            return null;
        }
    };
    UrlParser.prototype.parseMatrixParams = function () {
        var params = {};
        while (this.remaining.length > 0 && this.peekStartsWith(';')) {
            this.capture(';');
            this.parseParam(params);
        }
        return params;
    };
    UrlParser.prototype.parseParam = function (params) {
        var key = matchUrlSegment(this.remaining);
        if (!key) {
            return;
        }
        this.capture(key);
        var value = "true";
        if (this.peekStartsWith('=')) {
            this.capture('=');
            var valueMatch = matchUrlSegment(this.remaining);
            if (valueMatch) {
                value = valueMatch;
                this.capture(value);
            }
        }
        params[key] = value;
    };
    UrlParser.prototype.parseQueryParam = function (params) {
        var key = matchUrlSegment(this.remaining);
        if (!key) {
            return;
        }
        this.capture(key);
        var value = "true";
        if (this.peekStartsWith('=')) {
            this.capture('=');
            var valueMatch = matchUrlQueryParamValue(this.remaining);
            if (valueMatch) {
                value = valueMatch;
                this.capture(value);
            }
        }
        params[key] = value;
    };
    UrlParser.prototype.parseSecondarySegments = function () {
        var segments = [];
        this.capture('(');
        while (!this.peekStartsWith(')') && this.remaining.length > 0) {
            segments = segments.concat(this.parseSegments(true));
            if (this.peekStartsWith('//')) {
                this.capture('//');
            }
        }
        this.capture(')');
        return segments;
    };
    return UrlParser;
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsX3NlcmlhbGl6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXJsX3NlcmlhbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHlCQUFvQyxZQUFZLENBQUMsQ0FBQTtBQUNqRCx1QkFBK0IsVUFBVSxDQUFDLENBQUE7QUFDMUMscUJBQW1DLGNBQWMsQ0FBQyxDQUFBO0FBS2xEO0lBQUE7SUFVQSxDQUFDO0lBQUQsb0JBQUM7QUFBRCxDQUFDLEFBVkQsSUFVQztBQVZxQixxQkFBYSxnQkFVbEMsQ0FBQTtBQUtEO0lBQUE7SUFZQSxDQUFDO0lBWEMsb0NBQUssR0FBTCxVQUFNLEdBQVc7UUFDZixJQUFNLENBQUMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QixNQUFNLENBQUMsSUFBSSxrQkFBTyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7SUFFRCx3Q0FBUyxHQUFULFVBQVUsSUFBYTtRQUNyQixJQUFNLElBQUksR0FBRyxvQkFBb0IsQ0FBQyxlQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsRCxJQUFNLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDekQsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLEdBQUcsTUFBSSxJQUFJLENBQUMsUUFBVSxHQUFHLEVBQUUsQ0FBQztRQUNuRSxNQUFNLENBQUMsS0FBRyxJQUFJLEdBQUcsS0FBSyxHQUFHLFFBQVUsQ0FBQztJQUN0QyxDQUFDO0lBQ0gsMkJBQUM7QUFBRCxDQUFDLEFBWkQsSUFZQztBQVpZLDRCQUFvQix1QkFZaEMsQ0FBQTtBQUVELDhCQUE4QixJQUEwQjtJQUN0RCxNQUFNLENBQUMsS0FBRyxnQkFBZ0Is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QkFDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQixDQUFDO1FBQ0gsQ0FBQztRQUNELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFbEIsTUFBTSxDQUFDLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBQ0gsZ0JBQUM7QUFBRCxDQUFDLEFBdEpELElBc0pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVXJsVHJlZSwgVXJsU2VnbWVudCB9IGZyb20gJy4vdXJsX3RyZWUnO1xuaW1wb3J0IHsgUFJJTUFSWV9PVVRMRVQgfSBmcm9tICcuL3NoYXJlZCc7XG5pbXBvcnQgeyByb290Tm9kZSwgVHJlZU5vZGUgfSBmcm9tICcuL3V0aWxzL3RyZWUnO1xuXG4vKipcbiAqIERlZmluZXMgYSB3YXkgdG8gc2VyaWFsaXplL2Rlc2VyaWFsaXplIGEgdXJsIHRyZWUuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBVcmxTZXJpYWxpemVyIHtcbiAgLyoqXG4gICAqIFBhcnNlIGEgdXJsIGludG8gYSB7QExpbmsgVXJsVHJlZX1cbiAgICovXG4gIGFic3RyYWN0IHBhcnNlKHVybDogc3RyaW5nKTogVXJsVHJlZTtcblxuICAvKipcbiAgICogQ29udmVydHMgYSB7QExpbmsgVXJsVHJlZX0gaW50byBhIHVybFxuICAgKi9cbiAgYWJzdHJhY3Qgc2VyaWFsaXplKHRyZWU6IFVybFRyZWUpOiBzdHJpbmc7XG59XG5cbi8qKlxuICogQSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIHRoZSBzZXJpYWxpemF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgRGVmYXVsdFVybFNlcmlhbGl6ZXIgaW1wbGVtZW50cyBVcmxTZXJpYWxpemVyIHtcbiAgcGFyc2UodXJsOiBzdHJpbmcpOiBVcmxUcmVlIHtcbiAgICBjb25zdCBwID0gbmV3IFVybFBhcnNlcih1cmwpO1xuICAgIHJldHVybiBuZXcgVXJsVHJlZShwLnBhcnNlUm9vdFNlZ21lbnQoKSwgcC5wYXJzZVF1ZXJ5UGFyYW1zKCksIHAucGFyc2VGcmFnbWVudCgpKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSh0cmVlOiBVcmxUcmVlKTogc3RyaW5nIHsgXG4gICAgY29uc3Qgbm9kZSA9IHNlcmlhbGl6ZVVybFRyZWVOb2RlKHJvb3ROb2RlKHRyZWUpKTtcbiAgICBjb25zdCBxdWVyeSA9IHNlcmlhbGl6ZVF1ZXJ5UGFyYW1zKHRyZWUucXVlcnlQYXJhbWV0ZXJzKTtcbiAgICBjb25zdCBmcmFnbWVudCA9IHRyZWUuZnJhZ21lbnQgIT09IG51bGwgPyBgIyR7dHJlZS5mcmFnbWVudH1gIDogJyc7XG4gICAgcmV0dXJuIGAke25vZGV9JHtxdWVyeX0ke2ZyYWdtZW50fWA7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2VyaWFsaXplVXJsVHJlZU5vZGUobm9kZTogVHJlZU5vZGU8VXJsU2VnbWVudD4pOiBzdHJpbmcge1xuICByZXR1cm4gYCR7c2VyaWFsaXplU2VnbWVudChub2RlLnZhbHVlKX0ke3NlcmlhbGl6ZUNoaWxkcmVuKG5vZGUpfWA7XG59XG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZVVybFRyZWVOb2Rlcyhub2RlczogVHJlZU5vZGU8VXJsU2VnbWVudD5bXSk6IHN0cmluZyB7XG4gIGNvbnN0IHByaW1hcnkgPSBzZXJpYWxpemVTZWdtZW50KG5vZGVzWzBdLnZhbHVlKTtcbiAgY29uc3Qgc2Vjb25kYXJ5Tm9kZXMgPSBub2Rlcy5zbGljZSgxKTtcbiAgY29uc3Qgc2Vjb25kYXJ5ID0gc2Vjb25kYXJ5Tm9kZXMubGVuZ3RoID4gMCA/IGAoJHtzZWNvbmRhcnlOb2Rlcy5tYXAoc2VyaWFsaXplVXJsVHJlZU5vZGUpLmpvaW4oXCIvL1wiKX0pYCA6IFwiXCI7XG4gIGNvbnN0IGNoaWxkcmVuID0gc2VyaWFsaXplQ2hpbGRyZW4obm9kZXNbMF0pO1xuICByZXR1cm4gYCR7cHJpbWFyeX0ke3NlY29uZGFyeX0ke2NoaWxkcmVufWA7XG59XG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZUNoaWxkcmVuKG5vZGU6IFRyZWVOb2RlPFVybFNlZ21lbnQ+KTogc3RyaW5nIHtcbiAgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBgLyR7c2VyaWFsaXplVXJsVHJlZU5vZGVzKG5vZGUuY2hpbGRyZW4pfWA7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVNlZ21lbnQoc2VnbWVudDogVXJsU2VnbWVudCk6IHN0cmluZyB7XG4gIGNvbnN0IG91dGxldCA9IHNlZ21lbnQub3V0bGV0ID09PSBQUklNQVJZX09VVExFVCA/ICcnIDogYCR7c2VnbWVudC5vdXRsZXR9OmA7XG4gIHJldHVybiBgJHtvdXRsZXR9JHtzZWdtZW50LnBhdGh9JHtzZXJpYWxpemVQYXJhbXMoc2VnbWVudC5wYXJhbWV0ZXJzKX1gO1xufVxuXG5mdW5jdGlvbiBzZXJpYWxpemVQYXJhbXMocGFyYW1zOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSk6IHN0cmluZyB7XG4gIHJldHVybiBwYWlycyhwYXJhbXMpLm1hcChwID0+IGA7JHtwLmZpcnN0fT0ke3Auc2Vjb25kfWApLmpvaW4oXCJcIik7XG59XG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZVF1ZXJ5UGFyYW1zKHBhcmFtczoge1trZXk6IHN0cmluZ106IHN0cmluZ30pOiBzdHJpbmcge1xuICBjb25zdCBzdHJzID0gcGFpcnMocGFyYW1zKS5tYXAocCA9PiBgJHtwLmZpcnN0fT0ke3Auc2Vjb25kfWApO1xuICByZXR1cm4gc3Rycy5sZW5ndGggPiAwID8gYD8ke3N0cnMuam9pbihcIiZcIil9YCA6IFwiXCI7XG59XG5cbmNsYXNzIFBhaXI8QSxCPiB7IGNvbnN0cnVjdG9yKHB1YmxpYyBmaXJzdDpBLCBwdWJsaWMgc2Vjb25kOkIpIHt9IH1cbmZ1bmN0aW9uIHBhaXJzPFQ+KG9iajoge1trZXk6IHN0cmluZ106IFR9KTpQYWlyPHN0cmluZyxUPltdIHtcbiAgY29uc3QgcmVzID0gW107XG4gIGZvciAobGV0IHByb3AgaW4gb2JqKSB7XG4gICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgcmVzLnB1c2gobmV3IFBhaXI8c3RyaW5nLCBUPihwcm9wLCBvYmpbcHJvcF0pKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuY29uc3QgU0VHTUVOVF9SRSA9IC9eW15cXC9cXChcXClcXD87PSYjXSsvO1xuZnVuY3Rpb24gbWF0Y2hVcmxTZWdtZW50KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgU0VHTUVOVF9SRS5sYXN0SW5kZXggPSAwO1xuICB2YXIgbWF0Y2ggPSBTRUdNRU5UX1JFLmV4ZWMoc3RyKTtcbiAgcmV0dXJuIG1hdGNoID8gbWF0Y2hbMF0gOiAnJztcbn1cblxuY29uc3QgUVVFUllfUEFSQU1fVkFMVUVfUkUgPSAvXlteXFwoXFwpXFw/OyYjXSsvO1xuZnVuY3Rpb24gbWF0Y2hVcmxRdWVyeVBhcmFtVmFsdWUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICBRVUVSWV9QQVJBTV9WQUxVRV9SRS5sYXN0SW5kZXggPSAwO1xuICBjb25zdCBtYXRjaCA9IFFVRVJZX1BBUkFNX1ZBTFVFX1JFLmV4ZWMoc3RyKTtcbiAgcmV0dXJuIG1hdGNoID8gbWF0Y2hbMF0gOiAnJztcbn1cblxuY2xhc3MgVXJsUGFyc2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZW1haW5pbmc6IHN0cmluZykge31cblxuICBwZWVrU3RhcnRzV2l0aChzdHI6IHN0cmluZyk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5yZW1haW5pbmcuc3RhcnRzV2l0aChzdHIpOyB9XG5cbiAgY2FwdHVyZShzdHI6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghdGhpcy5yZW1haW5pbmcuc3RhcnRzV2l0aChzdHIpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIFwiJHtzdHJ9XCIuYCk7XG4gICAgfVxuICAgIHRoaXMucmVtYWluaW5nID0gdGhpcy5yZW1haW5pbmcuc3Vic3RyaW5nKHN0ci5sZW5ndGgpO1xuICB9XG5cbiAgcGFyc2VSb290U2VnbWVudCgpOiBUcmVlTm9kZTxVcmxTZWdtZW50PiB7XG4gICAgaWYgKHRoaXMucmVtYWluaW5nICA9PSAnJyB8fCB0aGlzLnJlbWFpbmluZyA9PSAnLycpIHtcbiAgICAgIHJldHVybiBuZXcgVHJlZU5vZGU8VXJsU2VnbWVudD4obmV3IFVybFNlZ21lbnQoJycsIHt9LCBQUklNQVJZX09VVExFVCksIFtdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc2VnbWVudHMgPSB0aGlzLnBhcnNlU2VnbWVudHMoZmFsc2UpO1xuICAgICAgcmV0dXJuIG5ldyBUcmVlTm9kZTxVcmxTZWdtZW50PihuZXcgVXJsU2VnbWVudCgnJywge30sIFBSSU1BUllfT1VUTEVUKSwgc2VnbWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlU2VnbWVudHMoaGFzT3V0bGV0TmFtZTogYm9vbGVhbik6IFRyZWVOb2RlPFVybFNlZ21lbnQ+W10ge1xuICAgIGlmICh0aGlzLnJlbWFpbmluZy5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBpZiAodGhpcy5wZWVrU3RhcnRzV2l0aCgnLycpKSB7XG4gICAgICB0aGlzLmNhcHR1cmUoJy8nKTtcbiAgICB9XG4gICAgbGV0IHBhdGggPSBtYXRjaFVybFNlZ21lbnQodGhpcy5yZW1haW5pbmcpO1xuICAgIHRoaXMuY2FwdHVyZShwYXRoKTtcblxuICAgIGxldCBvdXRsZXROYW1lO1xuICAgIGlmIChoYXNPdXRsZXROYW1lKSB7XG4gICAgICBpZiAocGF0aC5pbmRleE9mKFwiOlwiKSA9PT0gLTEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IG91dGxldCBuYW1lIGlzIHByb3ZpZGVkXCIpO1xuICAgICAgfVxuICAgICAgaWYgKHBhdGguaW5kZXhPZihcIjpcIikgPiAtMSAmJiBoYXNPdXRsZXROYW1lKSB7XG4gICAgICAgIGxldCBwYXJ0cyA9IHBhdGguc3BsaXQoXCI6XCIpO1xuICAgICAgICBvdXRsZXROYW1lID0gcGFydHNbMF07XG4gICAgICAgIHBhdGggPSBwYXJ0c1sxXTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHBhdGguaW5kZXhPZihcIjpcIikgPiAtMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3Qgb3V0bGV0IG5hbWUgaXMgYWxsb3dlZFwiKTtcbiAgICAgIH1cbiAgICAgIG91dGxldE5hbWUgPSBQUklNQVJZX09VVExFVDtcbiAgICB9XG5cbiAgICBsZXQgbWF0cml4UGFyYW1zOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIGlmICh0aGlzLnBlZWtTdGFydHNXaXRoKCc7JykpIHtcbiAgICAgIG1hdHJpeFBhcmFtcyA9IHRoaXMucGFyc2VNYXRyaXhQYXJhbXMoKTtcbiAgICB9XG5cbiAgICBsZXQgc2Vjb25kYXJ5ID0gW107XG4gICAgaWYgKHRoaXMucGVla1N0YXJ0c1dpdGgoJygnKSkge1xuICAgICAgc2Vjb25kYXJ5ID0gdGhpcy5wYXJzZVNlY29uZGFyeVNlZ21lbnRzKCk7XG4gICAgfVxuXG4gICAgbGV0IGNoaWxkcmVuOiBUcmVlTm9kZTxVcmxTZWdtZW50PltdID0gW107XG4gICAgaWYgKHRoaXMucGVla1N0YXJ0c1dpdGgoJy8nKSAmJiAhdGhpcy5wZWVrU3RhcnRzV2l0aCgnLy8nKSkge1xuICAgICAgdGhpcy5jYXB0dXJlKCcvJyk7XG4gICAgICBjaGlsZHJlbiA9IHRoaXMucGFyc2VTZWdtZW50cyhmYWxzZSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2VnbWVudCA9IG5ldyBVcmxTZWdtZW50KHBhdGgsIG1hdHJpeFBhcmFtcywgb3V0bGV0TmFtZSk7XG4gICAgY29uc3Qgbm9kZSA9IG5ldyBUcmVlTm9kZTxVcmxTZWdtZW50PihzZWdtZW50LCBjaGlsZHJlbik7XG4gICAgcmV0dXJuIFtub2RlXS5jb25jYXQoc2Vjb25kYXJ5KTtcbiAgfVxuXG4gIHBhcnNlUXVlcnlQYXJhbXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIHZhciBwYXJhbXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgaWYgKHRoaXMucGVla1N0YXJ0c1dpdGgoJz8nKSkge1xuICAgICAgdGhpcy5jYXB0dXJlKCc/Jyk7XG4gICAgICB0aGlzLnBhcnNlUXVlcnlQYXJhbShwYXJhbXMpO1xuICAgICAgd2hpbGUgKHRoaXMucmVtYWluaW5nLmxlbmd0aCA+IDAgJiYgdGhpcy5wZWVrU3RhcnRzV2l0aCgnJicpKSB7XG4gICAgICAgIHRoaXMuY2FwdHVyZSgnJicpO1xuICAgICAgICB0aGlzLnBhcnNlUXVlcnlQYXJhbShwYXJhbXMpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGFyYW1zO1xuICB9XG5cbiAgcGFyc2VGcmFnbWVudCgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAodGhpcy5wZWVrU3RhcnRzV2l0aCgnIycpKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZW1haW5pbmcuc3Vic3RyaW5nKDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwYXJzZU1hdHJpeFBhcmFtcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgdmFyIHBhcmFtczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICB3aGlsZSAodGhpcy5yZW1haW5pbmcubGVuZ3RoID4gMCAmJiB0aGlzLnBlZWtTdGFydHNXaXRoKCc7JykpIHtcbiAgICAgIHRoaXMuY2FwdHVyZSgnOycpO1xuICAgICAgdGhpcy5wYXJzZVBhcmFtKHBhcmFtcyk7XG4gICAgfVxuICAgIHJldHVybiBwYXJhbXM7XG4gIH1cblxuICBwYXJzZVBhcmFtKHBhcmFtczoge1trZXk6IHN0cmluZ106IGFueX0pOiB2b2lkIHtcbiAgICB2YXIga2V5ID0gbWF0Y2hVcmxTZWdtZW50KHRoaXMucmVtYWluaW5nKTtcbiAgICBpZiAoIWtleSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmNhcHR1cmUoa2V5KTtcbiAgICB2YXIgdmFsdWU6IGFueSA9IFwidHJ1ZVwiO1xuICAgIGlmICh0aGlzLnBlZWtTdGFydHNXaXRoKCc9JykpIHtcbiAgICAgIHRoaXMuY2FwdHVyZSgnPScpO1xuICAgICAgdmFyIHZhbHVlTWF0Y2ggPSBtYXRjaFVybFNlZ21lbnQodGhpcy5yZW1haW5pbmcpO1xuICAgICAgaWYgKHZhbHVlTWF0Y2gpIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZU1hdGNoO1xuICAgICAgICB0aGlzLmNhcHR1cmUodmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHBhcmFtc1trZXldID0gdmFsdWU7XG4gIH1cblxuICBwYXJzZVF1ZXJ5UGFyYW0ocGFyYW1zOiB7W2tleTogc3RyaW5nXTogYW55fSk6IHZvaWQge1xuICAgIHZhciBrZXkgPSBtYXRjaFVybFNlZ21lbnQodGhpcy5yZW1haW5pbmcpO1xuICAgIGlmICgha2V5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuY2FwdHVyZShrZXkpO1xuICAgIHZhciB2YWx1ZTogYW55ID0gXCJ0cnVlXCI7XG4gICAgaWYgKHRoaXMucGVla1N0YXJ0c1dpdGgoJz0nKSkge1xuICAgICAgdGhpcy5jYXB0dXJlKCc9Jyk7XG4gICAgICB2YXIgdmFsdWVNYXRjaCA9IG1hdGNoVXJsUXVlcnlQYXJhbVZhbHVlKHRoaXMucmVtYWluaW5nKTtcbiAgICAgIGlmICh2YWx1ZU1hdGNoKSB7XG4gICAgICAgIHZhbHVlID0gdmFsdWVNYXRjaDtcbiAgICAgICAgdGhpcy5jYXB0dXJlKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcGFyYW1zW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHBhcnNlU2Vjb25kYXJ5U2VnbWVudHMoKTogVHJlZU5vZGU8VXJsU2VnbWVudD5bXSB7XG4gICAgdmFyIHNlZ21lbnRzID0gW107XG4gICAgdGhpcy5jYXB0dXJlKCcoJyk7XG5cbiAgICB3aGlsZSAoIXRoaXMucGVla1N0YXJ0c1dpdGgoJyknKSAmJiB0aGlzLnJlbWFpbmluZy5sZW5ndGggPiAwKSB7XG4gICAgICBzZWdtZW50cyA9IHNlZ21lbnRzLmNvbmNhdCh0aGlzLnBhcnNlU2VnbWVudHModHJ1ZSkpO1xuICAgICAgaWYgKHRoaXMucGVla1N0YXJ0c1dpdGgoJy8vJykpIHtcbiAgICAgICAgdGhpcy5jYXB0dXJlKCcvLycpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNhcHR1cmUoJyknKTtcblxuICAgIHJldHVybiBzZWdtZW50cztcbiAgfVxufVxuIl19