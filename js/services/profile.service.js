/**
 * CareerSphere AI — Profile Service (central state + pipeline orchestrator)
 *
 * Holds the current CareerProfile, datasets and analysis results, and runs
 * the mandatory pipeline:
 *   INGESTION → PARSING → NORMALIZATION → ENTITY EXTRACTION →
 *   RELATIONSHIP BUILDING → ANALYSIS → VISUALIZATION
 *
 * New datasets can be added without touching the dashboard: everything is
 * re-derived from raw datasets on rebuild().
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('ProfileService', [
      '$q',
      '$http',
      'StorageService',
      'DataIngestionService',
      'NormalizationService',
      'EntityService',
      'RelationshipService',
      'EvidenceService',
      'SkillAnalysisService',
      'ProjectAnalysisService',
      'CareerAnalysisService',
      'DataQualityService',
      'VisualizationService',
      'NotificationService',
      'CareerProfileModel',
      function ($q, $http, StorageService, DataIngestionService, NormalizationService,
        EntityService, RelationshipService, EvidenceService, SkillAnalysisService,
        ProjectAnalysisService, CareerAnalysisService, DataQualityService,
        VisualizationService, NotificationService, CareerProfileModel) {

        var state = {
          profile: CareerProfileModel.createEmpty(),
          datasets: [],
          analyses: null,       // full analysis bundle
          settings: {
            theme: 'dark',
            selectedRoleId: '',
            skillFilter: 'All',
            learningProgress: {},
            analyzedAt: null
          },
          report: null,         // "Analyze My Career" report
          busy: false,
          pipelineLog: []
        };

        var DEMO_FILES = [
          { url: 'data/demo/sample-career-profile.xml', name: 'demo-career-profile.xml' },
          { url: 'data/demo/sample-projects.json', name: 'demo-projects.json' },
          { url: 'data/demo/sample-skill-matrix.csv', name: 'demo-skill-matrix.csv' },
          { url: 'data/demo/sample-resume.txt', name: 'demo-resume.txt' },
          { url: 'data/demo/sample-target-roles.json', name: 'demo-target-roles.json' },
          { url: 'data/demo/sample-opportunities.json', name: 'demo-opportunities.json' }
        ];

        // ── init ───────────────────────────────────────────────────────

        function init() {
          var savedProfile = StorageService.loadProfile();
          var savedDatasets = StorageService.loadDatasets();
          var savedSettings = StorageService.loadSettings();

          if (savedSettings && savedSettings.theme) {
            state.settings = angular.extend(state.settings, savedSettings);
          }
          if (savedDatasets && savedDatasets.length) {
            state.datasets = savedDatasets;
          }
          if (savedProfile && savedProfile.skills) {
            state.profile = savedProfile;
            // Re-run analysis (cached raw data → fast)
            rebuild('restore');
          } else {
            rebuild('init');
          }
        }

        // ── dataset ingestion ─────────────────────────────────────────

        /**
         * Ingest raw content. Returns a result object (sync).
         */
        function ingestText(content, meta) {
          var res = DataIngestionService.ingest(content, meta);
          if (!res.ok) {
            NotificationService.error('Import failed: ' + (res.errors[0] || 'unknown error'));
            // Keep a record so the user can see / remove the failed dataset
            state.datasets.push({
              id: 'ds_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              name: meta.name || 'untitled',
              format: res.format || 'unknown',
              raw: content,
              isDemo: !!meta.isDemo,
              status: 'error',
              errors: res.errors,
              warnings: [],
              recordCount: 0,
              entities: null,
              lastProcessed: new Date().toISOString()
            });
            save();
            rebuild('ingest-error');
            return res;
          }

          state.datasets.push({
            id: 'ds_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: meta.name || 'untitled',
            format: res.format,
            raw: content,
            isDemo: !!meta.isDemo,
            status: 'processed',
            errors: [],
            warnings: res.warnings,
            recordCount: res.recordCount,
            entities: res.entities,
            extraction: res.extraction ? summarizeExtraction(res.extraction) : null,
            lastProcessed: new Date().toISOString()
          });
          save();
          rebuild('ingest');
          NotificationService.success('Imported "' + meta.name + '" (' + res.recordCount + ' records)');
          return res;
        }

        /**
         * Ingest a File via FileReader (async).
         */
        function ingestFile(file) {
          state.busy = true;
          return DataIngestionService.readFile(file).then(function (loaded) {
            state.busy = false;
            return ingestText(loaded.content, { name: loaded.name, format: loaded.format });
          }, function (err) {
            state.busy = false;
            var msg = (err && err.errors && err.errors[0]) || 'Could not read file';
            NotificationService.error(msg);
            return { ok: false, errors: err && err.errors };
          });
        }

        function removeDataset(id) {
          state.datasets = state.datasets.filter(function (d) { return d.id !== id; });
          save();
          rebuild('remove');
          NotificationService.info('Dataset removed and profile reprocessed.');
        }

        function reprocessDataset(id) {
          var ds = findDataset(id);
          if (!ds) return;
          var res = DataIngestionService.ingest(ds.raw, { name: ds.name, format: ds.format });
          if (res.ok) {
            ds.status = 'processed';
            ds.errors = [];
            ds.warnings = res.warnings;
            ds.recordCount = res.recordCount;
            ds.entities = res.entities;
            ds.extraction = res.extraction ? summarizeExtraction(res.extraction) : null;
          } else {
            ds.status = 'error';
            ds.errors = res.errors;
          }
          ds.lastProcessed = new Date().toISOString();
          save();
          rebuild('reprocess');
          NotificationService.info('Reprocessed "' + ds.name + '".');
        }

        function clearAllData() {
          state.profile = CareerProfileModel.createEmpty();
          state.datasets = [];
          state.report = null;
          StorageService.clearAll();
          state.settings.learningProgress = {};
          rebuild('clear');
          NotificationService.info('All data cleared.');
        }

        // ── demo data ─────────────────────────────────────────────────

        function loadDemo() {
          state.busy = true;
          var promises = DEMO_FILES.map(function (f) {
            return $http.get(f.url, { transformResponse: function (data) { return data; } }).then(
              function (resp) {
                return { name: f.name, content: resp.data, ok: true };
              },
              function () { return { name: f.name, ok: false }; }
            );
          });
          return $q.all(promises).then(function (results) {
            state.busy = false;
            var loaded = 0;
            results.forEach(function (r) {
              if (!r.ok || !r.content) {
                NotificationService.warn('Could not load demo file ' + r.name + ' — serve the app over HTTP (node server.js).');
                return;
              }
              // Replace existing demo datasets with same name
              state.datasets = state.datasets.filter(function (d) { return !(d.isDemo && d.name === r.name); });
              var res = DataIngestionService.ingest(r.content, { name: r.name, isDemo: true });
              if (res.ok) {
                loaded++;
                state.datasets.push({
                  id: 'demo_' + r.name.replace(/[^a-z0-9]/gi, '_'),
                  name: r.name,
                  format: res.format,
                  raw: r.content,
                  isDemo: true,
                  status: 'processed',
                  errors: [],
                  warnings: res.warnings,
                  recordCount: res.recordCount,
                  entities: res.entities,
                  extraction: res.extraction ? summarizeExtraction(res.extraction) : null,
                  lastProcessed: new Date().toISOString()
                });
              } else {
                state.datasets.push({
                  id: 'demo_' + r.name.replace(/[^a-z0-9]/gi, '_'),
                  name: r.name, format: res.format || 'unknown', raw: r.content, isDemo: true,
                  status: 'error', errors: res.errors, warnings: [], recordCount: 0,
                  lastProcessed: new Date().toISOString()
                });
              }
            });
            save();
            rebuild('demo');
            if (loaded) {
              NotificationService.success('Loaded ' + loaded + ' DEMO datasets — clearly labeled, never mixed with your own data.');
            }
            return loaded;
          });
        }

        function purgeDemo() {
          var hadDemo = state.datasets.some(function (d) { return d.isDemo; });
          state.datasets = state.datasets.filter(function (d) { return !d.isDemo; });
          save();
          rebuild('purge-demo');
          if (hadDemo) NotificationService.info('Demo datasets removed.');
        }

        // ── the pipeline ──────────────────────────────────────────────

        function rebuild(reason) {
          var log = [];
          var t0 = (window.performance && performance.now) ? performance.now() : Date.now();

          function stamp(step) {
            var t1 = (window.performance && performance.now) ? performance.now() : Date.now();
            log.push({ step: step, ms: Math.round((t1 - t0) * 10) / 10 });
          }

          // 1. INGESTION + PARSING + NORMALIZATION (re-run from stored raw data)
          var profile = CareerProfileModel.createEmpty();
          state.datasets.forEach(function (ds) {
            var res = DataIngestionService.ingest(ds.raw, { name: ds.name, format: ds.format });
            if (res.ok) {
              profile = NormalizationService.mergeProfile(profile, res.profile);
              ds.status = 'processed';
              ds.errors = [];
              ds.warnings = res.warnings;
              ds.recordCount = res.recordCount;
              ds.entities = res.entities;
              if (res.extraction) ds.extraction = summarizeExtraction(res.extraction);
            } else {
              ds.status = 'error';
              ds.errors = res.errors;
            }
            ds.lastProcessed = new Date().toISOString();
          });
          stamp('ingest-parse-normalize');

          // Preserve identity across merges if it was empty
          if (!profile.identity.name && state.profile && state.profile.identity.name) {
            profile.identity = state.profile.identity;
          }
          profile.metadata.updatedAt = new Date().toISOString();
          profile.metadata.isDemo = state.datasets.some(function (d) { return d.isDemo; }) &&
            state.datasets.every(function (d) { return d.isDemo; });

          // 2. ENTITY EXTRACTION (augment detected skills from all raw text)
          EntityService.augmentProfile(profile, state.datasets);
          stamp('entity-extraction');

          // 3. EVIDENCE
          var evidence = EvidenceService.build(profile, null);
          stamp('evidence');

          // 4. RELATIONSHIPS
          var relationships = RelationshipService.build(profile);
          stamp('relationships');

          // 5. DATA QUALITY
          var quality = DataQualityService.validate(profile, state.datasets, { evidence: evidence });
          stamp('data-quality');

          // 6. SKILL ANALYSIS
          var hasDates = detectDates(profile);
          var skill = SkillAnalysisService.analyze(profile, { evidence: evidence, relationships: relationships, hasDates: hasDates });
          stamp('skill-analysis');

          // Role relevance per skill + coverage for selected role
          var selectedRole = findSelectedRole(profile);
          var coverage = null;
          if (selectedRole) {
            coverage = SkillAnalysisService.computeCoverage(profile, skill, selectedRole);
            // annotate skills with role relevance
            if (coverage) {
              skill.skills.forEach(function (s) {
                s.roleRelevance = coverage.requirements.filter(function (r) {
                  return r.current && r.current.name === s.name;
                }).map(function (r) { return { role: coverage.role.title, status: r.status }; });
              });
            }
          }
          stamp('coverage-gaps');

          // 7. PROJECT ANALYSIS
          var project = ProjectAnalysisService.analyze(profile, skill, relationships);
          stamp('project-analysis');

          // 8. CAREER ANALYSIS (cards, readiness, paths, learning, opportunities, report)
          var learningPlan = CareerAnalysisService.buildLearningPlan(profile, { coverage: coverage, skill: skill });
          learningPlan.forEach(function (t) {
            t.done = !!(state.settings.learningProgress && state.settings.learningProgress[t.id]);
          });
          var opportunities = CareerAnalysisService.analyzeOpportunities(profile, { skill: skill });

          var analyses = {
            profile: profile,
            evidence: evidence,
            relationships: relationships,
            quality: quality,
            skill: skill,
            coverage: coverage,
            project: project,
            learningPlan: learningPlan,
            opportunities: opportunities,
            hasDates: hasDates
          };
          analyses.readiness = CareerAnalysisService.computeReadiness(profile, analyses);
          analyses.cards = CareerAnalysisService.buildCards(profile, analyses);
          analyses.paths = CareerAnalysisService.buildCareerPaths(profile, analyses);
          analyses.journey = VisualizationService.careerJourney(profile, analyses);
          analyses.intelMap = VisualizationService.intelMap(profile, analyses);
          analyses.network = VisualizationService.skillNetwork(profile, analyses);
          if (state.report) {
            analyses.report = state.report;
          }
          stamp('career-analysis-visualization');

          state.profile = profile;
          state.analyses = analyses;
          state.pipelineLog = log;
          save();
        }

        function analyzeMyCareer() {
          rebuild('manual-analyze');
          state.report = CareerAnalysisService.buildReport(state.profile, state.analyses);
          state.analyses.report = state.report;
          state.settings.analyzedAt = new Date().toISOString();
          saveSettings();
          return state.report;
        }

        // ── settings ──────────────────────────────────────────────────

        function updateSettings(partial) {
          angular.extend(state.settings, partial);
          saveSettings();
          if (partial.selectedRoleId !== undefined) {
            rebuild('role-change');
          }
        }

        function toggleLearningTopic(topicId) {
          if (!state.settings.learningProgress) state.settings.learningProgress = {};
          state.settings.learningProgress[topicId] = !state.settings.learningProgress[topicId];
          saveSettings();
          rebuild('learning-progress');
        }

        function setTheme(theme) {
          state.settings.theme = theme;
          saveSettings();
        }

        // ── persistence ───────────────────────────────────────────────

        function save() {
          var ok = StorageService.saveDatasets(state.datasets);
          if (!ok) {
            // Quota exceeded: retry without raw payloads (large files)
            var stripped = state.datasets.map(function (d) {
              var copy = angular.copy(d);
              copy.raw = '';
              copy._rawDropped = true;
              return copy;
            });
            if (StorageService.saveDatasets(stripped)) {
              NotificationService.warn('Storage limit reached — dataset text was not persisted; re-import after clearing data.');
            }
          }
          StorageService.saveProfile(state.profile);
          StorageService.saveSettings(state.settings);
        }

        function saveSettings() {
          StorageService.saveSettings(state.settings);
        }

        // ── helpers ───────────────────────────────────────────────────

        function findDataset(id) {
          for (var i = 0; i < state.datasets.length; i++) {
            if (state.datasets[i].id === id) return state.datasets[i];
          }
          return null;
        }

        function findSelectedRole(profile) {
          var chosen = null;
          if (!state.settings.selectedRoleId) {
            // default: first role with requirements, else first role
            var withReq = profile.targetRoles.filter(function (r) { return r.requirements && r.requirements.length; })[0];
            chosen = withReq || profile.targetRoles[0] || null;
          } else {
            for (var i = 0; i < profile.targetRoles.length; i++) {
              var rid = 'role:' + profile.targetRoles[i].title.toLowerCase().replace(/[^a-z0-9]/g, '_');
              if (rid === state.settings.selectedRoleId || profile.targetRoles[i].id === state.settings.selectedRoleId) {
                chosen = profile.targetRoles[i];
                break;
              }
            }
            if (!chosen) chosen = profile.targetRoles[0] || null;
          }
          // Keep the settings model in sync with the actually analyzed role
          state.settings.selectedRoleId = chosen
            ? 'role:' + chosen.title.toLowerCase().replace(/[^a-z0-9]/g, '_')
            : '';
          return chosen;
        }

        function detectDates(profile) {
          for (var i = 0; i < profile.certificates.length; i++) {
            if (profile.certificates[i].date) return true;
          }
          return false;
        }

        function summarizeExtraction(extraction) {
          return {
            skills: (extraction.skills || []).map(function (s) { return s.name; }),
            roles: (extraction.roles || []).map(function (r) { return r.name; }),
            education: (extraction.education || []).map(function (e) { return e.name; }),
            certifications: (extraction.certifications || []).map(function (c) { return c.name; }),
            achievements: (extraction.achievements || []).map(function (a) { return a.name; }),
            interests: (extraction.interests || []).map(function (i) { return i.name; }),
            goals: (extraction.goals || []).map(function (g) { return g.text; }),
            domains: (extraction.domains || []).map(function (d) { return d.name; }),
            technologies: (extraction.technologies || []).map(function (t) { return t.name; }),
            yearsOfExperience: extraction.yearsOfExperience ? extraction.yearsOfExperience.years : null,
            keywords: (extraction.keywords || []).map(function (k) { return k.word; }).slice(0, 30)
          };
        }

        return {
          state: state,
          init: init,
          ingestText: ingestText,
          ingestFile: ingestFile,
          removeDataset: removeDataset,
          reprocessDataset: reprocessDataset,
          clearAllData: clearAllData,
          loadDemo: loadDemo,
          purgeDemo: purgeDemo,
          rebuild: rebuild,
          analyzeMyCareer: analyzeMyCareer,
          updateSettings: updateSettings,
          toggleLearningTopic: toggleLearningTopic,
          setTheme: setTheme
        };
      }
    ]);

})(angular);
