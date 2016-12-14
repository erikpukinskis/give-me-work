var library = require("module-library")(require)

library.using(
  ["./", "web-site"],
  function(giveMeWork, WebSite) {
    WebSite.provision(giveMeWork)
    WebSite.megaBoot()
  }
)
