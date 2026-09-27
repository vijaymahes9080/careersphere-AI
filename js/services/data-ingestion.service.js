/**
 * CareerSphere AI — Data Ingestion Service
 * Orchestrates format detection, file reading, parsing and normalization.
 * Supported: XML, JSON, CSV/table, TXT/Markdown/resume text.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('DataIngestionService', [
      '$q',
      'XMLParserService',
      'JSONParserService',
      'CSVParserService',
      'TextExtractionService',
      'NormalizationService',
      function ($q, XMLParserService, JSONParserService, CSVParserService, TextExtractionService, NormalizationService) {

        var MAX_SIZE = 5 * 1024 * 1024; // 5 MB
        var SUPPORTED_EXT = ['xml', 'json', 'csv', 'tsv', 'txt', 'md', 'markdown'];

        /**
         * Detect format from filename extension and/or content sniffing.
         */
        function detectFormat(name, content) {
          var ext = '';
          if (name && name.indexOf('.') > -1) {
            ext = name.split('.').pop().toLowerCase();
          }
          var byExt = {
            xml: 'xml',
            json: 'json',
            csv: 'csv',
            tsv: 'csv',
            txt: 'txt',
            md: 'txt',
            markdown: 'txt'
          };
          if (ext) {
            if (byExt[ext]) return byExt[ext];
            // Unknown extension → sniff content before rejecting
          }
          var t = (content || '').trim();
          if (!t) return ext ? null : 'txt';
          if (t.charAt(0) === '<') return 'xml';
          if ((t.charAt(0) === '{' || t.charAt(0) === '[') && JSONParserService.isJSON(t)) return 'json';
          if (CSVParserService.isCSV(t)) return 'csv';
          return 'txt';
        }

        /**
         * Read a File object (from input[type=file] or drag/drop).
         * Returns promise: { name, content, format, size }
         */
        function readFile(file) {
          var deferred = $q.defer();
          if (!file) {
            deferred.reject({ errors: ['No file provided'] });
            return deferred.promise;
          }
          var ext = file.name.indexOf('.') > -1 ? file.name.split('.').pop().toLowerCase() : '';
          if (SUPPORTED_EXT.indexOf(ext) === -1 && file.type.indexOf('text') !== 0 && file.type !== 'application/json' && file.type !== 'application/xml' && file.type !== 'text/xml') {
            deferred.reject({ errors: ['Unsupported format: .' + (ext || 'unknown') + '. Supported: ' + SUPPORTED_EXT.join(', ')] });
            return deferred.promise;
          }
          if (file.size > MAX_SIZE) {
            deferred.reject({ errors: ['File too large (' + Math.round(file.size / 1024) + ' KB). Maximum is 5 MB.'] });
            return deferred.promise;
          }

          var reader = new FileReader();
          reader.onload = function (e) {
            var content = e.target.result || '';
            deferred.resolve({
              name: file.name,
              content: content,
              format: detectFormat(file.name, content),
              size: file.size
            });
          };
          reader.onerror = function () {
            deferred.reject({ errors: ['Could not read file: ' + (reader.error ? reader.error.message : 'unknown error')] });
          };
          reader.readAsText(file);
          return deferred.promise;
        }

        /**
         * Ingest raw content with metadata.
         * Returns { ok, format, profile, warnings, errors, extraction, parsed, recordCount, entities }
         */
        function ingest(content, meta) {
          meta = meta || {};
          var name = meta.name || 'untitled';
          var format = meta.format || detectFormat(name, content);
          var errors = [];
          var warnings = [];

          if (content === null || content === undefined || (typeof content === 'string' && content.trim().length === 0)) {
            return { ok: false, format: format, errors: ['File is empty. Nothing to process.'], warnings: [], profile: null };
          }
          if (!format) {
            return { ok: false, format: null, errors: ['Unsupported file type for "' + name + '". Supported: XML, JSON, CSV, TXT, MD.'], warnings: [], profile: null };
          }

          var parsed = null;
          var extraction = null;

          if (format === 'xml') {
            var xmlRes = XMLParserService.parse(content);
            if (!xmlRes.success) {
              return { ok: false, format: format, errors: xmlRes.errors, warnings: [], profile: null };
            }
            parsed = xmlRes.data;
          } else if (format === 'json') {
            var jsonRes = JSONParserService.parse(content);
            if (!jsonRes.success) {
              return { ok: false, format: format, errors: jsonRes.errors, warnings: [], profile: null };
            }
            parsed = jsonRes.data;
          } else if (format === 'csv') {
            var csvRes = CSVParserService.parse(content, { delimiter: meta.delimiter });
            if (!csvRes.success) {
              return { ok: false, format: format, errors: csvRes.errors, warnings: [], profile: null };
            }
            parsed = csvRes.data;
            if (csvRes.data.length === 0) {
              warnings.push('CSV parsed but no data rows found below the header.');
            }
          } else {
            // Unstructured text: run the extraction pipeline
            extraction = TextExtractionService.extract(content);
            parsed = { text: content };
            if (extraction.skills.length === 0 && extraction.roles.length === 0 && extraction.education.length === 0) {
              warnings.push('No career entities detected in this text. Results may be incomplete.');
            }
          }

          var norm = NormalizationService.normalize(parsed, name, format, extraction);
          warnings = warnings.concat(norm.warnings);

          return {
            ok: true,
            format: format,
            profile: norm.profile,
            warnings: warnings,
            errors: errors,
            extraction: extraction,
            parsed: parsed,
            recordCount: countRecords(norm.profile),
            entities: entityCounts(norm.profile)
          };
        }

        function countRecords(profile) {
          return profile.skills.length + profile.projects.length + profile.certificates.length +
            profile.education.length + profile.experience.length + profile.internships.length +
            profile.targetRoles.length + profile.opportunities.length + profile.interests.length +
            profile.careerGoals.length + profile.achievements.length + profile.learningHistory.length;
        }

        function entityCounts(profile) {
          return {
            skills: profile.skills.length,
            projects: profile.projects.length,
            certificates: profile.certificates.length,
            education: profile.education.length,
            experience: profile.experience.length + profile.internships.length,
            roles: profile.targetRoles.length,
            opportunities: profile.opportunities.length,
            other: profile.interests.length + profile.careerGoals.length + profile.achievements.length
          };
        }

        return {
          detectFormat: detectFormat,
          readFile: readFile,
          ingest: ingest,
          SUPPORTED_EXT: SUPPORTED_EXT
        };
      }
    ]);

})(angular);
