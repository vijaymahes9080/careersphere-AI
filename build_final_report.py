import os
import shutil
import docx
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

SRC = "CareerSphere_AI_Project_Report.docx"
DST = "CareerSphere_AI_Project_Report_Updated.docx"
SHOTS_DIR = "screenshots"

SCREENSHOTS = [
    ("01_Login_Page.png",                 "Screenshot 1: CareerSphere AI — Secure Login Page with Demo Accounts"),
    ("02_Registration_Page.png",          "Screenshot 2: CareerSphere AI — Multi-Field User Registration Page"),
    ("03_Candidate_Overview_Dashboard.png","Screenshot 3: CareerSphere AI — Candidate Overview & Readiness Dashboard (User A)"),
    ("04_Skills_Radar_Analysis.png",      "Screenshot 4: CareerSphere AI — Skills Radar Analysis & Proficiency Breakdown"),
    ("05_Career_Intelligence_Map.png",    "Screenshot 5: CareerSphere AI — Career Intelligence Map & Role Match"),
    ("06_Learning_Roadmap.png",           "Screenshot 6: CareerSphere AI — Personalized Learning & Career Roadmap"),
    ("07_Projects_Portfolio.png",         "Screenshot 7: CareerSphere AI — Academic Projects & Certification Portfolio"),
    ("08_Admin_Analytics_Dashboard.png",  "Screenshot 8: CareerSphere AI — Admin Analytics & Platform Metrics Dashboard"),
    ("09_Admin_User_Management.png",      "Screenshot 9: CareerSphere AI — Admin User Management & Role Controls"),
    ("10_Audit_Activity_Log.png",         "Screenshot 10: CareerSphere AI — Audit Activity Log & Security Monitoring"),
    ("11_User_B_Profile.png",             "Screenshot 11: CareerSphere AI — Multi-User Isolation: User B Profile (Java / Full Stack)"),
    ("12_User_B_Career_Map.png",          "Screenshot 12: CareerSphere AI — Multi-User Data Isolation: User B Career Map"),
]

RESULT_INTRO = (
    "The CareerSphere AI platform was fully implemented and tested across all role-based modules. "
    "The following screenshots demonstrate the complete working system — including public authentication "
    "pages, student candidate dashboard views, AI-driven skill analytics, career intelligence mapping, "
    "personalized learning roadmaps, administrative controls, and multi-user data isolation. Each screen "
    "confirms the platform operates correctly across distinct user roles (Student and Admin) with persistent, "
    "isolated data per account."
)

SCREEN_DESCRIPTIONS = {
    "01_Login_Page.png": (
        "The Login Page provides secure credential-based authentication with SHA-256 salted password verification. "
        "A quick-access Demo Accounts panel enables one-click login for test accounts (User A, User B, and Admin), "
        "facilitating role-based demonstrations without manual entry."
    ),
    "02_Registration_Page.png": (
        "The Registration Page enables new candidate account creation with full profile initialization including name, "
        "email, password, academic background, technical skills, soft skills, projects, certifications, and career "
        "interests. All accounts are assigned the standard user role with cryptographically secured passwords."
    ),
    "03_Candidate_Overview_Dashboard.png": (
        "The Candidate Overview Dashboard presents a holistic, real-time career readiness summary for User A (Python / AI Engineer profile). "
        "Key metrics displayed include overall career readiness percentage, skills count, matched career roles, identified skill "
        "gaps, recent profile activity, and an interactive radar chart of core competency dimensions."
    ),
    "04_Skills_Radar_Analysis.png": (
        "The Skills Radar Analysis module visualizes the candidate's technical proficiency across categorized skill groups "
        "using a multi-axis radar chart. Individual skill proficiency levels are mapped against industry benchmarks, "
        "providing an at-a-glance picture of strengths, weaknesses, and category distribution."
    ),
    "05_Career_Intelligence_Map.png": (
        "The Career Intelligence Map displays AI-computed match scores between the candidate's competency profile and "
        "multiple target career roles. Each role card presents required skills, alignment percentage, readiness indicators, "
        "and prioritized gap areas to guide role-specific preparation."
    ),
    "06_Learning_Roadmap.png": (
        "The Personalized Learning Roadmap generates an ordered list of learning milestones, recommended online courses, "
        "certifications, and practice projects tailored to close the candidate's identified skill gaps for their chosen "
        "career role. Progress tracking and completion status are maintained per account."
    ),
    "07_Projects_Portfolio.png": (
        "The Projects and Portfolio module stores and displays the candidate's academic capstone projects, personal "
        "builds, and professional certifications. Each entry contributes to the platform's competency evidence base, "
        "influencing skill match scores and career role alignment calculations."
    ),
    "08_Admin_Analytics_Dashboard.png": (
        "The Admin Analytics Dashboard provides platform-level monitoring for administrators. Key platform metrics include "
        "total registered users, active sessions, skill gap trends across all accounts, role distribution charts, "
        "and top career interest distributions — enabling data-driven platform insights."
    ),
    "09_Admin_User_Management.png": (
        "The Admin User Management panel displays a complete table of all registered platform users with role badges, "
        "account status, registration timestamps, and administrative controls. Administrators can promote users to admin "
        "roles, deactivate accounts, and manage platform access from this centralized view."
    ),
    "10_Audit_Activity_Log.png": (
        "The Audit Activity Log provides a chronological record of all significant platform events including logins, "
        "registrations, profile updates, role changes, and administrative actions. This security layer ensures full "
        "accountability and traceability across all user and admin operations."
    ),
    "11_User_B_Profile.png": (
        "Multi-user data isolation is demonstrated through User B's profile (Java / Full Stack Engineer). The overview "
        "dashboard shows a completely distinct career readiness score, skill set, matched roles, and roadmap from User A, "
        "confirming that all user data is securely partitioned with no cross-account data leakage."
    ),
    "12_User_B_Career_Map.png": (
        "User B's Career Intelligence Map confirms complete data isolation — displaying a separate set of career role "
        "matches, alignment percentages, and skill gap profiles entirely independent from User A's profile. This validates "
        "the platform's multi-user role-based architecture and data isolation implementation."
    ),
}


