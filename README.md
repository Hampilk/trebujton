# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/aaa4b285-03f5-471f-aeaf-6f254c369b3a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/aaa4b285-03f5-471f-aeaf-6f254c369b3a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/aaa4b285-03f5-471f-aeaf-6f254c369b3a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## CMS Feature - Database Schema

### Migrations

#### 1. CMS Pages Schema (`20250201000000_cms_pages.sql`)
Creates the core CMS tables:
- **`pages`**: Stores page metadata (slug, title, publication status)
- **`page_layouts`**: Stores layout JSON with widget configurations

#### 2. Theme Overrides Schema (`20251210072248_page_theme_overrides.sql`)
Extends pages with theme customization:
- **`theme_overrides`** column: Per-page theme configuration (mode, variant, colors)
- **`page_theme_override_audit`** table: Change tracking with user attribution
- **Validation**: CHECK constraint ensures valid theme override structure
- **Triggers**: Auto-updates timestamps and logs theme changes

### Service Layer

**Location:** `src/services/cms/pageLayouts.js`

Unified service handling both layout and theme data:

```javascript
// Load page with layout and theme overrides
const pageData = await loadPageLayout(pageId);
// Returns: { layout_json, theme_overrides, pages: {...} }

// Save layout and/or theme overrides
await savePageLayout(pageId, layoutData, themeOverrides);

// Update theme overrides independently
await updatePageThemeOverrides(pageId, { themeMode: 'dark' });

// Merge partial theme changes
await mergePageThemeOverrides(pageId, { themeVariant: 'pro' });

// View change history
const auditLog = await getPageThemeOverrideAuditLog(pageId);
```

### Documentation

For complete implementation details, see:
- **[CMS_PHASE3_IMPLEMENTATION.md](./CMS_PHASE3_IMPLEMENTATION.md)** - Full Phase 3 documentation
- **Migration Files:** `supabase/migrations/`
- **Service Tests:** `src/test/services/cms/pageLayouts.test.js`
