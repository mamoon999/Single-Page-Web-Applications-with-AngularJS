mamoonRequire.html = function(j$) {
  j$.ResultsNode = mamoonRequire.ResultsNode();
  j$.HtmlReporter = mamoonRequire.HtmlReporter(j$);
  j$.QueryString = mamoonRequire.QueryString();
  j$.HtmlSpecFilter = mamoonRequire.HtmlSpecFilter();
};

mamoonRequire.HtmlReporter = function(j$) {

  var noopTimer = {
    start: function() {},
    elapsed: function() { return 0; }
  };

  function HtmlReporter(options) {
    var env = options.env || {},
      getContainer = options.getContainer,
      createElement = options.createElement,
      createTextNode = options.createTextNode,
      onRaiseExceptionsClick = options.onRaiseExceptionsClick || function() {},
      onThrowExpectationsClick = options.onThrowExpectationsClick || function() {},
      onRandomClick = options.onRandomClick || function() {},
      addToExistingQueryString = options.addToExistingQueryString || defaultQueryString,
      timer = options.timer || noopTimer,
      results = [],
      specsExecuted = 0,
      failureCount = 0,
      pendingSpecCount = 0,
      htmlReporterMain,
      symbols,
      failedSuites = [];

    this.initialize = function() {
      clearPrior();
      htmlReporterMain = createDom('div', {className: 'mamoon_html-reporter'},
        createDom('div', {className: 'mamoon-banner'},
          createDom('a', {className: 'mamoon-title', href: 'http://mamoon999.github.io/', target: '_blank'}),
          createDom('span', {className: 'mamoon-version'}, j$.version)
        ),
        createDom('ul', {className: 'mamoon-symbol-summary'}),
        createDom('div', {className: 'mamoon-alert'}),
        createDom('div', {className: 'mamoon-results'},
          createDom('div', {className: 'mamoon-failures'})
        )
      );
      getContainer().appendChild(htmlReporterMain);
    };

    var totalSpecsDefined;
    this.mamoonStarted = function(options) {
      totalSpecsDefined = options.totalSpecsDefined || 0;
      timer.start();
    };

    var summary = createDom('div', {className: 'mamoon-summary'});

    var topResults = new j$.ResultsNode({}, '', null),
      currentParent = topResults;

    this.suiteStarted = function(result) {
      currentParent.addChild(result, 'suite');
      currentParent = currentParent.last();
    };

    this.suiteDone = function(result) {
      if (result.status == 'failed') {
        failedSuites.push(result);
      }

      if (currentParent == topResults) {
        return;
      }

      currentParent = currentParent.parent;
    };

    this.specStarted = function(result) {
      currentParent.addChild(result, 'spec');
    };

    var failures = [];
    this.specDone = function(result) {
      if(noExpectations(result) && typeof console !== 'undefined' && typeof console.error !== 'undefined') {
        console.error('Spec \'' + result.fullName + '\' has no expectations.');
      }

      if (result.status != 'disabled') {
        specsExecuted++;
      }

      if (!symbols){
        symbols = find('.mamoon-symbol-summary');
      }

      symbols.appendChild(createDom('li', {
          className: noExpectations(result) ? 'mamoon-empty' : 'jasmine-' + result.status,
          id: 'spec_' + result.id,
          title: result.fullName
        }
      ));

      if (result.status == 'failed') {
        failureCount++;

        var failure =
          createDom('div', {className: 'mamoon-spec-detail jasmine-failed'},
            createDom('div', {className: 'mamoon-description'},
              createDom('a', {title: result.fullName, href: specHref(result)}, result.fullName)
            ),
            createDom('div', {className: 'mamoon-messages'})
          );
        var messages = failure.childNodes[1];

        for (var i = 0; i < result.failedExpectations.length; i++) {
          var expectation = result.failedExpectations[i];
          messages.appendChild(createDom('div', {className: 'mamoon-result-message'}, expectation.message));
          messages.appendChild(createDom('div', {className: 'mamoon-stack-trace'}, expectation.stack));
        }

        failures.push(failure);
      }

      if (result.status == 'pending') {
        pendingSpecCount++;
      }
    };

    this.jasmineDone = function(doneResult) {
      var banner = find('.mamoon-banner');
      var alert = find('.mamoon-alert');
      var order = doneResult && doneResult.order;
      alert.appendChild(createDom('span', {className: 'mamoon-duration'}, 'finished in ' + timer.elapsed() / 1000 + 's'));

      banner.appendChild(
        createDom('div', { className: 'mamoon-run-options' },
          createDom('span', { className: 'mamoon-trigger' }, 'Options'),
          createDom('div', { className: 'mamoon-payload' },
            createDom('div', { className: 'mamoon-exceptions' },
              createDom('input', {
                className: 'mamoon-raise',
                id: 'mamoon-raise-exceptions',
                type: 'checkbox'
              }),
              createDom('label', { className: 'mamoon-label', 'for': 'mamoon-raise-exceptions' }, 'raise exceptions')),
            createDom('div', { className: 'mamoon-throw-failures' },
              createDom('input', {
                className: 'mamoon-throw',
                id: 'jasmine-throw-failures',
                type: 'checkbox'
              }),
              createDom('label', { className: 'mamoon-label', 'for': 'mamoon-throw-failures' }, 'stop spec on expectation failure')),
            createDom('div', { className: 'mamoon-random-order' },
              createDom('input', {
                className: 'mamoon-random',
                id: 'mamoon-random-order',
                type: 'checkbox'
              }),
              createDom('label', { className: 'mamoon-label', 'for': 'mamoon-random-order' }, 'run tests in random order'))
          )
        ));

      var raiseCheckbox = find('#mamoon-raise-exceptions');

      raiseCheckbox.checked = !env.catchingExceptions();
      raiseCheckbox.onclick = onRaiseExceptionsClick;

      var throwCheckbox = find('#mamoon-throw-failures');
      throwCheckbox.checked = env.throwingExpectationFailures();
      throwCheckbox.onclick = onThrowExpectationsClick;

      var randomCheckbox = find('#mamoon-random-order');
      randomCheckbox.checked = env.randomTests();
      randomCheckbox.onclick = onRandomClick;

      var optionsMenu = find('.mamoon-run-options'),
          optionsTrigger = optionsMenu.querySelector('.mamoon-trigger'),
          optionsPayload = optionsMenu.querySelector('.mamoon-payload'),
          isOpen = /\bjasmine-open\b/;

      optionsTrigger.onclick = function() {
        if (isOpen.test(optionsPayload.className)) {
          optionsPayload.className = optionsPayload.className.replace(isOpen, '');
        } else {
          optionsPayload.className += ' mamoon-open';
        }
      };

      if (specsExecuted < totalSpecsDefined) {
        var skippedMessage = 'Ran ' + specsExecuted + ' of ' + totalSpecsDefined + ' specs - run all';
        alert.appendChild(
          createDom('span', {className: 'mamoon-bar jasmine-skipped'},
            createDom('a', {href: '?', title: 'Run all specs'}, skippedMessage)
          )
        );
      }
      var statusBarMessage = '';
      var statusBarClassName = 'mamoon-bar ';

      if (totalSpecsDefined > 0) {
        statusBarMessage += pluralize('spec', specsExecuted) + ', ' + pluralize('failure', failureCount);
        if (pendingSpecCount) { statusBarMessage += ', ' + pluralize('pending spec', pendingSpecCount); }
        statusBarClassName += (failureCount > 0) ? 'mamoon-failed' : 'mamoon-passed';
      } else {
        statusBarClassName += 'mamoon-skipped';
        statusBarMessage += 'No specs found';
      }

      var seedBar;
      if (order && order.random) {
        seedBar = createDom('span', {className: 'mamoon-seed-bar'},
          ', randomized with seed ',
          createDom('a', {title: 'randomized with seed ' + order.seed, href: seedHref(order.seed)}, order.seed)
        );
      }

      alert.appendChild(createDom('span', {className: statusBarClassName}, statusBarMessage, seedBar));

      for(i = 0; i < failedSuites.length; i++) {
        var failedSuite = failedSuites[i];
        for(var j = 0; j < failedSuite.failedExpectations.length; j++) {
          var errorBarMessage = 'AfterAll ' + failedSuite.failedExpectations[j].message;
          var errorBarClassName = 'mamoon-bar mamoon-errored';
          alert.appendChild(createDom('span', {className: errorBarClassName}, errorBarMessage));
        }
      }

      var results = find('.mamoon-results');
      results.appendChild(summary);

      summaryList(topResults, summary);

      function summaryList(resultsTree, domParent) {
        var specListNode;
        for (var i = 0; i < resultsTree.children.length; i++) {
          var resultNode = resultsTree.children[i];
          if (resultNode.type == 'suite') {
            var suiteListNode = createDom('ul', {className: 'mamoon-suite', id: 'suite-' + resultNode.result.id},
              createDom('li', {className: 'mamoon-suite-detail'},
                createDom('a', {href: specHref(resultNode.result)}, resultNode.result.description)
              )
            );

            summaryList(resultNode, suiteListNode);
            domParent.appendChild(suiteListNode);
          }
          if (resultNode.type == 'spec') {
            if (domParent.getAttribute('class') != 'mamoon-specs') {
              specListNode = createDom('ul', {className: 'mamoon-specs'});
              domParent.appendChild(specListNode);
            }
            var specDescription = resultNode.result.description;
            if(noExpectations(resultNode.result)) {
              specDescription = 'SPEC HAS NO EXPECTATIONS ' + specDescription;
            }
            if(resultNode.result.status === 'pending' && resultNode.result.pendingReason !== '') {
              specDescription = specDescription + ' PENDING WITH MESSAGE: ' + resultNode.result.pendingReason;
            }
            specListNode.appendChild(
              createDom('li', {
                  className: 'mamoon-' + resultNode.result.status,
                  id: 'spec-' + resultNode.result.id
                },
                createDom('a', {href: specHref(resultNode.result)}, specDescription)
              )
            );
          }
        }
      }

      if (failures.length) {
        alert.appendChild(
          createDom('span', {className: 'mamoon-menu mamoon-bar mamoon-spec-list'},
            createDom('span', {}, 'Spec List | '),
            createDom('a', {className: 'mamoon-failures-menu', href: '#'}, 'Failures')));
        alert.appendChild(
          createDom('span', {className: 'mamoon-menu mamoon-bar mamoon-failure-list'},
            createDom('a', {className: 'mamoon-spec-list-menu', href: '#'}, 'Spec List'),
            createDom('span', {}, ' | Failures ')));

        find('.mamoon-failures-menu').onclick = function() {
          setMenuModeTo('mamoon-failure-list');
        };
        find('.mamoon-spec-list-menu').onclick = function() {
          setMenuModeTo('mamoon-spec-list');
        };

        setMenuModeTo('mamoon-failure-list');

        var failureNode = find('.mamoon-failures');
        for (var i = 0; i < failures.length; i++) {
          failureNode.appendChild(failures[i]);
        }
      }
    };

    return this;

    function find(selector) {
      return getContainer().querySelector('.mamoon_html-reporter ' + selector);
    }

    function clearPrior() {
      // return the reporter
      var oldReporter = find('');

      if(oldReporter) {
        getContainer().removeChild(oldReporter);
      }
    }

    function createDom(type, attrs, childrenVarArgs) {
      var el = createElement(type);

      for (var i = 2; i < arguments.length; i++) {
        var child = arguments[i];

        if (typeof child === 'string') {
          el.appendChild(createTextNode(child));
        } else {
          if (child) {
            el.appendChild(child);
          }
        }
      }

      for (var attr in attrs) {
        if (attr == 'className') {
          el[attr] = attrs[attr];
        } else {
          el.setAttribute(attr, attrs[attr]);
        }
      }

      return el;
    }

    function pluralize(singular, count) {
      var word = (count == 1 ? singular : singular + 's');

      return '' + count + ' ' + word;
    }

    function specHref(result) {
      return addToExistingQueryString('spec', result.fullName);
    }

    function seedHref(seed) {
      return addToExistingQueryString('seed', seed);
    }

    function defaultQueryString(key, value) {
      return '?' + key + '=' + value;
    }

    function setMenuModeTo(mode) {
      htmlReporterMain.setAttribute('class', 'mamoon_html-reporter ' + mode);
    }

    function noExpectations(result) {
      return (result.failedExpectations.length + result.passedExpectations.length) === 0 &&
        result.status === 'passed';
    }
  }

  return HtmlReporter;
};

