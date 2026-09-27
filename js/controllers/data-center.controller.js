/**
 * CareerSphere AI — Data Center Controller
 * Upload XML/JSON/CSV/TXT, paste table/text, add notes, inspect parsed
 * data, validate records, view extraction results, remove/reprocess.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    .controller('DataCenterController', [
      '$scope',
      '$timeout',
      'ProfileService',
      'NotificationService',
      function ($scope, $timeout, ProfileService, NotificationService) {
        var vm = this;

        vm.state = ProfileService.state;
        vm.busy = false;

        // Paste / note form
        vm.paste = { name: '', format: 'auto', content: '' };
        vm.inspecting = null;

        vm.onFiles = function (files) {
          if (!files || !files.length) return;
          vm.busy = true;
          // Process sequentially to keep toast order readable
          var idx = 0;
          function next() {
            if (idx >= files.length) {
              vm.busy = false;
              $scope.$applyAsync();
              return;
            }
            var file = files[idx++];
            ProfileService.ingestFile(file).then(function () {
              $timeout(next, 60);
            });
          }
          next();
        };

        vm.submitPaste = function () {
          if (!vm.paste.content || !vm.paste.content.trim()) {
            NotificationService.error('Paste some content first.');
            return;
          }
          var name = vm.paste.name || ('pasted-' + (vm.paste.format === 'auto' ? 'data' : vm.paste.format) + '-' + Date.now() + '.txt');
          var format = vm.paste.format === 'auto' ? null : vm.paste.format;
          ProfileService.ingestText(vm.paste.content, { name: name, format: format });
          vm.paste = { name: '', format: 'auto', content: '' };
        };

        vm.addNote = function () {
          vm.paste.format = 'txt';
          if (!vm.paste.name) vm.paste.name = 'note-' + new Date().toISOString().substring(0, 10) + '.txt';
          vm.submitPaste();
        };

        vm.remove = function (ds) {
          ProfileService.removeDataset(ds.id);
        };

        vm.reprocess = function (ds) {
          ProfileService.reprocessDataset(ds.id);
        };

        vm.inspect = function (ds) {
          vm.inspecting = {
            dataset: ds,
            parsedPreview: ds.raw ? formatParsed(ds) : 'Raw text not persisted (storage limit) — re-import to inspect.',
            extraction: ds.extraction || null
          };
        };

        vm.closeInspect = function () {
          vm.inspecting = null;
        };

        function formatParsed(ds) {
          try {
            if (ds.format === 'json' || ds.format === 'xml') {
              var parsed = JSON.parse(ds.raw);
              return JSON.stringify(parsed, null, 2).substring(0, 4000);
            }
            if (ds.format === 'csv') {
              var lines = ds.raw.split('\n').slice(0, 12);
              return lines.join('\n').substring(0, 4000);
            }
            return ds.raw.substring(0, 4000);
          } catch (e) {
            if (ds.format === 'xml') {
              return ds.raw.substring(0, 4000);
            }
            return ds.raw ? ds.raw.substring(0, 4000) : '';
          }
        }

        vm.datasets = function () {
          return ProfileService.state.datasets;
        };

        vm.quality = function () {
          var a = ProfileService.state.analyses;
          return a ? a.quality : { warnings: [], errors: [] };
        };

        // Memoized summary (fresh objects in watchers cause infinite digests)
        vm.summaryCache = null;
        $scope.$watch(function () { return ProfileService.state.analyses; }, function (analyses) {
          if (!analyses) {
            vm.summaryCache = null;
            return;
          }
          var p = ProfileService.state.profile;
          vm.summaryCache = {
            skills: p.skills.length,
            projects: p.projects.length,
            certificates: p.certificates.length,
            roles: p.targetRoles.length,
            opportunities: p.opportunities.length,
            sources: p.sourceDocuments.length
          };
        });

        vm.summary = function () {
          return vm.summaryCache;
        };

        vm.loadDemo = function () {
          vm.busy = true;
          ProfileService.loadDemo().finally(function () {
            vm.busy = false;
            $scope.$applyAsync();
          });
        };

        vm.purgeDemo = function () {
          ProfileService.purgeDemo();
        };

        vm.hasDemo = function () {
          return ProfileService.state.datasets.some(function (d) { return d.isDemo; });
        };

        vm.statusIcon = function (ds) {
          return ds.status === 'error' ? '✗' : (ds.status === 'processed' ? '✓' : '◌');
        };

        vm.entityLine = function (ds) {
          if (!ds.entities) return '—';
          var e = ds.entities;
          var parts = [];
          if (e.skills) parts.push(e.skills + ' skills');
          if (e.projects) parts.push(e.projects + ' projects');
          if (e.certificates) parts.push(e.certificates + ' certs');
          if (e.education) parts.push(e.education + ' education');
          if (e.experience) parts.push(e.experience + ' exp');
          if (e.roles) parts.push(e.roles + ' roles');
          if (e.opportunities) parts.push(e.opportunities + ' opps');
          if (e.other) parts.push(e.other + ' other');
          return parts.join(' · ') || '—';
        };

        vm.formatDate = function (iso) {
          if (!iso) return '—';
          try { return new Date(iso).toLocaleString(); } catch (e) { return iso; }
        };
      }
    ]);

})(angular);
