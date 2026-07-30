# Developer Rules

## Strict UI Testing Before Pushing
**CRITICAL RULE:** Whenever you modify any JavaScript, HTML, or UI-related code in this project, you **MUST** run the UI verification test suite *before* running `git push`. 

The user strictly mandates that no SyntaxErrors, unhandled Promise rejections, or critical loading errors should make their way to GitHub. 

### How to test:
Run the following command in the project root:
```bash
npm test
```
This will launch a Puppeteer headless browser and scan `index.html`, `Mentor/mentor-dashboard.html`, `Aspirant/aspirant-dashboard.html`, and `Admin/admin-dashboard.html` for any console errors or `SyntaxError: Invalid or unexpected token` errors.

If the test fails:
1. DO NOT PUSH the code.
2. Fix the error reported by the test.
3. Run `npm test` again until it passes with 0 errors.

Only once `npm test` passes completely should you commit and push to GitHub.
