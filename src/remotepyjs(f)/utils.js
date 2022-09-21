/* eslint-disable no-undef */
/********************************************************************************
 *
 *  Â© 2016 Farukh Tamboli. All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains the property of
 * Farukh Tamboli. The intellectual and technical concepts contained herein are
 * proprietary to Farukh Tamboli and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material is strictly
 * forbidden unless prior written permission is obtained from Farukh Tamboli.
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 ********************************************************************************/

Number.prototype.formatMoney = function (c, d, t) {
  var n = this,
    c = isNaN((c = Math.abs(c))) ? 2 : c,
    d = d == undefined ? '.' : d,
    t = t == undefined ? ',' : t,
    s = n < 0 ? '-' : '',
    i = parseInt((n = Math.abs(+n || 0).toFixed(c))) + '',
    j = (j = i.length) > 3 ? j % 3 : 0;
  return (
    s +
    (j ? i.substr(0, j) + t : '') +
    i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + t) +
    (c
      ? d +
        Math.abs(n - i)
          .toFixed(c)
          .slice(2)
      : '')
  );
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function getSessionId() {
  var data = sessionStorage.getItem('JS2PY_SESSION_ID');
  if (data == null) {
    data = newSessionId();
  }

  //callPythonFunc('startSessionIfNotStarted', {'sessionid': data}, callback);

  return data;
}

function newSessionId() {
  var uuid = guid();
  sessionStorage.setItem('JS2PY_SESSION_ID', uuid);
  return uuid;
}

/* validation custom error messages functions */
function errorPlacement(errorMsg, element) {
  if (errorExists(element)) return;
  var error = document.createElement('LABEL');
  error.setAttribute('id', element.name + '_error');
  error.innerHTML = errorMsg;
  error.style.color = 'red';
  error.style.display = 'block';
  element.parentNode.insertBefore(error, element.nextSibling);
}

function removeError(element) {
  var errorLabel = document.getElementById(element.name + '_error');
  if (errorLabel !== null) {
    errorLabel.parentNode.removeChild(errorLabel);
  }
}

function errorExists(element) {
  var errorLabel = document.getElementById(element.name + '_error');
  if (errorLabel !== null) {
    return true;
  }
  return false;
}
/* validation custom error messages functions */

/* check login with server */
function isLoggedIn(callback) {
  if (typeof callPythonFunc === 'undefined' || callPythonFunc === null) {
    JS2Py.callPythonFunction('isLoggedIn', { sessionid: getSessionId() }, callback);
  } else {
    callPythonFunc('isLoggedIn', { sessionid: getSessionId() }, callback);
  }
}

function isFundCreated(fundname, callback) {
  if (typeof callPythonFunc === 'undefined' || callPythonFunc === null) {
    JS2Py.callPythonFunction(
      'isFundCreated',
      { sessionid: getSessionId(), fundname: fundname },
      callback,
    );
  } else {
    callPythonFunc('isFundCreated', { sessionid: getSessionId(), fundname: fundname }, callback);
  }
}

/* Function to extract parameters from query string or url */
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)', 'i'),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/* tab twitter bootstrap wizard functions*/
function nextTab(elem) {
  $(elem + ' li.active')
    .next()
    .find('a[data-toggle="tab"]')
    .click();
}
function prevTab(elem) {
  $(elem + ' li.active')
    .prev()
    .find('a[data-toggle="tab"]')
    .click();
}

function mergeTemplateWithData(fileName, data, destinationControl) {
  getWebResourceCached(fileName, 0, function (page) {
    // 10000 changed to 0 to refresh right-away
    destinationControl.innerHTML = tmpl(page, data);
  });
}

function FileNotFoundException(message) {
  this.message = message;
  this.name = 'FileNotFoundException';
}

function getWebResourceUncached(fileName, callback) {
  getWebResourceCached(fileName, 0, callback);
}