def set_font(run, size_pt=16.0, bold=None):
    run.font.size = Pt(size_pt)
    if bold is not None:
        run.bold = bold


def make_h2(p, text, page_break_before=False):
    p.style = doc.styles['Heading 2']
    p.paragraph_format.line_spacing = 1.3333333333333333
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    if page_break_before:
        p.paragraph_format.page_break_before = True
    p.text = ""
    r = p.add_run(text)
    set_font(r, size_pt=16.0, bold=True)
    return p


def make_caption(p, text):
    p.style = doc.styles['Normal']
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.left_indent = Pt(0)
    p.paragraph_format.right_indent = Pt(0)
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(10)
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.keep_with_next = False
    p.text = ""
    r = p.add_run(text)
    set_font(r, size_pt=14.0, bold=True)
    return p


def make_body_p(p, text):
    p.style = doc.styles['Normal']
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.left_indent = Pt(0)
    p.paragraph_format.right_indent = Pt(0)
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.line_spacing = 1.3333333333333333
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(8)
    p.text = ""
    r = p.add_run(text)
    set_font(r, size_pt=16.0, bold=False)
    return p


def make_img_p(p, img_path, width_in=5.6):
    p.style = doc.styles['Normal']
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.left_indent = Pt(0)
    p.paragraph_format.right_indent = Pt(0)
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.keep_with_next = True
    p.text = ""
    r = p.add_run()
    r.add_picture(img_path, width=Inches(width_in))
    return p


# ── Build document ──────────────────────────────────────────
shutil.copyfile(SRC, DST)
doc = docx.Document(DST)

# 1. Fix Section 8 heading
for p in doc.paragraphs:
    if p.style.name == 'Heading 1' and p.text.strip() == 'System Architecture Diagram':
        p.text = "8. System Architecture Diagram"
        p.paragraph_format.page_break_before = True
        p.paragraph_format.keep_with_next = True
        for r in p.runs:
            set_font(r, size_pt=20.0, bold=True)

# 2. Update TOC
p_toc_8, p_toc_9 = None, None
for p in doc.paragraphs:
    t = p.text.strip()
    if t == '8. System Architecture Diagram' and p.style.name == 'Normal':
        p_toc_8 = p
    elif t == '9. Result' and p.style.name == 'Normal':
        p_toc_9 = p

if p_toc_8:
    for sub in ["   7.1 Process Flowchart", "   7.2 User Flow Chart"]:
        px = p_toc_8.insert_paragraph_before()
        px.style = doc.styles['Normal']
        set_font(px.add_run(sub), 16.0, False)

if p_toc_9:
    for sub in ["   8.1 Data Flow Diagram (DFD)", "   8.2 Entity-Relationship Diagram (ERD)"]:
        px = p_toc_9.insert_paragraph_before()
        px.style = doc.styles['Normal']
        set_font(px.add_run(sub), 16.0, False)

# 3. Insert 7.1 & 7.2 before Section 8 heading
p_sec8 = None
for p in doc.paragraphs:
    if p.style.name == 'Heading 1' and 'System Architecture Diagram' in p.text:
        p_sec8 = p
        break

