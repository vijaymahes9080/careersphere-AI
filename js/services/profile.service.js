/**
 * CareerSphere AI — Profile Service (central state + pipeline orchestrator)
 *
 * Holds the current user's CareerProfile, datasets, custom skills, projects,
 * goals, and analysis results, running the complete pipeline:
 *   INGESTION → PARSING → NORMALIZATION → ENTITY EXTRACTION →
 *   RELATIONSHIP BUILDING → ANALYSIS → VISUALIZATION
 *
 * Scoped to the currently authenticated user for strict multi-user data isolation.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('ProfileService', [
      '$q',
      '$http',
      '$injector',
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
      function ($q, $http, $injector, StorageService, DataIngestionService, NormalizationService,
        EntityService, RelationshipService, EvidenceService, SkillAnalysisService,
        ProjectAnalysisService, CareerAnalysisService, DataQualityService,
        VisualizationService, NotificationService, CareerProfileModel) {

        var state = {
          currentUser: null,
          profile: CareerProfileModel.createEmpty(),
          datasets: [],
          customSkills: [],
          customProjects: [],
          goals: [],
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

        function getActiveUserId() {
          try {
            var session = StorageService.loadSession();
            return session && session.userId ? session.userId : null;
          } catch (e) {
            return null;
          }
        }

        // ── init & user switching ──────────────────────────────────────

        function init(optUserId) {
          var userId = optUserId || getActiveUserId();
          var savedProfile = StorageService.loadUserProfile(userId);
          var savedDatasets = StorageService.loadUserDatasets(userId);
          var savedSettings = StorageService.loadUserSettings(userId);
          var savedSkills = StorageService.loadUserCustomSkills(userId);
          var savedProjects = StorageService.loadUserCustomProjects(userId);
          var savedGoals = StorageService.loadUserGoals(userId);

          state.customSkills = savedSkills || [];
          state.customProjects = savedProjects || [];
          state.goals = savedGoals || [];

          if (savedSettings && savedSettings.theme) {
            state.settings = angular.extend(state.settings, savedSettings);
          } else {
            state.settings = {
              theme: 'dark',
              selectedRoleId: '',
              skillFilter: 'All',
              learningProgress: {},
              analyzedAt: null
            };
          }

          if (savedDatasets && savedDatasets.length) {
            state.datasets = savedDatasets;
          } else {
            state.datasets = [];
          }

          if (savedProfile && (savedProfile.skills || savedProfile.identity)) {
            state.profile = savedProfile;
          } else {
            state.profile = CareerProfileModel.createEmpty();
          }

          var session = StorageService.loadSession();
          if (session && session.userId === userId) {
            state.currentUser = session;
            if (!state.profile.identity.name) state.profile.identity.name = session.name;
            if (!state.profile.identity.email) state.profile.identity.email = session.email;
            if (session.targetRole && (!state.profile.targetRoles || !state.profile.targetRoles.length)) {
              state.profile.targetRoles = [{
                id: 'role_' + session.targetRole.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                title: session.targetRole,
                requirements: []
              }];
            }
          }

          rebuild('init');
        }

        function switchUser(user) {
          if (!user) {
            state.currentUser = null;
            state.profile = CareerProfileModel.createEmpty();
            state.datasets = [];
            state.customSkills = [];
            state.customProjects = [];
            state.goals = [];
            state.analyses = null;
            return;
          }
          init(user.userId || user.id);
        }

        // ── dataset ingestion ─────────────────────────────────────────

        function ingestText(content, meta) {
          var res = DataIngestionService.ingest(content, meta);
          if (!res.ok) {
            NotificationService.error('Import failed: ' + (res.errors[0] || 'unknown error'));
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

          try {
            var auth = $injector.get('AuthService');
            auth.logActivity('Dataset imported', 'Imported ' + meta.name + ' (' + (meta.format || 'data') + ')');
          } catch (e) { /* ignore */ }

          return res;
        }

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
          var userId = getActiveUserId();
          state.profile = CareerProfileModel.createEmpty();
          state.datasets = [];
          state.customSkills = [];
          state.customProjects = [];
          state.goals = [];
          state.report = null;
          StorageService.clearAll(userId);
          state.settings.learningProgress = {};
          rebuild('clear');
          NotificationService.info('All career data for current user cleared.');
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

        // ── Custom User Actions (Skills, Projects, Goals, Profile) ─────

        function addCustomSkill(skill) {
          if (!skill || !skill.name) return false;
          var name = skill.name.trim();
          var id = 'skill_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          var newSkill = {
            id: id,
            name: name,
            category: skill.category || 'Other',
            level: skill.level || 'Intermediate',
            confidence: skill.confidence || 'Confirmed',
            source: 'User Profile',
            strength: skill.level === 'Expert' ? 95 : (skill.level === 'Advanced' ? 85 : (skill.level === 'Intermediate' ? 70 : 50))
          };

          state.customSkills = (state.customSkills || []).filter(function (s) {
            return s.id !== id && s.name.toLowerCase() !== name.toLowerCase();
          });
          state.customSkills.push(newSkill);

          save();
          rebuild('add-skill');
          NotificationService.success('Added skill "' + newSkill.name + '"');

          try {
            var auth = $injector.get('AuthService');
            auth.logActivity('Skill added', 'Added skill ' + newSkill.name);
          } catch (e) { /* ignore */ }

          return true;
        }

        function deleteSkill(skillId) {
          state.customSkills = (state.customSkills || []).filter(function (s) {
            return s.id !== skillId && s.name.toLowerCase() !== skillId.toLowerCase();
          });
          state.profile.skills = (state.profile.skills || []).filter(function (s) {
            return s.id !== skillId && s.name.toLowerCase() !== skillId.toLowerCase();
          });
          save();
          rebuild('delete-skill');
          NotificationService.info('Skill removed.');

          try {
            var auth = $injector.get('AuthService');
            auth.logActivity('Skill removed', 'Removed skill ID ' + skillId);
          } catch (e) { /* ignore */ }
        }

        function addCustomProject(project) {
          if (!project || !project.name) return false;
          var name = project.name.trim();
          var id = 'proj_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          var techs = Array.isArray(project.technologies)
            ? project.technologies
            : (project.technologies || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);

          var newProj = {
            id: id,
            name: name,
            description: project.description || '',
            technologies: techs,
            complexity: project.complexity || 'Moderate',
            domain: project.domain || 'Software Engineering',
            source: 'User Portfolio'
          };

          state.customProjects = (state.customProjects || []).filter(function (p) {
            return p.id !== id && p.name.toLowerCase() !== name.toLowerCase();
          });
          state.customProjects.push(newProj);

          save();
          rebuild('add-project');
          NotificationService.success('Added project "' + newProj.name + '"');

          try {
            var auth = $injector.get('AuthService');
            auth.logActivity('Project added', 'Added project ' + newProj.name);
          } catch (e) { /* ignore */ }

          return true;
        }

        function deleteProject(projId) {
          state.customProjects = (state.customProjects || []).filter(function (p) {
            return p.id !== projId && p.name !== projId;
          });
          state.profile.projects = (state.profile.projects || []).filter(function (p) {
            return p.id !== projId && p.name !== projId;
          });
          save();
          rebuild('delete-project');
          NotificationService.info('Project removed.');

          try {
            var auth = $injector.get('AuthService');
            auth.logActivity('Project removed', 'Removed project ID ' + projId);
          } catch (e) { /* ignore */ }
        }

        function addGoal(goal) {
          if (!goal || !goal.title) return false;
          var id = 'goal_' + Date.now();
          var newGoal = {
            id: id,
            title: goal.title.trim(),
            targetRole: goal.targetRole || (state.profile.targetRoles[0] ? state.profile.targetRoles[0].title : 'Career Growth'),
            progress: parseInt(goal.progress, 10) || 0,
            deadline: goal.deadline || '',
            status: (goal.progress >= 100) ? 'Completed' : 'In Progress'
          };

          state.goals = state.goals || [];
          state.goals.push(newGoal);
          save();
          rebuild('add-goal');
          NotificationService.success('Career goal "' + newGoal.title + '" added.');

          try {
            var auth = $injector.get('AuthService');
            auth.logActivity('Goal updated', 'Added goal ' + newGoal.title);
          } catch (e) { /* ignore */ }

          return true;
        }

        function deleteGoal(goalId) {
          state.goals = (state.goals || []).filter(function (g) { return g.id !== goalId; });
          save();
          rebuild('delete-goal');
          NotificationService.info('Career goal removed.');
        }

        function updateGoalProgress(goalId, progress) {
          var g = (state.goals || []).find(function (item) { return item.id === goalId; });
          if (g) {
            g.progress = Math.max(0, Math.min(100, parseInt(progress, 10) || 0));
            g.status = g.progress >= 100 ? 'Completed' : 'In Progress';
            save();
            rebuild('update-goal');
            try {
              var auth = $injector.get('AuthService');
              auth.logActivity('Goal updated', 'Updated progress for ' + g.title + ' to ' + g.progress + '%');
            } catch (e) { /* ignore */ }
          }
        }

        function updateProfileIdentity(data) {
          if (!state.profile.identity) state.profile.identity = {};
          if (data.name) state.profile.identity.name = data.name.trim();
          if (data.summary !== undefined) state.profile.identity.summary = data.summary.trim();
          if (data.location !== undefined) state.profile.identity.location = data.location.trim();
          if (data.phone !== undefined) state.profile.identity.phone = data.phone.trim();

          if (data.targetRole) {
            var roleTitle = data.targetRole.trim();
            var exists = (state.profile.targetRoles || []).find(function (r) {
              return r.title.toLowerCase() === roleTitle.toLowerCase();
            });
            if (!exists) {
              state.profile.targetRoles = [{
                id: 'role_' + roleTitle.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                title: roleTitle,
                requirements: []
              }].concat(state.profile.targetRoles || []);
            }
          }

          if (data.education) {
            state.profile.education = [{
              name: data.education.trim(),
              institution: data.institution ? data.institution.trim() : '',
              year: data.year ? data.year.trim() : ''
            }];
          }

          save();
          rebuild('update-profile');
          NotificationService.success('Career profile updated.');

          try {
            var auth = $injector.get('AuthService');
            auth.logActivity('Profile updated', 'Updated career profile information');
          } catch (e) { /* ignore */ }
        }

        // ── the pipeline ──────────────────────────────────────────────

        function rebuild(reason) {
          var log = [];
          var t0 = (window.performance && performance.now) ? performance.now() : Date.now();

          function stamp(step) {
            var t1 = (window.performance && performance.now) ? performance.now() : Date.now();
            log.push({ step: step, ms: Math.round((t1 - t0) * 10) / 10 });
          }

          // 1. INGESTION + PARSING + NORMALIZATION
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

          // Incorporate custom user skills
          (state.customSkills || []).forEach(function (cs) {
            var existing = profile.skills.find(function (s) {
              return s.name.toLowerCase() === cs.name.toLowerCase();
            });
            if (existing) {
              existing.level = cs.level || existing.level;
              existing.category = cs.category || existing.category;
              if (cs.strength) existing.strength = cs.strength;
            } else {
              var s = CareerProfileModel.createSkill(cs.name, cs.category, cs.level, cs.source || 'User Added', cs.confidence || 'Confirmed');
              if (cs.strength) s.strength = cs.strength;
              profile.skills.push(s);
            }
          });

          // Incorporate custom user projects
          (state.customProjects || []).forEach(function (cp) {
            var existingProj = profile.projects.find(function (p) {
              return p.name.toLowerCase() === cp.name.toLowerCase();
            });
            if (!existingProj) {
              var p = CareerProfileModel.createProject(cp.name, cp.description, cp.technologies, cp.source || 'Portfolio');
              p.complexity = cp.complexity || 'Moderate';
              p.domain = cp.domain || 'Software Engineering';
              profile.projects.push(p);
            }
          });

          // Incorporate career goals
          if (state.goals && state.goals.length) {
            profile.careerGoals = angular.copy(state.goals);
          }

          // Preserve identity
          if (state.profile && state.profile.identity && state.profile.identity.name) {
            profile.identity = angular.extend({}, profile.identity, state.profile.identity);
          }
          if (state.profile && state.profile.education && state.profile.education.length && !profile.education.length) {
            profile.education = angular.copy(state.profile.education);
          }
          if (state.profile && state.profile.targetRoles && state.profile.targetRoles.length && !profile.targetRoles.length) {
            profile.targetRoles = angular.copy(state.profile.targetRoles);
          }

          profile.metadata.updatedAt = new Date().toISOString();
          profile.metadata.isDemo = state.datasets.some(function (d) { return d.isDemo; }) &&
            state.datasets.every(function (d) { return d.isDemo; });

          stamp('ingest-parse-normalize');

          // 2. ENTITY EXTRACTION
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

          // 8. CAREER ANALYSIS
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
          analyses.roleMatches = CareerAnalysisService.buildRoleMatches(profile, analyses);
          analyses.nextActions = CareerAnalysisService.buildNextActions(profile, analyses, analyses.roleMatches);
          analyses.fitMatrix = CareerAnalysisService.buildFitMatrix(profile, analyses, analyses.roleMatches);
          analyses.projectMap = CareerAnalysisService.buildProjectSkillRoleMap(profile, analyses);
          analyses.evidenceBreakdown = CareerAnalysisService.buildEvidenceBreakdown(profile, analyses);
          analyses.stageRoadmap = CareerAnalysisService.buildStageRoadmap(profile, analyses);
          analyses.dataQualityMetrics = CareerAnalysisService.buildDataQualityMetrics(profile, state.datasets, analyses);
          analyses.paths = CareerAnalysisService.buildCareerPaths(profile, analyses);
          analyses.journey = VisualizationService.careerJourney(profile, analyses);
          analyses.intelMap = VisualizationService.intelMap(profile, analyses);
          analyses.network = VisualizationService.skillNetwork(profile, analyses);
          analyses.career360 = VisualizationService.career360Data(profile, analyses);
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

        // ── persistence (scoped to current user) ──────────────────────

        function save() {
          var userId = getActiveUserId();
          var ok = StorageService.saveUserDatasets(userId, state.datasets);
          if (!ok) {
            var stripped = state.datasets.map(function (d) {
              var copy = angular.copy(d);
              copy.raw = '';
              copy._rawDropped = true;
              return copy;
            });
            StorageService.saveUserDatasets(userId, stripped);
          }
          StorageService.saveUserProfile(userId, state.profile);
          StorageService.saveUserSettings(userId, state.settings);
          StorageService.saveUserGoals(userId, state.goals || []);
          StorageService.saveUserCustomSkills(userId, state.customSkills || []);
          StorageService.saveUserCustomProjects(userId, state.customProjects || []);
        }

        function saveSettings() {
          var userId = getActiveUserId();
          StorageService.saveUserSettings(userId, state.settings);
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
          switchUser: switchUser,
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
          setTheme: setTheme,
          addCustomSkill: addCustomSkill,
          deleteSkill: deleteSkill,
          addCustomProject: addCustomProject,
          deleteProject: deleteProject,
          addGoal: addGoal,
          deleteGoal: deleteGoal,
          updateGoalProgress: updateGoalProgress,
          updateProfileIdentity: updateProfileIdentity
        };
      }
    ]);

})(angular);
