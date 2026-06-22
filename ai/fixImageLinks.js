const fs = require('fs');
const path = require('path');

const reportDir = path.join(__dirname, '../docs/generated/documents/report');

const REPLACEMENTS = {
    'introduction_detailed.md': [
        ['reports-section-opened.png', 'reports-daily-01-page.png'],
        ['new-tab-icon.png', 'reports-daily-02-stats.png'],
        ['output-format-dropdown.png', 'reports-daily-03-stat-btns.png'],
        ['run-button.png', 'reports-daily-05-search-typed.png'],
        ['context-menu.png', 'reports-daily-08-context-menu.png']
    ],
    'parameter_detailed.md': [
        ['parameter.1d5ac685_9wEnk.png', 'reports-daily-10-scheduler.png'],
        ['parameter1.9c5afa08_iAvwu.png', 'reports-daily-12-param-tab.png']
    ],
    'email_detailed.md': [
        ['rightnow4.b1b2b27c_Z2ubuwf.png', 'reports-daily-20-email-tab.png'],
        ['email.854b5aa6_26zmWq.webp', 'reports-daily-21-email-fields.png']
    ],
    'hide_grid_reportexport_detailed.md': [
        ['_astro/waitfilebeingdownloaded.a5a6a26d_RQ8ca.webp', 'reports-daily-23-before-run.png'],
        ['_astro/hidegrid1.90a1c773_Z1dhwqf.webp', 'reports-daily-25-run-verified.png'],
        ['_astro/hidegrid2.2f38f44f_Z1h7ENp.webp', 'reports-daily-17-output-tab.png'],
        ['_astro/hidegrid3.65cf33e6_ZC0Yyu.webp', 'reports-daily-24-requests.png'],
        ['_astro/hidegrid4.1c7921d3_1QOBOY.webp', 'reports-daily-08-context-menu.png'],
        ['_astro/hidegrid5.a30b3bb1_imPQp.webp', 'reports-daily-18-output-format.png']
    ],
    'hide_report_options_detailed.md': [
        ['reports-daily-08-report-list-view.png', 'reports-daily-01-page.png'],
        ['reports-daily-08-hide-options-dialog-box.png', 'reports-daily-08-context-menu.png'],
        ['![Hide Icon](../../../../screenshots/documents/reports/hidesettings.png)', '**Hide**'],
        ['reports-daily-08-select-demo-user.png', 'reports-daily-09-ctx-schedule.png'],
        ['reports-daily-08-configure-hide-options.png', 'reports-daily-09-ctx-schedule.png'],
        ['reports-daily-08-confirmation-popup.png', 'reports-daily-22-scheduler-closed.png'],
        ['reports-daily-08-login-demo-user.png', 'reports-daily-01-page.png'],
        ['reports-daily-08-run-report.png', 'reports-daily-23-before-run.png'],
        ['reports-daily-08-verify-restricted-options.png', 'reports-daily-25-run-verified.png']
    ],
    'single_sheet_option_detailed.md': [
        ['![Create icon](../../../../screenshots/documents/reports/hamburger.8b1c425a_1nYq8T.webp)', 'the **Hamburger icon**'],
        ['astro-hamburger.png', 'reports-daily-01-page.png'],
        ['astro-report-preview.png', 'reports-daily-08-context-menu.png'],
        ['![Create icon](../../../../screenshots/documents/reports/exportreporticon.e22ae709_6RxUi.webp)', 'the **Export Report Icon**'],
        ['astro-export-options.png', 'reports-daily-09-ctx-schedule.png'],
        ['astro-export-settings.png', 'reports-daily-17-output-tab.png'],
        ['astro-single-sheet-enabled.png', 'reports-daily-18-output-format.png'],
        ['astro-report-downloaded.png', 'reports-daily-25-run-verified.png'],
        ['astro-single-sheet-report.png', 'reports-daily-25-run-verified.png']
    ]
};

Object.keys(REPLACEMENTS).forEach(filename => {
    const filePath = path.join(reportDir, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Warning: ${filename} does not exist.`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const pairs = REPLACEMENTS[filename];
    
    pairs.forEach(([target, replacement]) => {
        content = content.split(target).join(replacement);
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Patched image links in: ${filename}`);
});