if p_sec8:
    p_h71 = p_sec8.insert_paragraph_before()
    make_h2(p_h71, "7.1 Process Flowchart", page_break_before=True)
    make_img_p(p_sec8.insert_paragraph_before(),
               "CareerSphere_Project_Report/Figure_2_Process_Flowchart.png", 5.8)
    make_caption(p_sec8.insert_paragraph_before(),
                 "Figure 2: CareerSphere AI Process Flowchart")
    make_body_p(p_sec8.insert_paragraph_before(),
                "The Process Flowchart illustrates the detailed internal processing and decision logic of the CareerSphere AI platform. Following initialization, the system prompts the candidate to furnish comprehensive academic credentials, technical proficiencies, soft skills, portfolio projects, and professional certifications alongside their aspirational career trajectory. The ingested data undergoes normalization and profile validation. CareerSphere AI concurrently invokes analytical routines to benchmark user competencies against target industry requirements. By identifying skill deficiencies and match percentages, the engine derives targeted learning priorities and synthesizes an actionable, milestone-driven career roadmap rendered directly onto the candidate dashboard.")

    p_h72 = p_sec8.insert_paragraph_before()
    make_h2(p_h72, "7.2 User Flow Chart", page_break_before=True)
    make_img_p(p_sec8.insert_paragraph_before(),
               "CareerSphere_Project_Report/Figure_3_User_Flow_Chart.png", 5.8)
    make_caption(p_sec8.insert_paragraph_before(),
                 "Figure 3: CareerSphere AI User Flow Chart")
    make_body_p(p_sec8.insert_paragraph_before(),
                "The User Flow Chart models the direct interaction and navigation sequence of a student candidate within CareerSphere AI. Distinct from internal background algorithms, this chart highlights the user-facing journey: beginning with platform access and secure credential authentication, progressing through step-by-step modular data entry forms for educational background, technical capabilities, projects, and certifications. Once target career interests are confirmed, the user transitions to analytical dashboard views where they can visually inspect their skill distributions, evaluate career role alignment, examine identified skill gaps, review curated learning milestones, and track ongoing career readiness over time.")
    print("Inserted 7.1 and 7.2")

# 4. Patch Figure 1 picture paragraph with modern architecture image
for p in doc.paragraphs:
    if len(p._p.xpath('.//a:blip')) > 0 and p.text.strip() == '':
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.left_indent = Pt(0)
        p.paragraph_format.right_indent = Pt(0)
        p.paragraph_format.first_line_indent = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.keep_with_next = True
        p.text = ''
        r = p.add_run()
        r.add_picture("CareerSphere_Project_Report/Figure_1_System_Architecture.png", width=Inches(5.8))
        break
for p in doc.paragraphs:
    if 'Figure 1: CareerSphere AI system architecture' in p.text:
        make_caption(p, "Figure 1: CareerSphere AI System Architecture")
        break

# 5. Clean blanks between Sec8 body and Sec9
p_sec9 = None
p_last8 = None
for p in doc.paragraphs:
    if '9. Result' in p.text and p.style.name == 'Heading 1':
        p_sec9 = p
    if 'Career Roadmap is generated based on Skill Gap Analysis' in p.text:
        p_last8 = p

plist = list(doc.paragraphs)
if p_last8 and p_sec9:
    i8 = next((i for i, p in enumerate(plist) if p._p == p_last8._p), -1)
    i9 = next((i for i, p in enumerate(plist) if p._p == p_sec9._p), -1)
    if i8 != -1 and i9 != -1:
        for pb in plist[i8+1:i9]:
            if not pb.text.strip() and not pb._p.xpath('.//a:blip'):
                pb._p.getparent().remove(pb._p)
        print("Cleaned blanks between Sec8 and Sec9")

