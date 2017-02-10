(function() {

  "use strict";

  function constructRegEx(prop) {
    return new RegExp("{{\\s+?" + prop + "\\s+?}}", "g");
  }

  function template(str, opts) {
    if(!(typeof opts === "object")) return str;

    Object.keys(opts).forEach(function(prop) {
      var re = constructRegEx(prop);
      str = str.replace(re, opts[prop]);
    });
    
    return str;
  }

  window.tmpl = template;
})();
