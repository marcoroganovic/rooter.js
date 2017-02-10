(function (lib, global) {

  if(typeof module === "object" && typeof module.exports === "object") {
    module.exports = lib();
  } else if(typeof define === "function" && define.amd) {
    return define([], lib);
  } else {
    global.rooter = lib();
  }

})(function() {

  "use strict";

  // Helpers
  function noop() {}

  
  function isString(arg) {
    return typeof arg === "string";
  }

  
  function isObject(arg) {
    return typeof arg === "object";
  }

  
  function isArray(arg) {
    return Object.prototype.toString.call(arg) === "[object Array]";
  }

  
  function isFunc(arg) {
    return typeof arg === "function";
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


  function Router(root) {
    this.routes = [];
    this.prefix = null;
    this.$root = document.getElementById(root);
    this.activeRoute = window.location.pathname;
    this.notFoundHandler = {
      path: "/404",
      handler: noop
    }
  }


  Router.prototype = {


    namespace: function(name) {
      this.prefix = name;
      return this;
    },


    easeIn: function() {
      this.$root.style.opacity = 1;
      this.$root.style.transition = "opacity .5s ease-in";
    },


    easeOut: function() {
      this.$root.style.opacity = 0;
    },


    changeView: function(route) {
      this.easeOut();
      setTimeout(function() {
        route.handler(route.params ?
          extractParams(route) :
          null
        );
        this.easeIn();
      }.bind(this), 400);
    },


    addRegexRoute(path, cb, mw) {
      var placeholder = /\/:[^\/]+/g;
      var params = path.match(placeholder);
      path = new RegExp("^" + path.replace(placeholder, '/([^/]+)') + "$");

      this.routes.push({
        path: path,
        handler: cb,
        isRegex: true,
        params: params,
        middleware: mw || null
      });
    },


    addRouteMiddleware: function(path, mw, cb) {
      if(!isString(path)) typeError("string", typeof path);
      if(!isArray(mw)) typeError("array", typeof mw);
      if(!isFunc(cb)) typeError("function", typeof cb);

      if(isRegexPath(path)) {
        this.addRegexRoute(path, cb, mw);
      } else {
        this.routes.push({ path: path, middleware: mw, handler: cb });
      }
    },


    addRoute: function(path, handler) {
      if(!isString(path)) typeError("string", typeof path);
      if(!isFunc(handler)) typeError("function", typeof handler);

      if(isRegexPath(path)) {
        this.addRegexRoute(path, handler);
      } else {
        this.routes.push({ path: path, handler: handler });
      }
    },


    when: function(path, middleware, handler) {
      // constructs path with prefix if set by namespace method
      path = prefixPath(path, this.prefix);
      
      switch(arguments.length) {
        case 3:
          this.addRouteMiddleware(path, middleware, handler);
          break;
        case 2:
          handler = middleware;
          this.addRoute(path, handler);
          break;
      }
      return this;
    },


    checkForRouteChange: function(path) {
      if(this.activePath !== path) {
        this.activePath = path;
        this.findRoute(path);
      }
    },


    executeMiddleware: function(arr) {
      arr.forEach(function(mw) {
        if(isFunc(mw)) mw();
      });
    },


    returnMatch: function(path) {
      return this.routes.find(function(route) {
        return (route.isRegex && path.match(route.path)) ||
                route.path === path ? route : false;
      });
    },


    findRoute: function(path) {
      var match = this.returnMatch(path);

      if(match) {
        if(match.middleware) this.executeMiddleware(match.middleware);
        this.changeView(match);
      } else {
        this.pushNotFoundState()
        this.changeView(this.notFoundHandler);
      }
    },

    
    setupClickListener: function() {
      var self = this;
      document.addEventListener("click", function(e) {
        var el = e.target;
        if(el.nodeName.toLowerCase() === "a") {
          if(el.href.indexOf(window.location.host) !== -1) {
            e.preventDefault();
            history.pushState(el.pathname, null, el.pathname);
            self.checkForRouteChange(el.pathname);
          }
        }
      }, false);
    },

    
    setupPopstateListener: function() {
      var self = this;
      window.addEventListener("popstate", function(e) {
        self.findRoute(e.state);
      });
    },

    
    start: function() {
      this.setupClickListener();
      this.setupPopstateListener();
      this.findRoute(window.location.pathname);
    },

    pushNotFoundState: function() {
      var path = this.notFoundHandler.path;
      history.pushState(path, null, path);
    },

    
    notFound: function(path, handler) {
      this.notFoundHandler = {
        path: path,
        handler: handler
      }
      return this;
    },

    
    goTo: function(path) {
      history.pushState(path, null, path);
      this.findRoute(path);
    },

    
    redirect: function(path) {
      this.goTo(path);
    },

    
    remove: function(path) {
      this.routes = this.routes.filter(function(route) {
        return (route.isRegex && path.match(route.path)) ||
               (route.path === path) ? false: true;
      });
    },

    
    flush: function() {
      this.route = [];
      this.activeRoute = window.location.pathname,
      this.prefix = null;
      this.notFoundHandler = {
        path: "/404",
        handler: noop
      }
    }

  };


  return function(id) {
    if(!(this instanceof Router)) {
      return new Router(id);
    }
  }
  
}, window);
