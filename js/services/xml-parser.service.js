/**
 * CareerSphere AI — XML Parser Service
 * Parses XML career profiles into raw structured data.
 * Handles multiple XML schemas via flexible tag matching.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('XMLParserService', [function () {

      var XMLParserService = {

        /**
         * Parse XML string into a JS object tree.
         * Returns { success, data, errors: [] }
         */
        parse: function (xmlString) {
          var errors = [];
          if (!xmlString || typeof xmlString !== 'string') {
            return { success: false, data: null, errors: ['Empty or invalid input'] };
          }

          var trimmed = xmlString.trim();
          if (trimmed.length === 0) {
            return { success: false, data: null, errors: ['Empty XML content'] };
          }

          var parser = new DOMParser();
          var doc = parser.parseFromString(trimmed, 'text/xml');

          // Check for parse errors
          var parseError = doc.querySelector('parsererror');
          if (parseError) {
            var msg = parseError.textContent || 'Unknown XML parse error';
            // Extract just the message part
            var match = msg.match(/line \d+.*?: (.*)/);
            errors.push('XML Parse Error: ' + (match ? match[1] : msg.substring(0, 200)));
            return { success: false, data: null, errors: errors };
          }

          try {
            var data = xmlToObject(doc.documentElement);
            return { success: true, data: data, errors: errors };
          } catch (e) {
            errors.push('XML conversion error: ' + e.message);
            return { success: false, data: null, errors: errors };
          }
        },

        /**
         * Detect if a string looks like XML.
         */
        isXML: function (content) {
          if (!content) return false;
          var trimmed = content.trim();
          return trimmed.startsWith('<') && trimmed.endsWith('>') && trimmed.indexOf('<') === 0;
        }
      };

      /**
       * Convert XML DOM node to JS object.
       */
      function xmlToObject(node) {
        var obj = {};

        // Attributes
        if (node.attributes && node.attributes.length > 0) {
          obj._attributes = {};
          for (var i = 0; i < node.attributes.length; i++) {
            var attr = node.attributes[i];
            obj._attributes[attr.name] = attr.value;
          }
        }

        // Child nodes
        var childNodes = node.childNodes;
        var hasElementChildren = false;

        for (var i = 0; i < childNodes.length; i++) {
          var child = childNodes[i];

          if (child.nodeType === 1) { // Element
            hasElementChildren = true;
            var childName = child.nodeName;
            var childValue = xmlToObject(child);

            if (obj[childName]) {
              // Convert to array if multiple same-named children
              if (!Array.isArray(obj[childName])) {
                obj[childName] = [obj[childName]];
              }
              obj[childName].push(childValue);
            } else {
              obj[childName] = childValue;
            }
          } else if (child.nodeType === 3) { // Text
            var text = child.textContent.trim();
            if (text.length > 0) {
              obj._text = text;
            }
          }
        }

        // Simplify: if only _text, return the text
        if (!hasElementChildren && obj._text !== undefined && Object.keys(obj).length === 1) {
          return obj._text;
        }

        // If has text and attributes but no element children
        if (!hasElementChildren && obj._text !== undefined && Object.keys(obj).length === 2 && obj._attributes) {
          obj._value = obj._text;
          return obj;
        }

        return obj;
      }

      return XMLParserService;
    }]);

})(angular);
