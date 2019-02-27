var pages = []

window.addEventListener('load', function (event) {
  event.preventDefault()
  bindLinksAndForm()
  window.addEventListener('popstate', browseBack)
})

function bindLinksAndForm() {
  var iframe = document.getElementById('application-iframe')
  var links = document.getElementsByTagName('a')
  for (var i = 0, len = links.length; i < len; i++) {
    links[i].onclick = clickLink
  }
  links = iframe.contentDocument.getElementsByTagName('a')
  for (i = 0, len = links.length; i < len; i++) {
    links[i].onclick = clickLink
  }
  var form = iframe.contentDocument.getElementById('submit-form')
  if (form) {
    form.addEventListener('submit', submitForm)
  }
}
function browseBack(event) {
  event.preventDefault()
  pages.pop()
  var state = pages.pop()
  return parseResponse(state.response, state.url)
}

function clickLink(event) {
  event.preventDefault()
  return send(event.target.href, null, 'GET', function (error, response) {
    if (error) {
      throw error
    }
    return parseResponse(response, event.target.href)
  })
}

function submitForm(event) {
  event.preventDefault()
  var form = event.target
  var buttons = Array.slice(form.getElementsByTagName('button'))
  var inputs = Array.slice(form.getElementsByTagName('input'))
  var selects = Array.slice(form.getElementsByTagName('select'))
  var textareas = Array.slice(form.getElementsByTagName('textarea'))
  var nameValues = Array.concat(buttons).concat(inputs)
  var postData = {}
  for (let i = 0, len = nameValues.length; i < len; i++) {
    var input = nameValues[i]
    if (!input.name || !input.name.length) {
      continue
    }
    postData[input.name] = input.value || ''
  }
  for (i = 0, len = selects.length; i < len; i++) {
    var select = selects[i]
    if (!select.name || !select.name.length) {
      continue
    }
    postData[select.name] = select.options[select.selectedIndex].value || ''
  }
  for (i = 0, len = textareas.length; i < len; i++) {
    var textarea = textareas[i]
    if (!textarea.name || !textarea.name.length) {
      continue
    }
    postData[textarea.name] = textarea.innerText || ''
  }
  return send(form.action, postData, 'POST', function (error, response) {
    if (error) {
      throw error
    }
    return parseResponse(response, form.action)
  })
}

function parseResponse(response, url) {
  var htmlDoc = (new DOMParser).parseFromString(response, 'text/html')
  var newNavigation = htmlDoc.getElementById('navigation')
  if (!newNavigation) {
    document.head.innerHTML = htmlDoc.head.innerHTML
    document.body.innerHTML = htmlDoc.body.innerHTML
    return
  }
  var navigation = document.getElementById('navigation')
  navigation.innerHTML = newNavigation.innerHTML
  var links = navigation.getElementsByTagName('a')
  for (var i = 0, len = links.length; i < len; i++) {
    links[i].onclick = clickLink
  }
  var newIframe = htmlDoc.getElementById('application-iframe')
  var iframe = document.getElementById('application-iframe')
  iframe.onload = function () {
    document.title = iframe.contentDocument.title
  }
  iframe.srcdoc = newIframe.srcdoc
  if (!noHistory) {
    var state = { response: response, url: url }
    pages.push(state)
    window.history.pushState(state, document.title, url)
  }
  bindLinksAndForm()
  return false
}

function send(url, data, method, callback) {
  var postData
  if (data) {
    var arr = []
    for (var key in data) {
      const encoded = encodeURI(data[key])
      const decoded = decodeURI(encoded)
      if (decoded !== data[key]) {
        throw new Error('encoding error')
      }
      arr.push(key + '=' + encoded)
    }
    postData = arr.join('&')
  }
  var x = getRequestObject()
  x.open(method, url, true)
  x.onreadystatechange = function () {
    if (x.readyState !== 4) {
      return
    }
    return callback(null, x.responseText)
  }
  if (!postData) {
    return x.send()
  }
  return x.send(postData)
}

var useXMLHttpRequest, compatibleActiveXObject

function getRequestObject() {
  if (useXMLHttpRequest || typeof XMLHttpRequest !== 'undefined') {
    useXMLHttpRequest = true
    return new window.XMLHttpRequest()
  }
  if (compatibleActiveXObject !== null) {
    return new window.ActiveXObject(compatibleActiveXObject)
  }
  var xhr
  var xhrversions = ['MSXML2.XmlHttp.5.0', 'MSXML2.XmlHttp.4.0', 'MSXML2.XmlHttp.3.0', 'MSXML2.XmlHttp.2.0', 'Microsoft.XmlHttp']
  for (var i = 0, len = xhrversions.length; i < len; i++) {
    try {
      xhr = new window.ActiveXObject(xhrversions[i])
      compatibleActiveXObject = xhrversions[i]
      return xhr
    } catch (e) { }
  }
}
