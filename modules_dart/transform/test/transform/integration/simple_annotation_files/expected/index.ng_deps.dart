library web_foo.ng_deps.dart;

import 'index.dart';
import 'package:angular2/src/core/reflection/reflection.dart' as _ngRef;
import 'package:angular2/bootstrap_static.dart';
import 'index.ng_deps.dart' as ngStaticInit;
import 'index.ng_deps.dart' as i1;
import 'package:angular2/src/core/reflection/reflection.dart';
import 'bar.dart';
import 'bar.ng_deps.dart' as i3;
export 'index.dart';

var _visited = false;
void initReflector() {
  if (_visited) return;
  _visited = true;
  i1.initReflector();
  i3.initReflector();
}
