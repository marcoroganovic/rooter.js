(function(lib, global) {
  
  if(typeof module === "object" && typeof module.exports === "object") {
    module.exports = lib;
  } else if(typeof define === "function" && define.amd) {
    return define([], lib);
  } else {
    global.rooter = lib;
  }

})(function(id) {

  /*******************
   * Helper functions
  ********************/
  
  function noop() {}

  
  function isString(arg) {
    return typeof arg === "string";
  }

  
  function isNumber(arg) {
    return typeof arg === "number";
  }

  
  function isFunction(arg) {
    return typeof arg === "function";
  }

  
  function isArray(arg) {
    return Object.prototype.toString.call(arg) === "[object Array]";
  }

  
  function typeError(expected, actual) {
    throw new TypeError("Expected " + expected + ", got " + actual);
  }

  
  function isRegexPath(path) {
    return /\/:[^\/]+/g.test(path);
  }

  
  function decodeParam(param) {
    return decodeURIComponent(param);
  }

  
  function extractParams(route) {
    var matched = window.location.pathname.match(route.path);
    var params = {};

    if(!matched) return params;
    for(var i = 1; i < matched.length; i++) {
      params[route.params[i - 1].slice(2)] = decodeParam(matched[i]);
    }
    
    return params;
  }

  function prefixPath(path, prefix) {
    if(prefix) {
      if(prefix.indexOf("/") === -1) {
        path = "/" + prefix + (path === "/" ? "" : path);
      } else {
        path = prefix + (path === "/" ? "" : path);
      }
    }

    return path;
  }

  
  
  
  
  /********************
   * Object properties
  *********************/
  var routes = [];
  var prefix = null;
  var activePath = window.location.pathname;
  var $root = document.getElementById(id) || null;
  var transitionConfig = {
    time: 400,
    effect: "ease-in",
    applyAfter: 200
  };
  var notFoundHandler = noop;
  
  
  
  
  
  /*******************
   * Private methods
  ********************/

  function show() {
    $root.style.opacity = 1;
    $root.style.transition = (
        "opacity " + 
        transitionConfig.time + "ms " +
        transitionConfig.effect
    );
  }

  
  function hide() {
    $root.style.opacity = 0;
  }

  
  function getTransitionConfig() {
    return transitionConfig;
  }

  
  function setTransitionConfig(opts) {
    transitionConfig = opts;
  }

  
  function transitionView(route) {
    hide();
    setTimeout(function() {
      route.handler(route.params ? extractParams(route) : null);
      show();
    }, transitionConfig.applyAfter);
  }

  
  function changeView(route) {
    // handle not found page
    if(isFunction(route)) {
      route(); 
      return;
    }

    if($root) {
      transitionView(route);
    } else {
      route.handler(route.params ? extractParams(route) : null);
    }
  }

  
  function addRegexRoute(path, cb, mw) {
    var placeholder = /\/:[^\/]+/g;
    var params = path.match(placeholder);
    path = new RegExp("^" + path.replace(placeholder, '/([^/]+)') + "$");

    routes.push({
      path: path,
      handler: cb,
      isRegex: true,
      params: params,
      middleware: mw || null
    });
  }

  
  function addRouteMiddleware(path, mw, cb) {
    if(!isString(path)) typeError("string", typeof path);
    if(!isArray(mw)) typeError("array", typeof mw);
    if(!isFunction(cb)) typeError("function", typeof cb);

    if(isRegexPath(path)) {
      addRegexRoute(path, cb, mw);
    } else {
      routes.push({ path: path, middleware: mw, handler: cb });
    }
  }


  function addRoute(path, handler) {
    if(!isString(path)) typeError("string", typeof path);
    if(!isFunction(handler)) typeError("function", typeof handler);

    if(isRegexPath(path)) {
      addRegexRoute(path, handler);
    } else {
      routes.push({ path: path, handler: handler });
    }
  }

  
  function returnMatch(path) {
    return routes.find(function(route) {
      return (route.isRegex && path.match(route.path)) ||
              route.path === path ? route : false;
    });
  }

  
  function executeMiddleware(arr) {
    arr.forEach(function(mw) {
      if(isFunction(mw)) mw();
    });
  }

  
  function findRoute(path) {
    var match = returnMatch(path);
    
    if(match) {
      if(match.middleware) executeMiddleware(match.middleware);
      changeView(match);
    } else {
      changeView(notFoundHandler);
    }
  }


  function checkForRouteChange(path) {
    if(activePath !== path) {
      activePath = path;
      findRoute(path);
    }
  }


  function setupClickListener() {
    document.addEventListener("click", function(e) {
      var el = e.target;
      if(el.nodeName.toLowerCase() === "a") {
        if(el.href.indexOf(window.location.host) !== -1) {
          e.preventDefault();
          history.pushState(el.pathname, null, el.pathname);
          checkForRouteChange(el.pathname);
        }
      }
    }, false);
  }


  function setupPopstateListener() {
    window.addEventListener("popstate", function(e) {
      findRoute(e.state);
    });
  }

  
  
  
  
  /*****************
  * Public methods
  ******************/

  function when(path, middleware, handler) {
    // construct path with prefix if is set by namespace method
    path = prefixPath(path, prefix);

    if(arguments.length >= 3) {
      addRouteMiddleware(path, middleware, handler);
    } else {
      handler = middleware;
      addRoute(path, handler);
    }

    return this;
  }


  function getRoutes() {
    return routes;
  }


  function namespace(name) {
    prefix = name;
    return this;
  }

  
  function start() {
    setupClickListener();
    setupPopstateListener();
    findRoute(window.location.pathname);
  }

 
  function goTo(path) {
    history.pushState(path, null, path);
    findRoute(path);
  }


  function redirect(path) {
    this.goTo(path);
  }


  function notFound(handler) {
    notFoundHandler = handler;
    return this;
  }

  
  function remove(path) {
    routes = routes.filter(function(route) {
      return (route.isRegex && path.match(route.path)) ||
             (route.path === path) ? false : true;
    });
  }


  function flush() {
    routes = [];
    activePath = window.location.pathname;
    prefix = null;
    transitionTime = 400;
    notFoundHandler = noop;
  }


  
  
  
  /********************
   * Export Public API
  *********************/

  return {
    when: when,
    notFound: notFound,
    start: start,
    namespace: namespace,
    getRoutes: getRoutes,
    getTransitionConfig: getTransitionConfig,
    setTransitionConfig: setTransitionConfig,
    goTo: goTo,
    redirect: redirect,
    remove: remove,
    flush: flush
  }

}, this);