function getWebResourceCachedForDays(fileName, forceRefreshInDays, callback) {
  getWebResourceCached(fileName, forceRefreshInDays * 24 * 60 * 60, callback);
}

function getWebResourceCached(fileName, forceRefreshInMilliSeconds, callback) {
  var storageKey = 'TMPL_' + fileName;
  var refresh = false;
  localTemplateContent = localStorage.getItem(storageKey);
  if (
    localTemplateContent === undefined ||
    localTemplateContent == null ||
    localTemplateContent == '' ||
    forceRefreshInMilliSeconds == 0
  ) {
    refresh = true;
  } else {
    currentTime = new Date().getTime();
    try {
      localTemplateContent = JSON.parse(localTemplateContent);
    } catch (e) {
      refresh = true;
    }
    if (refresh || currentTime - localTemplateContent.refreshTime > forceRefreshInMilliSeconds) {
      refresh = true;
    }

    if (
      localTemplateContent.refreshTime === undefined ||
      localTemplateContent.refreshTime == null ||
      localTemplateContent.html === undefined ||
      localTemplateContent.html == null
    ) {
      refresh = true;
    }
  }

  if (refresh) {
    var xmlHttp = new XMLHttpRequest();

    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        var htmlText = xmlHttp.responseText;
        var val = { html: htmlText, refreshTime: new Date().getTime() };
        localStorage.setItem(storageKey, JSON.stringify(val));
        callback(htmlText);
        //alert(new Date().getTime() - start);
      } else if (xmlHttp.readyState == 4) {
        throw FileNotFoundException(
          'file ' + fileName + ' not found. Error code:' + xmlHttp.status,
        );
      }
    };

    //start = new Date().getTime();

    xmlHttp.open('GET', fileName, true); // true for asynchronous
    xmlHttp.send(null);
  } else callback(localTemplateContent.html);
}

function exportToCsv(filename, rows) {
  var processRow = function (row) {
    var finalVal = '';
    for (var j = 0; j < row.length; j++) {
      var innerValue = row[j] === null ? '' : row[j].toString();
      if (row[j] instanceof Date) {
        innerValue = row[j].toLocaleString();
      }
      var result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
      if (j > 0) finalVal += ',';
      finalVal += result;
    }
    return finalVal + '\n';
  };

  var csvFile = '';
  for (var i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i]);
  }

  var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    var link = document.createElement('a');
    if (link.download !== undefined) {
      // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

function removeOptions(selectbox) {
  var i;
  for (i = selectbox.options.length - 1; i >= 0; i--) {
    selectbox.remove(i);
  }
}

function resizeiframe(obj) {
  obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
}

exec_body_scripts = function (body_el) {
  // Finds and executes scripts in a newly added element's body.
  // Needed since innerHTML does not run scripts.
  //
  // Argument body_el is an element in the dom.

  function nodeName(elem, name) {
    return elem.nodeName && elem.nodeName.toUpperCase() === name.toUpperCase();
  }

  function evalScript(elem) {
    var data = elem.text || elem.textContent || elem.innerHTML || '',
      head = document.getElementsByTagName('head')[0] || document.documentElement,
      script = document.createElement('script');

    script.type = 'text/javascript';
    try {
      // doesn't work on ie...
      script.appendChild(document.createTextNode(data));
    } catch (e) {
      // IE has funky script nodes
      script.text = data;
    }

    head.insertBefore(script, head.firstChild);
    head.removeChild(script);
  }

  // main section of function
  var scripts = [],
    script,
    children_nodes = body_el.childNodes,
    child,
    i;

  for (i = 0; children_nodes[i]; i++) {
    child = children_nodes[i];
    if (
      nodeName(child, 'script') &&
      (!child.type || child.type.toLowerCase() === 'text/javascript')
    ) {
      scripts.push(child);
    }
  }

  for (i = 0; scripts[i]; i++) {
    script = scripts[i];
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
    evalScript(scripts[i]);
  }
};
