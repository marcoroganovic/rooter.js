var router = rooter("app");

var loggedIn = false;

var view = {
  el: document.querySelector("#app"),
  render: function(id, props) {
    var content = document.querySelector("#tmpl-" + id).innerHTML;
    this.el.innerHTML = tmpl(content, props);
  }
};

function log(page) {
  return function() {
    console.log(page);
  }
}

function authenticate() {
  loggedIn = true;
}

router
  .namespace("hello")
  .when("/", function() {
    view.render("homepage");
  })

  .when("/about", function() {
    view.render("about");
    var $input = document.querySelector("input");
    var $btn = document.querySelector("button");
    $btn.addEventListener("click", function(e) {
      router.goTo("/me/" + $input.value);
    });
  })

  .when("/contact", function() {
    view.render("contact");
  })

  .when("/me", function() {
    view.render("me", { name: "Marko Roganovic" });
  })

  .when("/me/:name", function(params) {
    view.render("me", params);
  })

  .when("/login", function() {
    view.render("login");
  })

  .when("/secret", function() {
    if(loggedIn) {
      view.render("secret");
    } else {
      router.goTo("/");
    }
  });

router.start();
