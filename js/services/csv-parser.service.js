/**
 * CareerSphere AI — CSV Parser Service
 * Parses CSV/TSV/table data into arrays of objects.
 * Handles quoted fields, delimiters, and header mapping.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('CSVParserService', [function () {

      var CSVParserService = {

        /**
         * Parse CSV string into array of row objects.
         * Returns { success, data: [{col: val}], headers: [], errors: [] }
         */
        parse: function (csvString, options) {
          options = options || {};
          var errors = [];
          var delimiter = options.delimiter || detectDelimiter(csvString);

          if (!csvString || typeof csvString !== 'string') {
            return { success: false, data: [], headers: [], errors: ['Empty or invalid input'] };
          }

          var trimmed = csvString.trim();
          if (trimmed.length === 0) {
            return { success: false, data: [], headers: [], errors: ['Empty CSV content'] };
          }

          try {
            var rows = parseCSV(trimmed, delimiter);
            if (rows.length === 0) {
              return { success: false, data: [], headers: [], errors: ['No data rows found'] };
            }

            var headers = rows[0].map(function (h, i) {
              return h && h.trim() ? h.trim() : 'column_' + i;
            });

            var data = [];
            for (var i = 1; i < rows.length; i++) {
              var row = rows[i];
              // Skip empty rows
              if (row.every(function (c) { return !c || c.trim() === ''; })) continue;

              var obj = {};
              for (var j = 0; j < headers.length; j++) {
                obj[headers[j]] = (row[j] || '').trim();
              }
              data.push(obj);
            }

            return { success: true, data: data, headers: headers, errors: errors };
          } catch (e) {
            errors.push('CSV Parse Error: ' + e.message);
            return { success: false, data: [], headers: [], errors: errors };
          }
        },

        /**
         * Detect if content looks like CSV/TSV.
         */
        isCSV: function (content) {
          if (!content) return false;
          var trimmed = content.trim();
          if (trimmed.length < 3) return false;
          // Has multiple lines with consistent delimiter
          var lines = trimmed.split('\n').filter(function (l) { return l.trim(); });
          if (lines.length < 2) return false;
          var firstLine = lines[0];
          return firstLine.indexOf(',') > -1 || firstLine.indexOf('\t') > -1 || firstLine.indexOf(';') > -1;
        }
      };

      function detectDelimiter(content) {
        var firstLine = content.split('\n')[0] || '';
        var commas = (firstLine.match(/,/g) || []).length;
        var tabs = (firstLine.match(/\t/g) || []).length;
        var semicolons = (firstLine.match(/;/g) || []).length;
        if (tabs > commas && tabs > semicolons) return '\t';
        if (semicolons > commas) return ';';
        return ',';
      }

      function parseCSV(text, delimiter) {
        var rows = [];
        var row = [];
        var field = '';
        var inQuotes = false;

        for (var i = 0; i < text.length; i++) {
          var ch = text[i];

          if (inQuotes) {
            if (ch === '"') {
              if (i + 1 < text.length && text[i + 1] === '"') {
                field += '"';
                i++;
              } else {
                inQuotes = false;
              }
            } else {
              field += ch;
            }
          } else {
            if (ch === '"') {
              inQuotes = true;
            } else if (ch === delimiter) {
              row.push(field);
              field = '';
            } else if (ch === '\n' || ch === '\r') {
              if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++;
              row.push(field);
              rows.push(row);
              row = [];
              field = '';
            } else {
              field += ch;
            }
          }
        }
        // Last field/row
        if (field.length > 0 || row.length > 0) {
          row.push(field);
          rows.push(row);
        }
        return rows;
      }

      return CSVParserService;
    }]);

})(angular);
