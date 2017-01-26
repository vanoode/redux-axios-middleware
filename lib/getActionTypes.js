'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var SUCCESS_SUFFIX = exports.SUCCESS_SUFFIX = '_SUCCESS';
var ERROR_SUFFIX = exports.ERROR_SUFFIX = '_FAIL';

var getActionTypes = exports.getActionTypes = function getActionTypes(action) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$errorSuffix = _ref.errorSuffix,
      errorSuffix = _ref$errorSuffix === undefined ? ERROR_SUFFIX : _ref$errorSuffix,
      _ref$successSuffix = _ref.successSuffix,
      successSuffix = _ref$successSuffix === undefined ? SUCCESS_SUFFIX : _ref$successSuffix;

  var types = void 0;
  if (typeof action.type !== 'undefined') {
    var type = action.type;

    types = [type, '' + type + successSuffix, '' + type + errorSuffix];
  } else if (typeof action.types !== 'undefined') {
    types = action.types;
  } else {
    throw new Error('Action which matched axios middleware needs to have "type" or "types" key which is not null');
  }
  return types;
};