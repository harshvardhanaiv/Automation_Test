# AIV Documentation Style & Validation Rules

This document outlines the strict validation rules and style guidelines for generating and verifying detailed user documentation across all sections of AIV (Analytics Intelligence Visualization).

---

## 1. File Naming & Location
* **Detailed Guides**: Must be saved with the suffix `<section_name>_detailed.md`.
* **Target Folder**: Saved under the corresponding section folder path (e.g., `docs/generated/documents/<section_name>/`).

---

## 2. Image & Screenshot Rules (CRITICAL)
* **Allowed Extensions**: All image tags MUST reference `.png` images. **No `.webp` extensions are allowed.**
* **Path Prefix**: Every image reference must use the relative path matching the screenshots structure:
  `![Alt Text](../../../../screenshots/<category>/<section_name>/<filename.png>)`
* **Exclusion of Official Web Assets**: Do not copy or output astro-specific web assets (e.g., paths containing `_astro/` or hashes like `filename.ab724aff_Z2eDFWG.webp`).
* **Filesystem Verification**: Every referenced screenshot filename must exist as a real file on the disk within the screenshots folder for that section (e.g., `screenshots/<category>/<section_name>/`). Hallucinated screenshots are strictly forbidden. If a proper screenshot is missing for a step, the automation test must be rerun to capture it.
* **No Backtick Wrapping**: Markdown image syntax (e.g., `![Alt Text](...)`) must not be wrapped inside inline code blocks or backticks. Example of incorrect syntax: `` `![Alt Text](...)` ``.

---

## 3. Document Structure Requirements
Each document must follow this exact hierarchy:
1. **Header Title**: Starts with `# [Feature Title]` (e.g., `# Parameter Tab`).
2. **Introduction**: A clear, beginner-friendly introductory paragraph explaining what the feature/section does and its purpose.
3. **Objectives & Use Cases**:
   * **Objective**: Clear statement explaining what the user will achieve.
   * **Use Case**: A practical, real-world scenario showing why a user would use this feature.
4. **Prerequisites (Conditional)**:
   * Include a prerequisites section ONLY if there are specific design files, sample data, or configuration templates (e.g., BIRT report files like `Order details.rptdesign`) that the user needs to upload or prepare before executing the steps.
   * **Forbidden**: Do NOT include generic prerequisites like "Log in to the system", "Ensure you have a valid account", or "Familiarize yourself with the layout".
   * Omit the prerequisites section entirely if no specific file/data dependencies exist.
5. **Guides & Layouts (Choose A or B depending on the section)**:
   * **A. For the "Introduction" Section / Layout Guides**:
     * Must provide a structured **Interface Layout & Navigation Guide** covering the key components of that screen layout (e.g., sidebar menus, search boxes, toolbar buttons, listing grids).
     * For each key component, write descriptive paragraphs explaining its purpose followed by the corresponding screenshot.
   * **B. For all other step-by-step Sections**:
     * Must provide a **Step-by-Step Guide** with numbered steps.
     * Each step must have a bold title (e.g., `### Step X: [Action]`).
     * Explicitly detail the **Action** (with UI elements like buttons, inputs, checkboxes in **bold**).
     * Detail the **Expected Result** and why the option is set.
     * End the step with its corresponding screenshot using the standard relative image syntax.

---

## 4. Tone, Links, and Exclusions
* **Tone**: Explanatory, fluid prose suited for absolute beginners. Avoid QA jargon, dry checklists, or generic headings like "Why?", "What is happening?", or "What is expected?".
* **Links**: No links referring users to external or generic common documentation (e.g., `[AIV Documentation](../../../common/docs)` is forbidden).
* **Ending**: Do NOT add any summary, wrap-ups, conclusions, next steps, or "Additional Resources" sections. The document must terminate immediately after the final action step.
