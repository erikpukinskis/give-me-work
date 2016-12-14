var library = require("module-library")(require)

module.exports = library.export(
  "give-me-work",
  ["web-element", "browser-bridge", "basic-styles", "tell-the-universe", "release-checklist", "work-space"],
  function(element, baseBridge, basicStyles, tellTheUniverse,releaseChecklist, workSpace) {

    return function(site) {

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
          var button = element("a.button", "Give me programming work", {href: "/give-me-work/programming"})

          baseBridge.requestHandler([button])(request, response)
        }
      )


      site.addRoute("get",
        "/give-me-work/programming",
        function(request, response) {

          var space = workSpace()

          var list = releaseChecklist.get("putw4e")

          getNewTask(space, list)

          var bridge = baseBridge.forResponse(response)

          sendWorkSpace(space, bridge)
        }
      )

      site.addRoute("get",
        "/work-space/:id",
        function(request, response) {
          var space = workSpace.get(request.params.id)

          sendWorkSpace(space, baseBridge.forResponse(response))
        }
      )

      function sendWorkSpace(space, bridge) {

        if (space.isPersisted) {
          bridge.changePath("/work-space/"+space.id)
        }

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

      site.addRoute("get",
        "/work-space/:id/mark-completed/:text",
        function(request, response) {
          var task = request.params.text
          var space = workSpace.get(request.params.id)
          var list = releaseChecklist.get("putw4e")

          releaseChecklist.checkOff(list, task)

          getNewTask(space, list, task)

          tellTheUniverse("releaseChecklist.checkOff", list.id, task)

          sendWorkSpace(space, baseBridge.forResponse(response))
        }
      )

      var skipTo

      site.addRoute("get",
        "/work-space/:spaceId/dont-want/:text",
        function(request, response) {

          var list = releaseChecklist.get("putw4e")
          var space = workSpace.get(request.params.spaceId)
          var task = request.params.text

          getNewTask(space, list, task)

          var bridge = baseBridge.forResponse(response)

          sendWorkSpace(space, bridge)
        }
      )

      function getNewTask(space, list, oldTask) {

        if (oldTask) {
          var nextIndex = list.tasks.indexOf(oldTask) + 1
        } else {
          nextIndex = 0
        }

        var whereWeStarted = nextIndex

        while (list.tasksCompleted[nextIndex]) {
          nextIndex++

          if (!list.tasks[nextIndex]) {
            nextIndex = 0
          }

          if (nextIndex == whereWeStarted) {
            throw new Error("No tasks available")
          }
        }

        console.log("Skipping to", nextIndex)

        var newtask = list.tasks[nextIndex]

        workSpace.focusOn(space, list.id, newtask)

        if (space.isPersisted) {
          saveSkipEventually(space, list.id)
        }
      }

      site.addRoute("get",
        "/work-space/:id/start-working",
        function(request, response) {
          var space = workSpace.get(request.params.id)
          var list = releaseChecklist.get("putw4e")

          saveSkipEventually(space, list.id)

          var bridge = baseBridge.forResponse(response)

          bridge.changePath("/work-space/"+space.id)

          sendWorkSpace(space, bridge)
        }
      )

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
    }
  }
)