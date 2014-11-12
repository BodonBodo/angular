library facade.collection;

import 'dart:collection' show HashMap;
export 'dart:core' show Map, List, Set;

class MapWrapper {
  static HashMap create() => new HashMap();
  static HashMap createFromStringMap(m) => m;
  static HashMap createFromPairs(List pairs) {
    return pairs.fold({}, (m, p){
      m[p[0]] = p[1];
      return m;
    });
  }
  static get(m, k) => m[k];
  static void set(m, k, v){ m[k] = v; }
  static contains(m, k) => m.containsKey(k);
  static forEach(m, fn) {
    m.forEach((k,v) => fn(v,k));
  }
  static int size(m) {return m.length;}
  static void delete(m, k) { m.remove(k); }
  static void clear(m) { m.clear(); }
}

// TODO: how to export StringMap=Map as a type?
class StringMapWrapper {
  static HashMap create() => new HashMap();
  static get(map, key) {
    return map[key];
  }
  static set(map, key, value) {
    map[key] = value;
  }
  static forEach(m, fn) {
    m.forEach((k,v) => fn(v,k));
  }
  static isEmpty(m) {
    return m.isEmpty;
  }
}

class ListWrapper {
  static List clone(List l) => new List.from(l);
  static List create() => new List();
  static List createFixedSize(int size) => new List(size);
  static get(m, k) => m[k];
  static void set(m, k, v) { m[k] = v; }
  static contains(List m, k) => m.contains(k);
  static map(list, fn) => list.map(fn).toList();
  static filter(List list, fn) => list.where(fn).toList();
  static find(List list, fn) => list.firstWhere(fn, orElse:() => null);
  static any(List list, fn) => list.any(fn);
  static forEach(list, fn) {
    list.forEach(fn);
  }
  static reduce(List list, Function fn, init) {
    return list.fold(init, fn);
  }
  static first(List list) => list.first;
  static last(List list) => list.last;
  static List reversed(List list) => list.reversed.toList();
  static void push(List l, e) { l.add(e); }
  static List concat(List a, List b) {a.addAll(b); return a;}
  static bool isList(l) => l is List;
  static void insert(List l, int index, value) { l.insert(index, value); }
  static void removeAt(List l, int index) { l.removeAt(index); }
  static void clear(List l) { l.clear(); }
}

class SetWrapper {
  static Set createFromList(List l) { return new Set.from(l); }
  static bool has(Set s, key) { return s.contains(key); }
}
