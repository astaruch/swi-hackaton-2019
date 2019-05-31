// We make use of this 'server' variable to provide the address of the
// REST Janus API. By default, in this example we assume that Janus is
// co-located with the web server hosting the HTML pages but listening
// on a different port (8088, the default for HTTP in Janus), which is
// why we make use of the 'window.location.hostname' base address. Since
// Janus can also do HTTPS, and considering we don't really want to make
// use of HTTP for Janus if your demos are served on HTTPS, we also rely
// on the 'window.location.protocol' prefix to build the variable, in
// particular to also change the port used to contact Janus (8088 for
// HTTP and 8089 for HTTPS, if enabled).
// In case you place Janus behind an Apache frontend (as we did on the
// online demos at http://janus.conf.meetecho.com) you can just use a
// relative path for the variable, e.g.:
//
//     var server = "/janus";
//
// which will take care of this on its own.
//
//
// If you want to use the WebSockets frontend to Janus, instead, you'll
// have to pass a different kind of address, e.g.:
//
//     var server = "ws://" + window.location.hostname + ":8188";
//
// Of course this assumes that support for WebSockets has been built in
// when compiling the server. WebSockets support has not been tested
// as much as the REST API, so handle with care!
//
//
// If you have multiple options available, and want to let the library
// autodetect the best way to contact your server (or pool of servers),
// you can also pass an array of servers, e.g., to provide alternative
// means of access (e.g., try WebSockets first and, if that fails, fall
// back to plain HTTP) or just have failover servers:
//
//    var server = [
//      "ws://" + window.location.hostname + ":8188",
//      "/janus"
//    ];
//
// This will tell the library to try connecting to each of the servers
// in the presented order. The first working server will be used for
// the whole session.
//
var server = null
if (window.location.protocol === 'http:') { server = 'http://' + window.location.hostname + ':8088/janus' } else { server = 'https://' + window.location.hostname + ':8089/janus' }

var janus = null
var screentest = null
var opaqueId = 'screensharingtest-' + Janus.randomString(12)

var myusername = null
var myid = null

var capture = null
var role = null
var room = null
var source = null

var spinner = null

// Just an helper to generate random usernames
function randomString(len, charSet) {
  charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var randomString = ''
  for (var i = 0; i < len; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length)
    randomString += charSet.substring(randomPoz, randomPoz + 1)
  }
  return randomString
}

function throttle(fn, delay) {
  var timer;
  return function () {
    var last = timer;
    var now = Date.now();
    if (!last) {
      timer = now;
      fn.apply(this, arguments);
      return;
    }
    if (last + delay > now) return;
    timer = now;
    fn.apply(this, arguments);
  }
}

