## Rooter

Rooter is a small, but potentially useful,  client-side routing with small API that is backed by browser's
History API.

### Sample usage

Here we will create new instance of router by calling `rooter` function and as
argument we will pass id of root element on which all views are going to be rendered.

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

Router also support url parameters all of which are decoded with browser
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

Last step after adding desired routes is to call `start` function which will
monitor `window.location` property.

```javascript
router.start();
```
