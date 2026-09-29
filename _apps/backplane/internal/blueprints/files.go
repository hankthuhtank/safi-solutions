package blueprints

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"

	"safisolutions.org/backplane/internal/core"
)

// templateVars returns Resend variable declarations for a system template.
func templateVars(key string) []any {
	var index []struct {
		Key       string   `json:"key"`
		Variables []string `json:"variables"`
	}
	_ = json.Unmarshal([]byte(Asset("emails/index.json")), &index)
	for _, t := range index {
		if t.Key != key {
			continue
		}
		out := make([]any, 0, len(t.Variables))
		for _, v := range t.Variables {
			out = append(out, map[string]any{"key": v, "type": "string", "fallback_value": fallbackFor(v)})
		}
		return out
	}
	return nil
}

func fallbackFor(v string) string {
	switch v {
	case "CUSTOMER_NAME":
		return "there"
	case "LICENSE_KEY", "LOCATION":
		return ""
	case "BUSINESS_NAME":
		return "Our team"
	case "SUPPORT_EMAIL":
		return "us"
	case "INTERVAL":
		return "month"
	case "EXPIRES":
		return "24 hours"
	case "ACTION_LABEL":
		return "Open"
	case "DEPOSIT":
		return "—"
	}
	return ""
}

// SystemEmails lists the reusable email templates Backplane can add to Resend.
func SystemEmails() []map[string]any {
	var index []map[string]any
	_ = json.Unmarshal([]byte(Asset("emails/index.json")), &index)
	return index
}

// SystemEmailHTML returns a system email's HTML.
func SystemEmailHTML(key string) string { return Asset("emails/" + key + ".html") }

// GenerateFiles produces every generated file for a project (path → content).
// Files are written to the project's code folder; the engine reads them by
// path, and user-edited copies are detected by hash and never overwritten.
func GenerateFiles(p *core.Project) (map[string]string, error) {
	bp := &p.Blueprint
	t, ok := Get(bp.TemplateID)
	if !ok {
		return nil, fmt.Errorf("unknown template %s", bp.TemplateID)
	}
	files := map[string]string{}
	switch t.Engine {
	case "commerce":
		worker := strings.ReplaceAll(Asset("commerce/worker.js"), "{{PROJECT_NAME}}", p.Name)
		files["worker/src/index.js"] = worker
		files["worker/wrangler.jsonc"] = Asset("commerce/wrangler.jsonc")
		files["supabase/schema.sql"] = Asset("commerce/schema.sql")
		files["emails/purchase.html"] = Asset("emails/purchase.html")
		files["README.md"] = commerceReadme(p, t)
	case "data":
		for k, v := range dataFiles(p, t) {
			files[k] = v
		}
	}
	if bp.Param("include_github") != "false" {
		files[".github/workflows/deploy.yml"] = Asset("shared/deploy.yml")
		files[".gitignore"] = Asset("shared/gitignore.txt")
	}
	return files, nil
}

// CodeVersion is a short digest of the generated Worker (shown on the dashboard
// and reported by the Worker's health endpoint).
func CodeVersion(files map[string]string) string {
	sum := sha256.Sum256([]byte(files["worker/src/index.js"]))
	return hex.EncodeToString(sum[:])[:12]
}

func commerceReadme(p *core.Project, t Template) string {
	var b strings.Builder
	fmt.Fprintf(&b, "# %s — backend\n\n", p.Name)
	b.WriteString("Generated and monitored by **Backplane** (Safi Solutions). Template: " + t.Name + ".\n\n")
	b.WriteString("## How it works\n\n```\n")
	for i, s := range t.Flow {
		if i > 0 {
			b.WriteString("      ↓\n")
		}
		b.WriteString(s + "\n")
	}
	b.WriteString("```\n\n")
	b.WriteString(`## Endpoints

| Method | Path | What it does |
| --- | --- | --- |
| GET / POST | /checkout | Creates a Stripe Checkout Session and redirects the customer (or returns JSON with ` + "`Accept: application/json`" + `). |
| GET | /thanks | Thank-you page after payment. |
| POST | /stripe/webhook | Verifies Stripe's signature, records the order once, issues a signed download link, sends the email. Refunds revoke access. |
| GET | /download?t=… | Streams the file from private R2 storage if the signed link is valid, unexpired and not refunded. |
| POST | /links | Emails fresh download links to a past customer (rate limited, never reveals whether an email has orders). |
| POST | /license/validate | Checks a license key (License Server template). |
| POST | /resend/webhook | Records delivery, bounce and complaint events (Svix signature verified). |
| GET | /__backplane/health | Health report for Backplane (requires the probe token). |

## Layout

- ` + "`worker/src/index.js`" + ` — the Cloudflare Worker.
- ` + "`worker/wrangler.jsonc`" + ` — bindings and settings (no secrets).
- ` + "`supabase/migrations/`" + ` — tables, indexes and row-level security.
- ` + "`emails/`" + ` — the purchase email (also published as a Resend template).
- ` + "`.github/workflows/deploy.yml`" + ` — deploys the Worker on every push to main.

## Secrets

Secrets never live in this repository. Backplane stores them encrypted on the owner's computer and sets them directly on
Cloudflare (Worker secrets) and GitHub (encrypted Actions secrets).

## Editing

You can edit anything. Backplane notices changed files, marks them **USER MODIFIED** and will not overwrite them
without asking.
`)
	return b.String()
}
