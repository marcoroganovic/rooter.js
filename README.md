## Rooter

Rooter is a small, but potentially useful, client-side routing library with small API that is backed by browser's
History API.

### Sample usage

Here we will create new instance of router by calling `rooter` function and as
argument we will pass id of root element in which all views are going to be rendered.
Also on view change will be applied transition which timing you can control by
using `setTransitionTime` method (value should be in milliseconds).

```javascript
var router = rooter("app");
```

After instantiation we can add routes by calling `when` function on provided
object. It looks like this.

```javascript
router.when("/", function() {
  // custom logic
});
```

Router also support URL parameters all of which are decoded with browser
`decodeURIComponent` function before being passed to attached handler.

```javascript
router.when("/user/:id", function(params) {
  console.log(params); // which for example could contain { id: "1" } 
});
```

Middleware functions are another part of router. They are optional but if you
want to add them you can do so by passing an array with desired functions as
second argument.

```javascript
function authenticate() {
  // logic
}

router.when("/profile/:id/edit", [authenticate], function(params) {
  if(authenticated) {
    // proceed
  } else {
    router.redirect("/login");
  }
});
```

If you want to namespace routes you can use appropriately named `namespace`
method.


```javascript
router.namespace("user")
```

To handle `404` pages you can use `notFound` method by providing to it a custom
function. Defaults to empty function.

```javascript
route.notFound(function() {
  // for instance view.render("notfound");
});
```

Last step after adding desired routes and setting up error handling is to call `start` function which will
monitor for changes on `window.location` property.

```javascript
router.start();
```

If you want to remove certain route you would call `remove` method and pass path
to it...

```javascript
router.remove("/secret");
```

To empty whole object you can call `router.flush()`.
