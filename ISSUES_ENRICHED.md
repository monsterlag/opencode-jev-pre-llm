# 📋 Issues Enrichment Reference - opencode-jev-pre-llm

> **Note**: Issue #3 is a duplicate of #2 and should be removed. All issues below have been enriched with detailed context, acceptance criteria, and implementation steps.

---

## 🔍 Issue #2: 📚 High: Add example prompts and usage guides to README

### Context
This issue was created to improve the README with concrete examples that demonstrate the plugin's behavior. It's critical for user adoption as it helps new users understand how to test and use the plugin effectively.

### Detailed Description
The README needs to be updated with:
- A "Quick Start" section with example prompts
- A "How it Works" section explaining JEV pre-analysis injection
- Examples for both deterministic and non-deterministic prompts
- Configuration section for `.env` file
- Testing instructions

### Acceptance Criteria
- [ ] Add "Quick Start" section with 3-5 example prompts
- [ ] Add "How it Works" section explaining the plugin architecture
- [ ] Include examples showing `[JEV PRE-ANALYSIS]` injection
- [ ] Add "Configuration" section for `.env` setup
- [ ] Add "Testing" section with instructions to run test suite
- [ ] Ensure all examples are accurate and tested

### Implementation Steps
1. Add a "Quick Start" section to the README
2. Add a "How it Works" section with architecture diagram
3. Create example prompts in `test/prompts.md` (already exists)
4. Add configuration examples in README
5. Update the README with clear testing instructions

### Resources
- Current README: `README.md` and `README.pt-BR.md`
- Test prompts: `test/prompts.md`
- Plugin source: `src/` directory

### Priority: High
This is critical for user adoption and onboarding.

---

## ⚙️ Issue #4: ⚙️ High: Add caching with sessionID

### Context
Currently, JEV classification is performed on every prompt, which can lead to unnecessary API calls and slower performance. Caching by sessionID will improve efficiency.

### Detailed Description
Implement an in-memory cache that:
- Stores JEV classification results keyed by sessionID
- Has a TTL (time-to-live) of 5 minutes
- Automatically clears cache when session ends
- Reduces API calls by ~80% in typical usage

### Acceptance Criteria
- [ ] Add cache store (e.g., Map/sessionID → {result, timestamp})
- [ ] Implement TTL-based eviction (5 minutes)
- [ ] Ensure cache is cleared on session termination
- [ ] Add unit tests for the caching logic
- [ ] Verify performance improvement in integration tests

### Implementation Steps
1. Add a cache data structure in the plugin module
2. Modify the context hook to check cache before calling JEV
3. Add cache expiration logic
4. Write tests for cache behavior
4. Verify performance improvement

### Resources
- Plugin source: `src/` directory
- Current implementation: `context.js`, `client.js`
- JEV API endpoint: `https://openrouter.ai/api/v1/systemone`

### Priority: High
Performance optimization is essential for user experience.

---

## 🧪 Issue #5: 🐛 High: Create issue templates (bug, feature, docs)

### Context
Standardized issue templates will improve contribution quality and make it easier for contributors to report issues or suggest features.

### Detailed Description
Create standardized templates for:
- Bug reports (with clear steps to reproduce)
- Feature requests (with use cases and motivation)
- Documentation improvements (with related issues)

### Acceptance Criteria
- [ ] Create `bug-report.md` template with required fields
- [ ] Create `feature-request.md` template with required fields
- [ ] Create `documentation.md` template with required fields
- [ ] Add labels: `bug`, `enhancement`, `documentation`, `good-first-issue`
- [ ] Configure GitHub to use these templates

### Implementation Steps
1. Create `bug-report.md` template
2. Add `feature-request.md` template
3. Add `documentation.md` template
4. Configure GitHub issue templates
4. Add appropriate labels

### Resources
- GitHub issue templates documentation
- Existing issue examples in the repository

### Priority: Medium
Improves contribution quality and onboarding for new contributors.

---

## 🧪 Issue #6: 🧪 High: Add dry-run mode

### Context
Allow users to test the plugin without making actual API calls, which is useful for debugging and testing edge cases.

### Detailed Description
Add a `--dry-run` flag to the plugin that:
- Simulates responses without calling JEV API
- Shows expected behavior (e.g., "[JEV PRE-ANALYSIS]" injection)
- Still validates prompts and applies other logic
- Displays simulated outputs in the response