# 6. Insert 8.1 DFD and 8.2 ERD before Section 9
if p_sec9:
    p_h81 = p_sec9.insert_paragraph_before()
    make_h2(p_h81, "8.1 Data Flow Diagram (DFD)", page_break_before=True)
    make_img_p(p_sec9.insert_paragraph_before(),
               "CareerSphere_Project_Report/Figure_4_Data_Flow_Diagram_DFD.png", 5.8)
    make_caption(p_sec9.insert_paragraph_before(),
                 "Figure 4: CareerSphere AI Data Flow Diagram")
    make_body_p(p_sec9.insert_paragraph_before(),
                "The Data Flow Diagram (DFD) delineates the movement, transformation, and persistent storage of information throughout CareerSphere AI. The Student/User functions as the primary external entity submitting profile information, skill proficiencies, project experiences, certifications, and career objectives to Process P1 (Profile Data Management). Stored profile data in D1 is retrieved by Process P2 (Skills Analysis & Profiling) to establish an evaluated competency matrix using taxonomy benchmarks from D2 (Skill Competency Data). Process P3 (Career Analysis & Mapping) correlates these findings with job criteria stored in D3 (Career Role Standards). Process P4 (Skill Gap Analysis) incorporates verified portfolio records from D4 (Project & Certification Records) to pinpoint technical deficiencies. Process P5 (Career Roadmap Generation) transforms gap assessments into personalized developmental pathways, which Process P6 (Dashboard Visualization) renders as real-time, interactive performance charts and milestone tracking for the student.")

    p_h82 = p_sec9.insert_paragraph_before()
    make_h2(p_h82, "8.2 Entity-Relationship Diagram (ERD)", page_break_before=True)
    make_img_p(p_sec9.insert_paragraph_before(),
               "CareerSphere_Project_Report/Figure_5_Entity_Relationship_Diagram_ERD.png", 5.8)
    make_caption(p_sec9.insert_paragraph_before(),
                 "Figure 5: CareerSphere AI Entity-Relationship Diagram")
    make_body_p(p_sec9.insert_paragraph_before(),
                "The Entity-Relationship Diagram (ERD) defines the conceptual data model and relational schemas underpinning CareerSphere AI. The central STUDENT entity stores unique candidate demographics and career preferences, maintaining one-to-many (1:N) relationships with PROJECT and CERTIFICATION entities to capture practical portfolio records. Student skill evaluations are represented through the associative entity STUDENT_SKILL, linking STUDENT and SKILL via composite foreign keys alongside proficiency metrics. Similarly, industry CAREER_ROLE profiles relate to SKILL via CAREER_SKILL, defining benchmark competencies for each career path. By correlating candidate profiles with career role expectations, the system generates relational records in SKILL_GAP, which systematically guide the generation of structured milestones within the LEARNING_ROADMAP entity.")
    print("Inserted 8.1 and 8.2")

# 7. Populate Section 9 (Result) — intro paragraph + all screenshots
p_sec10 = None
for p in doc.paragraphs:
    if p.style.name == 'Heading 1' and '10. Conclusion' in p.text:
        p_sec10 = p
        break

if p_sec9 and p_sec10:
    p_sec9.paragraph_format.page_break_before = True
    p_sec9.paragraph_format.keep_with_next = True

    plist = list(doc.paragraphs)
    i9 = next((i for i, p in enumerate(plist) if p._p == p_sec9._p), -1)
    i10 = next((i for i, p in enumerate(plist) if p._p == p_sec10._p), -1)
    if i9 != -1 and i10 != -1:
        for pb in plist[i9+1:i10]:
            if not pb.text.strip():
                pb._p.getparent().remove(pb._p)

    # Intro paragraph for Result section
    p_intro = p_sec10.insert_paragraph_before()
    make_body_p(p_intro, RESULT_INTRO)

    # Add all screenshots
    for idx, (fname, caption_text) in enumerate(SCREENSHOTS):
        img_path = os.path.join(SHOTS_DIR, fname)
        if not os.path.exists(img_path):
            print(f"WARNING: {img_path} not found, skipping.")
            continue

        # Page break before each screenshot to keep them clean
        p_img = p_sec10.insert_paragraph_before()
        make_img_p(p_img, img_path, width_in=5.6)

        p_cap = p_sec10.insert_paragraph_before()
        make_caption(p_cap, caption_text)

        # Description paragraph
        desc = SCREEN_DESCRIPTIONS.get(fname, "")
        if desc:
            p_desc = p_sec10.insert_paragraph_before()
            make_body_p(p_desc, desc)

        print(f"  Added: {caption_text}")

    print("Result section fully populated with all screenshots")

# 8. Section 10 Conclusion page break
if p_sec10:
    p_sec10.paragraph_format.page_break_before = True
for p in doc.paragraphs:
    if p.style.name == 'Heading 1' and '11' in p.text:
        p.paragraph_format.page_break_before = True

# 9. Clean empty ghost headings
for p in doc.paragraphs:
    if p.style.name.startswith('Heading') and not p.text.strip():
        p.style = doc.styles['Normal']

doc.save(DST)
# Also copy to report folder
shutil.copyfile(DST, os.path.join("CareerSphere_Project_Report", DST))
print(f"\nSaved: {DST}")
print(f"Saved: CareerSphere_Project_Report/{DST}")
