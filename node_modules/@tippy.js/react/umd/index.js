(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('tippy.js'), require('react'), require('react-dom'), require('prop-types')) :
  typeof define === 'function' && define.amd ? define(['exports', 'tippy.js', 'react', 'react-dom', 'prop-types'], factory) :
  (global = global || self, factory(global.Tippy = {}, global.tippy, global.React, global.ReactDOM, global.PropTypes));
}(this, function (exports, tippy, React, reactDom, PropTypes) { 'use strict';

  tippy = tippy && tippy.hasOwnProperty('default') ? tippy['default'] : tippy;
  var React__default = 'default' in React ? React['default'] : React;
  PropTypes = PropTypes && PropTypes.hasOwnProperty('default') ? PropTypes['default'] : PropTypes;

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }

    return target;
  }

  var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  function preserveRef(ref, node) {
    if (ref) {
      if (typeof ref === 'function') {
        ref(node);
      }

      if ({}.hasOwnProperty.call(ref, 'current')) {
        ref.current = node;
      }
    }
  }
  function ssrSafeCreateDiv() {
    return isBrowser && document.createElement('div');
  }
  function updateClassName(tooltip, action, classNames) {
    classNames.split(/\s+/).forEach(function (name) {
      if (name) {
        tooltip.classList[action](name);
      }
    });
  }
  function useInstance(initialValue) {
    if (initialValue === void 0) {
      initialValue = {};
    }

    // Using refs instead of state as it's recommended to not store imperative
    // values in state due to memory problems in React(?)
    var ref = React.useRef();

    if (!ref.current) {
      ref.current = typeof initialValue === 'function' ? initialValue() : initialValue;
    }

    return ref.current;
  }

  // get around it, we can conditionally useEffect on the server (no-op) and
  // useLayoutEffect in the browser. We need useLayoutEffect because we want Tippy
  // to perform sync mutations to the DOM elements after renders to prevent
  // jitters/jumps, especially when updating content.

  var useIsomorphicLayoutEffect = isBrowser ? React.useLayoutEffect : React.useEffect;

  function Tippy(_ref) {
    var children = _ref.children,
        content = _ref.content,
        className = _ref.className,
        onCreate = _ref.onCreate,
        isVisible = _ref.isVisible,
        isEnabled = _ref.isEnabled,
        visible = _ref.visible,
        enabled = _ref.enabled,
        _ref$ignoreAttributes = _ref.ignoreAttributes,
        ignoreAttributes = _ref$ignoreAttributes === void 0 ? true : _ref$ignoreAttributes,
        _ref$multiple = _ref.multiple,
        multiple = _ref$multiple === void 0 ? true : _ref$multiple,
        restOfNativeProps = _objectWithoutPropertiesLoose(_ref, ["children", "content", "className", "onCreate", "isVisible", "isEnabled", "visible", "enabled", "ignoreAttributes", "multiple"]);

    // `isVisible` / `isEnabled` renamed to `visible` / `enabled`
    enabled = enabled !== undefined ? enabled : isEnabled !== undefined ? isEnabled : true;
    visible = visible !== undefined ? visible : isVisible;
    var isControlledMode = visible !== undefined;

    var _useState = React.useState(false),
        mounted = _useState[0],
        setMounted = _useState[1];

    var component = useInstance(function () {
      return {
        container: ssrSafeCreateDiv(),
        renders: 1
      };
    });

    var options = _extends({
      ignoreAttributes: ignoreAttributes,
      multiple: multiple
    }, restOfNativeProps, {
      content: component.container
    });

    if (isControlledMode) {
      options.trigger = 'manual';
    }

    useIsomorphicLayoutEffect(function () {
      var instance = tippy(component.ref, options);
      component.instance = instance;

      if (onCreate) {
        onCreate(instance);
      }

      if (!enabled) {
        instance.disable();
      }

      if (visible) {
        instance.show();
      }

      setMounted(true);
      return function () {
        instance.destroy();
      };
    }, [children.type]);
    useIsomorphicLayoutEffect(function () {
      // Prevent this effect from running on 1st render
      if (component.renders === 1) {
        component.renders++;
        return;
      }

      var instance = component.instance;
      instance.set(options);

      if (enabled) {
        instance.enable();
      } else {
        instance.disable();
      }

      if (isControlledMode) {
        if (visible) {
          instance.show();
        } else {
          instance.hide();
        }
      }
    });
    useIsomorphicLayoutEffect(function () {
      if (className) {
        var tooltip = component.instance.popperChildren.tooltip;
        updateClassName(tooltip, 'add', className);
        return function () {
          updateClassName(tooltip, 'remove', className);
        };
      }
    }, [className]);
    return React__default.createElement(React__default.Fragment, null, React.cloneElement(children, {
      ref: function ref(node) {
        component.ref = node;
        preserveRef(children.ref, node);
      }
    }), mounted && reactDom.createPortal(content, component.container));
  }

  if (process.env.NODE_ENV !== 'production') {
    var ContentType = PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.element]);
    Tippy.propTypes = {
      content: PropTypes.oneOfType([ContentType, PropTypes.arrayOf(ContentType)]).isRequired,
      children: PropTypes.element.isRequired,
      onCreate: PropTypes.func,
      isVisible: PropTypes.bool,
      // deprecated
      isEnabled: PropTypes.bool,
      // deprecated
      visible: PropTypes.bool,
      enabled: PropTypes.bool,
      className: PropTypes.string
    };
  }

  var Tippy$1 = React.forwardRef(function TippyWrapper(_ref2, _ref3) {
    var children = _ref2.children,
        props = _objectWithoutPropertiesLoose(_ref2, ["children"]);

    return React__default.createElement(Tippy, props, React.cloneElement(children, {
      ref: function ref(node) {
        preserveRef(_ref3, node);
        preserveRef(children.ref, node);
      }
    }));
  });

  function TippyGroup(_ref) {
    var children = _ref.children,
        props = _objectWithoutPropertiesLoose(_ref, ["children"]);

    var component = useInstance({
      instances: []
    });
    React.useEffect(function () {
      component.instances = component.instances.filter(function (i) {
        return !i.state.isDestroyed;
      });
      tippy.group(component.instances, props);
    });
    return React.Children.map(children, function (child) {
      return React.cloneElement(child, {
        onCreate: function onCreate(instance) {
          if (child.props.onCreate) {
            child.props.onCreate(instance);
          }

          component.instances.push(instance);
        }
      });
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    TippyGroup.propTypes = {
      children: PropTypes.arrayOf(PropTypes.element).isRequired
    };
  }

  exports.tippy = tippy;
  exports.TippyGroup = TippyGroup;
  exports.default = Tippy$1;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.js.map