$(document).ready(function () {
  // Initialize the library (all console debuggers enabled)
  Janus.init({
    debug: 'all',
    callback: function () {
      // Use a button to start the demo
      $(this).attr('disabled', true).unbind('click')
      // Make sure the browser supports WebRTC
      if (!Janus.isWebrtcSupported()) {
        bootbox.alert('No WebRTC support... ')
        return
      }
      // Create session
      janus = new Janus(
        {
          server: server,
          success: function () {
            // Attach to video room test plugin
            janus.attach(
              {
                plugin: 'janus.plugin.videoroom',
                opaqueId: opaqueId,
                success: function (pluginHandle) {
                  $('#details').remove()
                  screentest = pluginHandle
                  Janus.log('Plugin attached! (' + screentest.getPlugin() + ', id=' + screentest.getId() + ')')
                  // Prepare the username registration
                  $('#screenmenu').removeClass('hide').show()
                  $('#createnow').removeClass('hide').show()
                  $('#create').click(preShareScreen)
                  $('#joinnow').removeClass('hide').show()
                  $('#join').click(joinScreen)
                  $('#start').removeAttr('disabled').html('Stop')
                    .click(function () {
                      $(this).attr('disabled', true)
                      janus.destroy()
                    })
                },
                error: function (error) {
                  Janus.error('  -- Error attaching plugin...', error)
                  bootbox.alert('Error attaching plugin... ' + error)
                },
                consentDialog: function (on) {
                  Janus.debug('Consent dialog should be ' + (on ? 'on' : 'off') + ' now')
                  if (on) {
                    // Darken screen
                    $.blockUI({
                      message: '',
                      css: {
                        border: 'none',
                        padding: '15px',
                        backgroundColor: 'transparent',
                        color: '#aaa'
                      }
                    })
                  } else {
                    // Restore screen
                    $.unblockUI()
                  }
                },
                webrtcState: function (on) {
                  Janus.log('Janus says our WebRTC PeerConnection is ' + (on ? 'up' : 'down') + ' now')
                  $('#screencapture').parent().unblock()
                  if (on) {
                    bootbox.alert('Your screen sharing session just started: pass the <b>' + room + '</b> session identifier to those who want to attend.')
                  } else {
                    bootbox.alert('Your screen sharing session just stopped.', function () {
                      janus.destroy()
                      window.location.reload()
                    })
                  }
                  document.getElementById('control_exe').click();

                },
                onmessage: function (msg, jsep) {
                  Janus.debug(' ::: Got a message (publisher) :::')
                  Janus.debug(msg)
                  var event = msg['videoroom']
                  Janus.debug('Event: ' + event)
                  if (event != undefined && event != null) {
                    if (event === 'joined') {
                      myid = msg['id']
                      $('#session').html(room)
                      $('#title').html(msg['description'])
                      Janus.log('Successfully joined room ' + msg['room'] + ' with ID ' + myid)
                      if (role === 'publisher') {
                        // This is our session, publish our stream
                        Janus.debug('Negotiating WebRTC stream for our screen (capture ' + capture + ')')
                        screentest.createOffer(
                          {
                            media: { video: capture, audioSend: true, videoRecv: false }, // Screen sharing Publishers are sendonly
                            success: function (jsep) {
                              Janus.debug('Got publisher SDP!')
                              Janus.debug(jsep)
                              var publish = { 'request': 'configure', 'audio': true, 'video': true }
                              screentest.send({ 'message': publish, 'jsep': jsep })
                            },
                            error: function (error) {
                              Janus.error('WebRTC error:', error)
                              bootbox.alert('WebRTC error... ' + JSON.stringify(error))
                            }
                          })
                      } else {
                        // We're just watching a session, any feed to attach to?
                        if (msg['publishers'] !== undefined && msg['publishers'] !== null) {
                          var list = msg['publishers']
                          Janus.debug('Got a list of available publishers/feeds:')
                          Janus.debug(list)
                          for (var f in list) {
                            var id = list[f]['id']
                            var display = list[f]['display']
                            Janus.debug('  >> [' + id + '] ' + display)
                            newRemoteFeed(id, display)
                          }
                        }
                      }
                    } else if (event === 'event') {
                      // Any feed to attach to?
                      if (role === 'listener' && msg['publishers'] !== undefined && msg['publishers'] !== null) {
                        var list = msg['publishers']
                        Janus.debug('Got a list of available publishers/feeds:')
                        Janus.debug(list)
                        for (var f in list) {
                          var id = list[f]['id']
                          var display = list[f]['display']
                          Janus.debug('  >> [' + id + '] ' + display)
                          newRemoteFeed(id, display)
                        }
                      } else if (msg['leaving'] !== undefined && msg['leaving'] !== null) {
                        // One of the publishers has gone away?
                        var leaving = msg['leaving']
                        const liId = '#cl-' + leaving
                        $(liId).remove()
                        console.log(msg)
                        Janus.log('Publisher left: ' + leaving)
                        if (role === 'listener' && msg['leaving'] === source) {
                          bootbox.alert('The screen sharing session is over, the publisher left', function () {
                            window.location.reload()
                          })
                        }
                      } else if (msg['error'] !== undefined && msg['error'] !== null) {
                        bootbox.alert(msg['error'])
                      } else if (msg['joining'] !== undefined) {
                        const newClient = msg['joining']
                        const clientId = 'cl-' + newClient.id
                        $('#subscribers').append('<li id=\'' + clientId + '\'>' + newClient.display + '</li>')
                        console.log(newClient)
                      }
                    }
                  }
                  if (jsep !== undefined && jsep !== null) {
                    Janus.debug('Handling SDP as well...')
                    Janus.debug(jsep)
                    screentest.handleRemoteJsep({ jsep: jsep })
                  }
                },
                onlocalstream: function (stream) {
                  Janus.debug(' ::: Got a local stream :::')
                  Janus.debug(stream)
                  $('#screenmenu').hide()
                  $('#room').removeClass('hide').show()
                  if ($('#screenvideo').length === 0) {
                    $('#screencapture').append('<video class="rounded centered" id="screenvideo" width="100%" height="100%" autoplay playsinline muted="muted"/>')
                  }
                  Janus.attachMediaStream($('#screenvideo').get(0), stream)
                  if (screentest.webrtcStuff.pc.iceConnectionState !== 'completed' &&
                    screentest.webrtcStuff.pc.iceConnectionState !== 'connected') {
                    $('#screencapture').parent().block({
                      message: '<b>Publishing...</b>',
                      css: {
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'white'
                      }
                    })
                  }
                },
                onremotestream: function (stream) {
                  // The publisher stream is sendonly, we don't expect anything here
                  console.log('LOCAL')
                },
                oncleanup: function () {
                  Janus.log(' ::: Got a cleanup notification :::')
                  $('#screencapture').empty()
                  $('#screencapture').parent().unblock()
                  $('#room').hide()
                }
              })
          },
          error: function (error) {
            Janus.error(error)
            bootbox.alert(error, function () {
              window.location.reload()
            })
          },
          destroyed: function () {
            window.location.reload()
          }
        })
    }
  })
})

