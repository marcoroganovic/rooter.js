function isArray(arg) {
  return Array.isArray(arg);
}

function isString(arg) {
  return typeof arg === "string";
}

function isFunction(arg) {
  return typeof arg === "function";
}

class Router {

  constructor(root) {
    this.routes = [];
    this.prefix = null;
    this.$root = document.querySelector("#" + root);
    this.activeRoute = window.location.pathname;
  }


  namespace(name) {
    this.prefix = name;
    return this;
  }

  easeIn() {
    this.$root.style.opacity = 1;
    this.$root.style.transition = "opacity .5s ease-in";
  }

  easeOut() {
    this.$root.style.opacity = 0;
  }


  isRegexPath(path) {
    if(/\/:[^\/]+/g.test(path)) {
      return true;
    }
  }  
  

  addRouteWithMiddleware(path, middleware, handler) {
    if(!isString(path)) { throw new TypeError("Expected string, got " + typeof path) };
    if(!isArray(middleware)) { throw new TypeError("Expected array, got " + typeof middleware) };
    if(!isFunction(handler)) { throw new TypeError("Expected function, got " + typeof handler) };

    if(this.isRegexPath(path)) {
      this.addRegexRoute(path, handler, middleware);
    } else {
      this.routes.push({
        path: path,
        middleware: middleware,
        handler: handler
      });
    }
  }

  

  addRegexRoute(path, handler, middleware) {
    var placeholder = /\/:[^\/]+/g;
    var params = path.match(placeholder);
    path = new RegExp("^" + path.replace(placeholder, '/([^/]+)') + "$");

    this.routes.push({
      path: path,
      handler: handler,
      isRegex: true,
      params: params,
      middleware: middleware || null
    });
  }

  addRoute(path, handler) {
    if(!isString(path)) { throw new TypeError("Expected string, got " + typeof path) };
    if(!isFunction(handler)) {throw new TypeError("Expected function, got " + typeof handler) };

    if(this.isRegexPath(path)) {
      this.addRegexRoute(path, handler);
    } else {
      this.routes.push({
        path: path,
        handler: handler
      });
    }
  }

  when(path, middleware,  handler) {
    switch(arguments.length) {
      case 3:
        this.addRouteWithMiddleware(path, middleware, handler);
        break;
      case 2:
        handler = middleware;
        this.addRoute(path, handler);
        break;
    }
    return this;
  }

  checkForRouteChange(path) {
    if(this.activePath !== path) {
      this.activePath = path;
      this.findRoute(path);
    }
  }


  decodeParam(param) {
    return decodeURIComponent(param);
  }


  extractParams(route) {
    var matched = window.location.pathname.match(route.path);
    var params = {};

    if(!matched) {
      return params;
    } else {
      for(var i = 1; i < matched.length; i++) {
        params[route.params[i - 1].slice(2)] = this.decodeParam(matched[i]);
      }
      return params;
    }
  }


  changeView(route) {
    this.easeOut();
    setTimeout(() => {
        route.handler(route.params ? 
          this.extractParams(route) : 
          null);
      this.easeIn();
    }, 400);
  }

  executeMiddleware(middlewares) {
    middlewares.forEach(mdlw => {
      if(isFunction(mdlw)) { mdlw(); }
    });
  }

  returnMatch(path) {
    return this.routes.find(route => {
      return (route.isRegex && path.match(route.path)) ||
              route.path === path ? route : false;
    });
  }


  findRoute(path) {
    var match = this.returnMatch(path);

    if(match) {
      if(match.middleware) this.executeMiddleware(match.middleware);
      this.changeView(match);
    } else {
      console.log("404 Not Found");
    }
  }

  setupHistoryListener() {
    document.addEventListener("click", (e) => {
      var el = e.target;
      if(el.nodeName === "A") {
        e.preventDefault();
        history.pushState(el.pathname, null, el.pathname);
        this.checkForRouteChange(el.pathname);
      }
    }, false);
  }

  setupPopstateListener() {
    window.addEventListener("popstate", (e) => {
      this.findRoute(e.state);
    });
  }

  start() {
    this.setupHistoryListener();
    this.setupPopstateListener();
    this.findRoute(window.location.pathname);
  }

  goTo(path) {
    history.pushState(path, null, path);
    this.findRoute(path);
  }

  redirect(path) {
    this.goTo(path);
  }

  removeRoute(path) {
    this.routes = this.routes.filter(route => {
      return (route.isRegex &&  path.match(route.path)) || 
             (route.path === path) ? false : true;
    });
  }

  flush() {
    this.routes = {};
    this.activeRoute = null;
    this.prefix = null;
    this.$root = null;
  }
}
