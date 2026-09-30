/**
 * CareerSphere AI — Report Service
 * Builds print-ready HTML reports (career profile, skill report,
 * skill gap report, project portfolio, career intelligence summary).
 * PDF is not required: reports open in a print dialog ("Save as PDF").
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('ReportService', [function () {

      function esc(s) {
        return String(s === null || s === undefined ? '' : s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      function css() {
        return 'body{font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:32px;color:#1a2233;background:#fff}' +
          'h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid #2f6fed;color:#2f6fed}' +
          'h3{font-size:13px;margin:16px 0 6px;color:#445}' +
          '.sub{color:#677;color:#667;font-size:12px}.badge{display:inline-block;background:#eef3ff;color:#2f6fed;border:1px solid #cddcfc;border-radius:999px;padding:2px 10px;font-size:11px;margin:2px 4px 2px 0}' +
          'table{border-collapse:collapse;width:100%;font-size:12px;margin-top:6px}th,td{border:1px solid #dde3ee;padding:6px 8px;text-align:left;vertical-align:top}' +
          'th{background:#f2f5fb}ul{margin:6px 0 0 18px;padding:0;font-size:13px}li{margin:3px 0}' +
          '.card{border:1px solid #dde3ee;border-radius:8px;padding:12px 14px;margin:8px 0}.muted{color:#788}' +
          '.two{display:flex;gap:16px;flex-wrap:wrap}.two>div{flex:1;min-width:240px}' +
          '@media print{body{padding:12px}}';
      }

      function header(title, profile) {
        return '<h1>CareerSphere AI — ' + esc(title) + '</h1>' +
          '<div class="sub">' + esc(profile.identity.name || 'Unnamed profile') +
          ' · Generated ' + new Date().toLocaleString() +
          ' · CareerSphere analytical estimates — derived only from imported data</div>';
      }

      function skillsTable(skillAnalysis) {
        if (!skillAnalysis || !skillAnalysis.skills.length) return '<p class="muted">No skills imported.</p>';
        var rows = skillAnalysis.skills.map(function (s) {
          return '<tr><td>' + esc(s.name) + '</td><td>' + esc(s.category) + '</td><td>' + esc(s.level || 'Unverified') +
            '</td><td>' + s.strength + '%</td><td>' + s.evidenceCount + '</td><td>' + esc(s.confidence) +
            '</td><td>' + esc(s.sources.join(', ')) + '</td></tr>';
        }).join('');
        return '<table><thead><tr><th>Skill</th><th>Category</th><th>Level</th><th>Strength</th><th>Evidence</th><th>Confidence</th><th>Sources</th></tr></thead><tbody>' + rows + '</tbody></table>';
      }

      function evidenceSection(evidence) {
        if (!evidence || !evidence.list || !evidence.list.length) return '<p class="muted">No evidence links found.</p>';
        return evidence.list.map(function (item) {
          return '<div class="card"><strong>' + esc(item.skill.name) + '</strong> — ' + item.points + ' weighted points<br>' +
            '<ul>' + item.entries.map(function (e) {
              return '<li>' + esc(e.type) + ': ' + esc(e.title) + ' <span class="muted">(source: ' + esc(e.source) + ')</span></li>';
            }).join('') + '</ul></div>';
        }).join('');
      }

      function gapSection(coverage) {
        if (!coverage) return '<p class="muted">No target role selected — gap analysis unavailable. CareerSphere does not invent job requirements.</p>';
        if (coverage.coveragePercent === null) return '<p class="muted">' + esc(coverage.message) + '</p>';
        var rows = coverage.requirements.map(function (r) {
          return '<tr><td>' + esc(r.skillName) + '</td><td>' + esc(r.requiredLevel || '—') + '</td><td>' + esc(r.status) +
            '</td><td>' + (r.current ? esc(r.current.level || 'Unverified') + ' (' + r.current.strength + '%)' : '—') +
            '</td><td>' + esc(r.source) + '</td></tr>';
        }).join('');
        return '<p><span class="badge">Coverage: ' + coverage.coveragePercent + '%</span>' +
          '<span class="badge">Role: ' + esc(coverage.role.title) + '</span></p>' +
          '<table><thead><tr><th>Requirement</th><th>Req. level</th><th>Status</th><th>Current</th><th>Source</th></tr></thead><tbody>' + rows + '</tbody></table>';
      }

      function projectsTable(projectAnalysis) {
        if (!projectAnalysis || !projectAnalysis.projects.length) return '<p class="muted">No projects imported.</p>';
        var rows = projectAnalysis.projects.map(function (p) {
          return '<tr><td>' + esc(p.name) + '</td><td>' + esc((p.technologies || []).join(', ')) +
            '</td><td>' + esc(p.skillsDemonstrated.map(function (s) { return s.name; }).join(', ')) +
            '</td><td>' + esc(p.complexity) + '</td><td>' + esc(p.domain || '—') +
            '</td><td>' + esc(p.missingDocumentation.join('; ') || 'Complete') + '</td></tr>';
        }).join('');
        return '<table><thead><tr><th>Project</th><th>Technologies</th><th>Skills demonstrated</th><th>Complexity</th><th>Domain</th><th>Missing docs</th></tr></thead><tbody>' + rows + '</tbody></table>';
      }

      function wrap(body) {
        return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>CareerSphere AI Report</title><style>' + css() + '</style></head><body>' + body + '</body></html>';
      }

      /**
       * Build report HTML by type.
       */
      function build(type, data) {
        var profile = data.profile;
        var analyses = data.analyses || {};
        var body = header(type + ' Report', profile);

        if (type === 'comprehensive' || type === 'summary') {
          // 1. Executive Summary
          body += '<h2>1. Executive Summary</h2>';
          if (analyses.readiness) {
            body += '<div class="card" style="background:#f4f8ff;border-color:#b8d1ff"><strong>Career Readiness: ' + analyses.readiness.value + '%</strong> <span class="badge">CareerSphere Analytical Estimate</span><br>' +
              '<span class="muted">' + esc(analyses.readiness.note) + '</span></div>';
          }
          if (analyses.cards) {
            body += '<div class="two">' + analyses.cards.filter(function (c) { return c.canCompute; }).map(function (c) {
              return '<div class="card"><strong>' + esc(c.label) + ': ' + esc(c.value) + '</strong><br><span class="muted small">' + esc(c.detail) + '</span></div>';
            }).join('') + '</div>';
          }

          // 2. Career Profile
          body += '<h2>2. Career Profile</h2><div class="two"><div class="card">' +
            '<p><strong>Name:</strong> ' + esc(profile.identity.name || '—') + '<br>' +
            '<strong>Email:</strong> ' + esc(profile.identity.email || '—') + '<br>' +
            '<strong>Location:</strong> ' + esc(profile.identity.location || '—') + '</p>' +
            '<p class="muted">' + esc(profile.identity.summary || '') + '</p></div><div class="card">' +
            '<p><strong>Education:</strong> ' + esc(profile.education.map(function (e) { return e.name + (e.institution ? ' — ' + e.institution : ''); }).join('; ') || '—') + '<br>' +
            '<strong>Target Roles:</strong> ' + esc(profile.targetRoles.map(function (r) { return r.title; }).join(', ') || '—') + '<br>' +
            '<strong>Career Goals:</strong> ' + esc(profile.careerGoals.join(' | ') || '—') + '</p></div></div>';

          // 3. Skill Analysis
          body += '<h2>3. Skill Analysis &amp; Strength Matrix</h2>' + skillsTable(analyses.skill);

          // 4. Role Analysis & Matching
          body += '<h2>4. Career Role Analysis &amp; Match Fit</h2>';
          if (analyses.roleMatches && analyses.roleMatches.length) {
            var rRows = analyses.roleMatches.map(function (r) {
              var matchedLen = r.matchedSkills ? r.matchedSkills.length : 0;
              var reqsLen = r.requirements ? r.requirements.length : 0;
              var whyText = r.whyMatches && r.whyMatches.length ? r.whyMatches.join('; ') : 'No requirement data available';
              return '<tr><td><strong>' + esc(r.title) + '</strong></td><td><span class="badge">' + r.coveragePercent + '% Match</span></td><td>' +
                esc(r.fitTier) + '</td><td>' + matchedLen + ' / ' + reqsLen + '</td><td>' +
                esc(whyText) + '</td></tr>';
            }).join('');
            body += '<table><thead><tr><th>Role</th><th>Match %</th><th>Fit Tier</th><th>Matched Skills</th><th>Analytical Rationale</th></tr></thead><tbody>' + rRows + '</tbody></table>';
          } else {
            body += '<p class="muted">No target roles configured.</p>';
          }

          // 5. Skill Gaps
          body += '<h2>5. Skill Gap Analysis (Current vs Required)</h2>' + gapSection(analyses.coverage);

          // 6. Project Evidence & Portfolio
          body += '<h2>6. Project Evidence &amp; Employability Impact</h2>' + projectsTable(analyses.project);

          // 7. Career Paths
          body += '<h2>7. Career Pathways &amp; Trajectories</h2>';
          if (analyses.paths && analyses.paths.paths && analyses.paths.paths.length) {
            body += '<ul>' + analyses.paths.paths.map(function (p) {
              return '<li><strong>' + esc(p.name) + ':</strong> ' + p.steps.map(function (s) { return esc(s.label) + ' (' + s.status + ')'; }).join(' → ') + '</li>';
            }).join('') + '</ul>';
          }

          // 8. Learning Roadmap
          body += '<h2>8. Learning Roadmap (NOW → NEXT → BUILD → APPLY → ADVANCE)</h2>';
          if (analyses.stageRoadmap && analyses.stageRoadmap.length) {
            analyses.stageRoadmap.forEach(function (st) {
              if (st.topics.length) {
                body += '<h3>Stage: ' + esc(st.label) + ' — ' + esc(st.title) + '</h3><ul>' +
                  st.topics.map(function (t) { return '<li><strong>' + esc(t.title) + '</strong> (' + esc(t.status) + ' for ' + esc(t.role) + ')</li>'; }).join('') + '</ul>';
              }
            });
          } else if (analyses.learningPlan && analyses.learningPlan.length) {
            body += '<ul>' + analyses.learningPlan.map(function (t) {
              return '<li>Week ' + t.week + ': <strong>' + esc(t.title) + '</strong> (' + esc(t.status) + ' for ' + esc(t.role) + ')</li>';
            }).join('') + '</ul>';
          } else {
            body += '<p class="muted">No learning roadmap items needed — all requirements met.</p>';
          }

          // 9. Action Plan
          body += '<h2>9. Action Plan — Your Next 3 Actions</h2>';
          if (analyses.nextActions && analyses.nextActions.length) {
            body += '<div class="two">' + analyses.nextActions.map(function (act) {
              return '<div class="card"><strong>' + esc(act.num) + '. ' + esc(act.title) + '</strong><br><span class="badge">' + esc(act.tag) + '</span><p class="muted small">' + esc(act.detail) + '</p></div>';
            }).join('') + '</div>';
          }

          // 10. Data Quality
          body += '<h2>10. Data Quality &amp; Extraction Audit</h2>';
          if (analyses.dataQualityMetrics) {
            var dq = analyses.dataQualityMetrics;
            body += '<div class="two"><div class="card"><p><strong>Records Analyzed:</strong> ' + dq.recordsAnalyzed + '<br>' +
              '<strong>Sources Detected:</strong> ' + dq.sourcesDetected + '<br>' +
              '<strong>Skills Extracted:</strong> ' + dq.skillsExtracted + '</p></div><div class="card"><p>' +
              '<strong>Skills Mapped:</strong> ' + dq.skillsMapped + '<br>' +
              '<strong>Unmapped Items:</strong> ' + dq.unmappedItems + '<br>' +
              '<strong>Confidence Score:</strong> ' + dq.confidence + '% (' + esc(dq.status) + ')</p></div></div>';
          }

          // 11. Methodology
          body += '<h2>11. Methodology &amp; Transparency Statement</h2>' +
            '<p class="muted small">CareerSphere AI uses a deterministic pipeline: <strong>Data → Extraction → Normalization → Analysis → Intelligence → Visualization → Career Action</strong>. ' +
            'Scores are labeled as CareerSphere analytical estimates. No external AI APIs, third-party data tracking, or cloud uploads are used. All processing occurs locally within the browser sandbox.</p>';

        } else if (type === 'profile') {
          body += '<h2>Identity</h2><div class="two"><div class="card">' +
            '<p><strong>Name:</strong> ' + esc(profile.identity.name || '—') + '<br>' +
            '<strong>Email:</strong> ' + esc(profile.identity.email || '—') + '<br>' +
            '<strong>Location:</strong> ' + esc(profile.identity.location || '—') + '</p>' +
            '<p class="muted">' + esc(profile.identity.summary || '') + '</p></div><div class="card">' +
            '<p><strong>Education:</strong> ' + esc(profile.education.map(function (e) { return e.name + (e.institution ? ' — ' + e.institution : ''); }).join('; ') || '—') + '</p>' +
            '<p><strong>Target roles:</strong> ' + esc(profile.targetRoles.map(function (r) { return r.title; }).join(', ') || '—') + '</p>' +
            '<p><strong>Career goals:</strong> ' + esc(profile.careerGoals.join(' | ') || '—') + '</p></div></div>';
          body += '<h2>Skills</h2>' + skillsTable(analyses.skill);
          body += '<h2>Projects</h2>' + projectsTable(analyses.project);
        } else if (type === 'skills') {
          body += '<h2>Skill analysis</h2>' + skillsTable(analyses.skill);
          body += '<h2>Evidence</h2>' + evidenceSection(analyses.evidence);
        } else if (type === 'gaps') {
          body += '<h2>Skill gap analysis</h2>' + gapSection(analyses.coverage);
        } else if (type === 'projects') {
          body += '<h2>Project portfolio</h2>' + projectsTable(analyses.project);
        }

        body += '<p class="muted" style="margin-top:28px;border-top:1px solid #dde3ee;padding-top:8px">Generated locally by CareerSphere AI. Your data never left this device.</p>';
        return wrap(body);
      }

      /**
       * Open report in a new window for printing / PDF saving.
       */
      function print(html) {
        var win = window.open('', '_blank');
        if (!win) {
          // Popup blocked → download instead
          download(html, 'careersphere-report.html');
          return { ok: true, fallback: true };
        }
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.onload = function () {
          try { win.focus(); win.print(); } catch (e) { /* user can print manually */ }
        };
        return { ok: true, window: win };
      }

      function download(html, filename) {
        var blob = new Blob([html], { type: 'text/html' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      }

      return { build: build, print: print, download: download };
    }]);

})(angular);