function checkEnterShare(field, event) {
  var theCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode
  if (theCode === 13) {
    preShareScreen()
    return false
  } else {
    return true
  }
}

function preShareScreen() {
  console.log('PRESHARE SCREEN')

  if (!Janus.isExtensionEnabled()) {
    bootbox.alert("You're using Chrome but don't have the screensharing extension installed: click <b><a href='https://chrome.google.com/webstore/detail/janus-webrtc-screensharin/hapfgfdkleiggjjpfpenajgdnfckjpaj' target='_blank'>here</a></b> to do so", function () {
      window.location.reload()
    })
    return
  }
  // Create a new room
  $('#create').attr('disabled', true).unbind('click')
  $('#roomid').attr('disabled', true)
  $('#join').attr('disabled', true).unbind('click')
  capture = 'screen'
  if (navigator.mozGetUserMedia) {
    // Firefox needs a different constraint for screen and window sharing
    bootbox.dialog({
      title: 'Share whole screen or a window?',
      message: 'Firefox handles screensharing in a different way: are you going to share the whole screen, or would you rather pick a single window/application to share instead?',
      buttons: {
        screen: {
          label: 'Share screen',
          className: 'btn-primary',
          callback: function () {
            capture = 'screen'
            shareScreen()
          }
        },
        window: {
          label: 'Pick a window',
          className: 'btn-success',
          callback: function () {
            capture = 'window'
            shareScreen()
          }
        }
      },
      onEscape: function () {
        $('#create').removeAttr('disabled', true).click(preShareScreen)
        $('#roomid').removeAttr('disabled', true)
        $('#join').removeAttr('disabled', true).click(joinScreen)
      }
    })
  } else {
    shareScreen()
  }
}

