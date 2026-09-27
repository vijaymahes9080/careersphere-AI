/**
 * CareerSphere AI — JSON Parser Service
 * Parses JSON career data into raw structured data.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('JSONParserService', [function () {

      var JSONParserService = {

        /**
         * Parse JSON string into JS object.
         * Returns { success, data, errors: [] }
         */
        parse: function (jsonString) {
          var errors = [];
          if (!jsonString || typeof jsonString !== 'string') {
            return { success: false, data: null, errors: ['Empty or invalid input'] };
          }

          var trimmed = jsonString.trim();
          if (trimmed.length === 0) {
            return { success: false, data: null, errors: ['Empty JSON content'] };
          }

          try {
            var data = JSON.parse(trimmed);
            return { success: true, data: data, errors: errors };
          } catch (e) {
            errors.push('JSON Parse Error: ' + e.message);
            return { success: false, data: null, errors: errors };
          }
        },

        /**
         * Detect if a string looks like JSON.
         */
        isJSON: function (content) {
          if (!content) return false;
          var trimmed = content.trim();
          return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                 (trimmed.startsWith('[') && trimmed.endsWith(']'));
        }
      };

      return JSONParserService;
    }]);

})(angular);
