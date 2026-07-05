Deployment notes
----------------

Frontend (GitHub Pages)
- Workflow: `.github/workflows/frontend-gh-pages.yml` builds the project and publishes `./dist` to GitHub Pages on pushes to `main`.
- No additional secrets required; uses `GITHUB_TOKEN` provided by Actions.

Backend (Render)
- I added `.github/workflows/deploy-backend-render.yml` which triggers a Render deploy via the Render API when you push to `main`.
- To enable it, set these GitHub secrets in your repository settings:
  - `RENDER_API_KEY` — Your Render API key (found in Render dashboard under API keys).
  - `RENDER_SERVICE_ID` — The Render service id for your backend. You can find it in the service settings or the service URL (it looks like a UUID).

Render manual quick steps:
1. Sign in to https://render.com and create a new Web Service using your GitHub repository and the `backend` folder as the root (or Docker/Node settings as needed).
2. Set the build/run commands according to `backend/package.json` (e.g., build: none, start: `node server.js`).
3. Add environment variables and secrets (DB connection string, `JWT_SECRET`, etc.) in the Render service settings.
4. Add the `RENDER_API_KEY` and `RENDER_SERVICE_ID` to your GitHub repository secrets so the workflow can trigger deploys.

If you want, I can also:
- Create a Render-friendly `render.yaml` manifest.
- Add a small GitHub Action to run backend tests before triggering deploy.