function shareScreen() {
  // Create a new room
  var desc = 'Solarwinds hackaton sharing room'
  role = 'publisher'
  var create = { 'request': 'create', 'description': desc, 'bitrate': 500000, 'publishers': 1, 'notify_joining': true }
  screentest.send({
    'message': create,
    success: function (result) {
      var event = result['videoroom']
      Janus.debug('Event: ' + event)
      if (event !== undefined && event != null) {
        // Our own screen sharing session has been created, join it
        room = result['room']
        Janus.log('Screen sharing session created: ' + room)
        myusername = `${window.location.hostname + '-' + randomString(3)}`

        var register = { 'request': 'join', 'room': room, 'ptype': 'publisher', 'display': myusername }
        screentest.send({ 'message': register })
      }
    }

  })
  //   if ('WebSocket' in window) {
  //     console.log('Connecting to WebSocket server to receive mouse coordinates')
  //     var ws = new WebSocket('ws://' + window.location.hostname + ':9999')

  //     ws.onopen = function () {
  //       console.log('WebSocket opened')
  //     }

  //     ws.onmessage = function (evt) {
  //       var coordinates = evt.data.split(' ')
  //       const x = coordinates[0]
  //       const y = coordinates[1]
  //       console.log(`x: ${x}, y: ${y}`)
  //     }

  //     ws.onclose = function () {
  //       console.log('Websocket is closed')
  //     }
  //   } else {
  //     console.error('WEB SOCKETS ARE NOT SUPPORTED')
  //   }
}

function checkEnterJoin(field, event) {
  var theCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode
  if (theCode == 13) {
    joinScreen()
    return false
  } else {
    return true
  }
}

function joinScreen() {
  // Join an existing screen sharing session
  $('#create').attr('disabled', true).unbind('click')
  $('#roomid').attr('disabled', true)
  $('#join').attr('disabled', true).unbind('click')
  var roomid = $('#roomid').val()
  if (isNaN(roomid)) {
    bootbox.alert('Session identifiers are numeric only')
    $('#create').removeAttr('disabled', true).click(preShareScreen)
    $('#roomid').removeAttr('disabled', true)
    $('#join').removeAttr('disabled', true).click(joinScreen)
    return
  }
  room = parseInt(roomid)
  role = 'listener'
  myusername = $('#username').val()
  var register = { 'request': 'join', 'room': room, 'ptype': 'publisher', 'display': myusername }
  screentest.send({ 'message': register })
  console.log('JOINED THE SCREEN')

  if ('WebSocket' in window) {
    console.log('Connecting to WebSocket server to send mouse coordinates')
    var ws = new WebSocket('ws://' + window.location.hostname + ':9999')

    ws.onopen = function () {
      console.log('WebSocket opened')
    }

    ws.onclose = function () {
      console.log('WebSocket is closed')
    }
  } else {
    console.error('WEB SOCKETS ARE NOT SUPPORTED')
  }

  $('#screencapture').focus()

  $('#screencapture').mousemove(_.throttle(function (e) {
    // TODO: we are expecting that we are sharing 1920x1080
    const offsets = $('#screencapture').offset()
    const x = e.clientX - offsets.left
    const y = e.clientY - offsets.top

    const originalX = 1920
    const originalY = 1080

    const divX = $('#screencapture').width()
    const divY = $('#screencapture').height()

    const scalingX = originalX / divX
    const scalingY = originalY / divY

    const msg = `move ${x * scalingX} ${y * scalingY}`
    ws.send(msg)
    console.log(msg)
  }, 50))

  $('#screencapture').mouseup(function (e) {
    const msg = `mouseup`
    ws.send(msg)
    console.log(msg)
  })

  $('#screencapture').mousedown(function (e) {
    const msg = `mousedown`
    ws.send(msg)
    console.log(msg)
  })

  // $('#screencapture').click(function () {
  //   const msg = 'click'
  //   ws.send(msg)
  //   console.log(msg)
  // })

  // $('#screencapture').dblclick(function () {
  //   const msg = 'doubleclick'
  //   ws.send(msg)
  //   console.log(msg)
  // })

  $('#screencapture').bind('keydown', function (e) {
    const msg = `keydown ${e.key === ' ' ? 'space' : e.key.toLowerCase()}`
    ws.send(msg)
    console.log(msg)
  })

  $('#screencapture').bind('keyup', function (e) {
    const msg = `keyup ${e.key === ' ' ? 'space' : e.key.toLowerCase()}`
    ws.send(msg)
    console.log(msg)
  })
}