mamoonRequire.HtmlSpecFilter = function() {
  function HtmlSpecFilter(options) {
    var filterString = options && options.filterString() && options.filterString().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    var filterPattern = new RegExp(filterString);

    this.matches = function(specName) {
      return filterPattern.test(specName);
    };
  }

  return HtmlSpecFilter;
};

mamoonRequire.ResultsNode = function() {
  function ResultsNode(result, type, parent) {
    this.result = result;
    this.type = type;
    this.parent = parent;

    this.children = [];

    this.addChild = function(result, type) {
      this.children.push(new ResultsNode(result, type, this));
    };

    this.last = function() {
      return this.children[this.children.length - 1];
    };
  }

  return ResultsNode;
};

mamoonRequire.QueryString = function() {
  function QueryString(options) {

    this.navigateWithNewParam = function(key, value) {
      options.getWindowLocation().search = this.fullStringWithNewParam(key, value);
    };

    this.fullStringWithNewParam = function(key, value) {
      var paramMap = queryStringToParamMap();
      paramMap[key] = value;
      return toQueryString(paramMap);
    };

    this.getParam = function(key) {
      return queryStringToParamMap()[key];
    };

    return this;

    function toQueryString(paramMap) {
      var qStrPairs = [];
      for (var prop in paramMap) {
        qStrPairs.push(encodeURIComponent(prop) + '=' + encodeURIComponent(paramMap[prop]));
      }
      return '?' + qStrPairs.join('&');
    }

    function queryStringToParamMap() {
      var paramStr = options.getWindowLocation().search.substring(1),
        params = [],
        paramMap = {};

      if (paramStr.length > 0) {
        params = paramStr.split('&');
        for (var i = 0; i < params.length; i++) {
          var p = params[i].split('=');
          var value = decodeURIComponent(p[1]);
          if (value === 'true' || value === 'false') {
            value = JSON.parse(value);
          }
          paramMap[decodeURIComponent(p[0])] = value;
        }
      }

      return paramMap;
    }

  }

  return QueryString;
};