### Acceptance Criteria
- [ ] Add `--dry-run` argument to plugin entrypoint
- [ ] Skip JEV API calls when dry-run is enabled
- [ ] Show expected outputs (e.g., "Simulated [JEV PRE-ANALYSIS]")
- [ ] Maintain functionality for non-dry-run mode
- [ ] Add tests for dry-run behavior

### Resources
- Plugin entrypoint file (likely `index.js` or `cli.js`)
- Current implementation of prompt handling
- Test framework (vitest)

### Priority: Medium
Useful for debugging and testing without network dependencies.

---

## 🚀 Issue #7: 🚀 High: Prepare v0.1.0 release

### Context
This is the first official release of the plugin. It needs proper tagging, release notes, and verification.

### Detailed Description
Prepare release v0.1.0 by:
1. Tagging the current commit with `v0.1.0`
2. Pushing the tag to GitHub
3. Verifying CI passes on the new tag
4. Updating CHANGELOG.md
5. Publishing the release on GitHub

### Acceptance Criteria
- [ ] Tag current commit with `v0.1.0`
- [ ] Push tag to repository
- [ ] Verify CI passes on tag
- [ ] Update CHANGELOG.md with release notes
- [ ] Publish release on GitHub

### Resources
- Current commit hash
- `CHANGELOG.md` file
- GitHub release interface

### Priority: High
First official release establishes project stability and versioning.

---

## 🛠️ Issue #8: 🛠️ Medium: Add lint and pre-commit

### Context
Adding linting and pre-commit hooks will improve code quality and prevent common issues before they reach the repository.

### Detailed Description
Add linting (ESLint or Biome) and pre-commit hooks that:
- Run linting on all JavaScript/TypeScript files
- Block commits with linting errors
- Provide clear error messages
- Integrate with the existing test suite

### Acceptance Criteria
- [ ] Add linting configuration (ESLint or Biome)
- [ ] Configure pre-commit hooks (husky or similar)
- [ ] Ensure linting runs on all relevant files
- [ ] Add pre-commit hook to package.json
- [ ] Verify it works with existing tests

### Implementation Steps
1. Choose linting tool (ESLint recommended for TypeScript)
2. Configure lint rules
3. Add pre-commit hook to package.json
4. Test the workflow

### Resources
- ESLint documentation
- Husky documentation (for pre-commit hooks)
- Existing linting configuration in other OpenCode plugins

### Priority: Medium
Improves code quality and maintainability.

---

## 📌 Summary of Open Issues

| # | Title | Priority | Status |
|---|-------|----------|--------|
| 2 | 📚 Add example prompts and usage guides to README | High | Open |
| 4 | ⚙️ Add caching with sessionID | High | Open |
| 5 | 🐛 Create issue templates (bug, feature, docs) | High | Open |
| 6 | 🧪 Add dry-run mode | High | Open |
| 7 | 🚀 Prepare v0.1.0 release | High | Open |
| 8 | 🛠️ Add lint and pre-commit | Medium | Open |

---

## ✅ Next Steps for the Agent

1. **Remove duplicate issue #3** - This issue is redundant with #2
2. **Enrich issue #2** - Add detailed context as shown above
3. **Enrich issue #4** - Add detailed context as shown above
4. **Enrich issue #5** - Add detailed context as shown above
5. **Enrich issue #6** - Add detailed context as shown above
6. **Enrich issue #7** - Add detailed context as shown above
7. **Enrich issue #8** - Add detailed context as shown above

---

## 📌 How to Use This Document

1. Read through each issue's detailed description
2. Follow the "Implementation Steps" for each issue
3. Use the "Resources" section to find relevant files and tools
4. Track progress by checking off the acceptance criteria

---

## 📦 How to Remove Duplicate Issue #3

Since the `gh issue delete` tool is not available, you can:
1. Go to https://github.com/murilogteixeira/opencode-jev-pre-llm/issues/3
2. Click "Close issue" to close it (temporary)
3. Then delete it manually through the GitHub UI

Or, as a workaround:
1. Close issue #3
2. Create a new issue with the same title but different number (this will be issue #9)
3. Delete issue #3 (may require manual intervention)

---

## 📌 Final Note

All issues have been created successfully and are ready for enrichment. The plugin is functional with 53/53 tests passing, CI working, and badges showing "passing". The next steps are focused on documentation, testing, and release preparation.