function newRemoteFeed(id, display) {
  // A new feed has been published, create a new plugin handle and attach to it as a listener
  source = id
  var remoteFeed = null
  janus.attach(
    {
      plugin: 'janus.plugin.videoroom',
      opaqueId: opaqueId,
      success: function (pluginHandle) {
        remoteFeed = pluginHandle
        Janus.log('Plugin attached! (' + remoteFeed.getPlugin() + ', id=' + remoteFeed.getId() + ')')
        Janus.log('  -- This is a subscriber')
        // We wait for the plugin to send us an offer
        var listen = { 'request': 'join', 'room': room, 'ptype': 'listener', 'feed': id }
        remoteFeed.send({ 'message': listen })
      },
      error: function (error) {
        Janus.error('  -- Error attaching plugin...', error)
        bootbox.alert('Error attaching plugin... ' + error)
      },
      onmessage: function (msg, jsep) {
        console.log('MESSAGE')
        Janus.debug(' ::: Got a message (listener) :::')
        Janus.debug(msg)
        var event = msg['videoroom']
        Janus.debug('Event: ' + event)
        if (event != undefined && event != null) {
          if (event === 'attached') {
            // Subscriber created and attached
            if (spinner === undefined || spinner === null) {
              var target = document.getElementById('#screencapture')
              spinner = new Spinner({ top: 100 }).spin(target)
            } else {
              spinner.spin()
            }
            Janus.log('Successfully attached to feed ' + id + ' (' + display + ') in room ' + msg['room'])
            $('#screenmenu').hide()
            $('#room').removeClass('hide').show()
          } else {
            // What has just happened?
          }
        }
        if (jsep !== undefined && jsep !== null) {
          Janus.debug('Handling SDP as well...')
          Janus.debug(jsep)
          // Answer and attach
          remoteFeed.createAnswer(
            {
              jsep: jsep,
              media: { audioSend: false, videoSend: false }, // We want recvonly audio/video
              success: function (jsep) {
                Janus.debug('Got SDP!')
                Janus.debug(jsep)
                var body = { 'request': 'start', 'room': room }
                remoteFeed.send({ 'message': body, 'jsep': jsep })
              },
              error: function (error) {
                Janus.error('WebRTC error:', error)
                bootbox.alert('WebRTC error... ' + error)
              }
            })
        }
      },
      onlocalstream: function (stream) {
        // The subscriber stream is recvonly, we don't expect anything here
        console.log('LOCALSTREAM')
      },

      onremotestream: function (stream) {
        if ($('#screenvideo').length === 0) {
          // No remote video yet
          $('#screencapture').append('<video class="rounded centered" id="waitingvideo" width="100%" height="100%" />')
          $('#screencapture').append('<video class="rounded centered hide" id="screenvideo" width="100%" height="100%" autoplay playsinline/>')
          // Show the video, hide the spinner and show the resolution when we get a playing event
          $('#screenvideo').bind('playing', function () {
            $('#waitingvideo').remove()
            $('#screenvideo').removeClass('hide')
            if (spinner !== null && spinner !== undefined) { spinner.stop() }
            spinner = null
          })
        }
        Janus.attachMediaStream($('#screenvideo').get(0), stream)
      },
      oncleanup: function () {
        Janus.log(' ::: Got a cleanup notification (remote feed ' + id + ') :::')
        $('#waitingvideo').remove()
        if (spinner !== null && spinner !== undefined) { spinner.stop() }
        spinner = null
      }
    })
}
