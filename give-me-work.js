var library = require("module-library")(require)

module.exports = library.export(
  "give-me-work",
  ["web-element", "browser-bridge", "basic-styles", "tell-the-universe", "release-checklist", "work-space"],
  function(element, BrowserBridge, basicStyles, tellTheUniverse,releaseChecklist, workSpace) {

    var baseBridge = new BrowserBridge()
    baseBridge.addToBody(element("a", element.style({"display": "block"}), {href: "/"}, "&#8617; Back to workspace"))

    function prepareSite(site) {

      baseBridge.addToHead(basicStyles)

      tellTheUniverse = tellTheUniverse
        .called("project-process")
        .withNames({
          releaseChecklist: "release-checklist",
          workSpace: "work-space",
        })

      tellTheUniverse.load()

      site.addRoute("get",
        "/give-me-work",
        function(request, response) {
          renderGetWorkButtons(baseBridge.forResponse(response))
        }
      )

      site.addRoute("get",
        "/give-me-work/programming",
        function(request, response) {

          var space = workSpace()

          getNewTask(space)

          var bridge = baseBridge.forResponse(response)

          renderWorkSpace(space, bridge)
        }
      )

      site.addRoute("get",
        "/work-space/:id",
        function(request, response) {
          var space = workSpace.get(request.params.id)

          renderWorkSpace(space, baseBridge.forResponse(response))
        }
      )


      site.addRoute("get",
        "/work-space/:id/mark-completed/:text",
        function(request, response) {
          var task = request.params.text
          var space = workSpace.get(request.params.id)

          releaseChecklist.checkOff(list, task)

          getNewTask(space, task)

          tellTheUniverse("releaseChecklist.checkOff", list.id, task)

          renderWorkSpace(space, baseBridge.forResponse(response))
        }
      )

      site.addRoute("get",
        "/work-space/:spaceId/dont-want/:text",
        function(request, response) {

          var space = workSpace.get(request.params.spaceId)
          var task = request.params.text

          getNewTask(space, task)

          var bridge = baseBridge.forResponse(response)

          renderWorkSpace(space, bridge)
        }
      )

      site.addRoute("get",
        "/work-space/:id/start-working",
        function(request, response) {
          var space = workSpace.get(request.params.id)

          saveSkipEventually(space, list.id)

          var bridge = baseBridge.forResponse(response)

          bridge.changePath("/work-space/"+space.id)

          renderWorkSpace(space, bridge)
        }
      )

    }

    function renderTask(space, bridge) {
      var job = element("p", "Make it so «"+space.currentTask+"» is possible")
      job.appendStyles({"min-height": "2.5em"})

      var putBack = element("a.button", "Put it back", {href: "/work-space/"+space.id+"/dont-want/"+encodeURIComponent(space.currentTask)})

      var body = [job, putBack]

      if (space.isPersisted) {
        var complete = element("a.button", "It's done", {href: "/work-space/"+space.id+"/mark-completed/"+encodeURIComponent(space.currentTask)})

        body.push(complete)
      } else {
        var start = element("a.button", "Start working", {href: "/work-space/"+space.id+"/start-working"})

        body.push(start)
      }

      bridge.send(body)

    }

    function renderGetWorkButtons(bridge) {

      var button = element("a.button", "Give me programming work", {href: "/give-me-work/programming"})

      bridge.send(button)
    }

    function renderWorkSpace(space, bridge) {

      if (space.isPersisted) {
        bridge.changePath("/work-space/"+space.id)
      }

      if (space.currentTask) {
        renderTask(space, bridge)
      } else {
        renderGetWorkButtons(bridge)
      }
    }


    function getNewTask(space, oldTask) {
      
      if (oldTask) {
        var nextIndex = list.tasks.indexOf(oldTask)
      } else {
        nextIndex = 36
      }

      var whereWeStarted = nextIndex

      do {
        nextIndex++

        if (!list.tasks[nextIndex]) {
          nextIndex = 0
        }

        if (nextIndex == whereWeStarted) {
          throw new Error("No tasks available")
        }

      } while(list.tasksCompleted[nextIndex])

      var newTask = list.tasks[nextIndex]

      if (!newTask) {
        console.log("list", JSON.stringify(list, null, 2))
        console.log("space", JSON.stringify(space, null, 2))
        throw new Error("current task is undefined!")
      }

      workSpace.focusOn(space, list.id, newTask)

      if (space.isPersisted) {
        saveSkipEventually(space, list.id)
      }
    }
    
    function saveSkipEventually(space, listId) {
      if (space.saving) {
        clearTimeout(space.skipSaveTimeout)
      } else {
        space.saving = true
      }
      
      space.skipSaveTimeout = setTimeout(saveSkip.bind(null, space, listId), 3000)
    }

    function saveSkip(space, listId) {
      space.saving = false

      if (!space.isPersisted) {
        tellTheUniverse("workSpace", space.id)
        space.isPersisted = true
      }

      tellTheUniverse("workSpace.focusOn", space.id, listId, space.currentTask)
    }

    var list

    renderWorkSpace.drawFromList = function(focusList) {
      list = focusList
    }
    renderWorkSpace.prepareSite = prepareSite
    

    return renderWorkSpace
  }
)