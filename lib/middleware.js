'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.multiClientMiddleware = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _defaults = require('./defaults');

var defaultOptions = _interopRequireWildcard(_defaults);

var _getActionTypes3 = require('./getActionTypes');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function addInterceptor(target, candidate, injectedParameters) {
  if (!candidate) return;
  var successInterceptor = typeof candidate === 'function' ? candidate : candidate.success;
  var errorInterceptor = candidate && candidate.error;
  target.use(successInterceptor && successInterceptor.bind(null, injectedParameters), errorInterceptor && errorInterceptor.bind(null, injectedParameters));
}

function bindInterceptors(client, injectedParameters) {
  var middlewareInterceptors = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var clientInterceptors = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  [].concat(_toConsumableArray(middlewareInterceptors.request || []), _toConsumableArray(clientInterceptors.request || [])).forEach(function (interceptor) {
    addInterceptor(client.interceptors.request, interceptor, injectedParameters);
  });
  [].concat(_toConsumableArray(middlewareInterceptors.response || []), _toConsumableArray(clientInterceptors.response || [])).forEach(function (interceptor) {
    addInterceptor(client.interceptors.response, interceptor, injectedParameters);
  });
}

var multiClientMiddleware = exports.multiClientMiddleware = function multiClientMiddleware(clients, customMiddlewareOptions) {
  var middlewareOptions = _extends({}, defaultOptions, customMiddlewareOptions);
  var setupedClients = {};
  var storedAction = void 0;
  return function (_ref) {
    var getState = _ref.getState,
        dispatch = _ref.dispatch;
    return function (next) {
      return function (action) {
        if (!middlewareOptions.isAxiosRequest(action)) {
          return next(action);
        }
        storedAction = action;
        var clientName = middlewareOptions.getClientName(action) || middlewareOptions.defaultClientName;
        if (!clients[clientName]) {
          throw new Error('Client with name "' + clientName + '" has not been defined in middleware');
        }
        if (!setupedClients[clientName]) {
          var clientOptions = _extends({}, middlewareOptions, clients[clientName].options);
          if (clientOptions.interceptors) {
            var getAction = function getAction() {
              return storedAction;
            };
            var middlewareInterceptors = middlewareOptions.interceptors;
            var clientInterceptors = clients[clientName].options && clients[clientName].options.interceptors;
            var injectToInterceptor = { getState: getState, dispatch: dispatch, action: action, getAction: getAction };
            bindInterceptors(clients[clientName].client, injectToInterceptor, middlewareInterceptors, clientInterceptors);
          }
          setupedClients[clientName] = {
            client: clients[clientName].client,
            options: clientOptions
          };
        }
        var setupedClient = setupedClients[clientName];
        var actionOptions = _extends({}, setupedClient.options, setupedClient.options.getRequestOptions(action));

        var _getActionTypes = (0, _getActionTypes3.getActionTypes)(action, actionOptions),
            _getActionTypes2 = _slicedToArray(_getActionTypes, 1),
            REQUEST = _getActionTypes2[0];

        next(_extends({}, action, { type: REQUEST }));
        return setupedClient.client.request(actionOptions.getRequestConfig(action)).then(function (response) {
          var newAction = actionOptions.onSuccess({ action: action, next: next, response: response, getState: getState, dispatch: dispatch }, actionOptions);
          actionOptions.onComplete({ action: newAction, next: next, getState: getState, dispatch: dispatch }, actionOptions);
          return newAction;
        }, function (error) {
          var newAction = actionOptions.onError({ action: action, next: next, error: error, getState: getState, dispatch: dispatch }, actionOptions);
          actionOptions.onComplete({ action: newAction, next: next, getState: getState, dispatch: dispatch }, actionOptions);
          return actionOptions.returnRejectedPromiseOnError ? Promise.reject(newAction) : newAction;
        });
      };
    };
  };
};

exports.default = function (client, customMiddlewareOptions, customClientOptions) {
  var middlewareOptions = _extends({}, defaultOptions, customMiddlewareOptions);
  var options = customClientOptions || {};
  return multiClientMiddleware(_defineProperty({}, middlewareOptions.defaultClientName, { client: client, options: options }), middlewareOptions);
};