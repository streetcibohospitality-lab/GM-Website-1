# GM Command Center — product map

The Command Center is a private Owner operating system for `dashboard.grubmonkeys.in`.

## Command

- `/overview` — group KPIs, revenue trajectory, health score, priority queue, outlet matrix, selected-outlet console, Owner insights, cost pressure, activity and seven-day control calendar.
- `/outlets` — outlet network, scorecards, target / cost / people / cash controls and drill-down links.
- `/outlets/[id]` — single-outlet command view with revenue, profit, orders, headcount, food/labour cost, operating score, cash reconciliation, staffing and local exceptions.
- `/financials` — group P&L, margin/cost pressure, outlet profitability, channel economics, cash reconciliation, close readiness and six-month trend.
- `/sales` — daily revenue, channel mix/economics, outlet contribution, weekday demand and order velocity.
- `/menu-intelligence` — item economics, volume × margin engineering, category mix, pricing/contribution controls and low-performing item signals.

## Operations

- `/people` — staff register, headcount by outlet, labour efficiency, attendance and movement history.
- `/inventory` — stock risk, count discipline, wastage and transfer opportunities.
- `/procurement` — vendor scorecard, spend, fill rate, price movement, payables and concentration risk.
- `/expenses` — expense categories, outlet expense intensity, ledger and variance detection.

## Control

- `/alerts` — exception queue, rule library, response performance and resolution history.
- `/tasks` — three-Owner action queue, workload distribution and SLA tracking.
- `/insights` — deterministic executive readout across margin, outlets, menu and operating signals.
- `/reports` — management report library, month-close sequence, archive and presentation mode.
- `/documents` — controlled document index, compliance coverage and expiry timeline.
- `/imports` — validated CSV intake for outlet master, daily sales, channel sales, expenses, staff/salary, monthly financials, inventory, vendors, purchases, menu performance and cash reconciliation with downloadable templates.
- `/security` — architecture status, sessions, audit/security feed and device controls.
- `/security/devices` — trusted-browser approval/revocation console.
- `/settings` — operating thresholds, outlet targets and Owner notification policy.

## Identity / security gates

- `/sign-in`
- `/security/setup`
- `/security/verify`
- `/device/register`
- `/device/pending`
- `/access-denied`

## Data foundation

The database schema includes outlets, reporting periods, monthly financials, daily/channel sales, expenses, staff/history/attendance, targets, menu performance, inventory, vendors/purchases, cash reconciliation, documents, alerts, tasks, import jobs, devices, sessions, MFA, security events and append-only audit history.

Demo values exist only to make the complete interface reviewable before Grub Monkeys' real business records are imported. The CSV import workflow is the first production ingestion path.

## People / Employee Lifecycle
- Employee master: joining date, tenure, role, outlet, employment type, monthly labour cost, probation/confirmation dates.
- Exit control: notice-given date, planned last working day, 30/14/7/1 day reminders and exit notes.
- Monthly performance: overall score /10 plus attendance, role execution, teamwork and ownership ratings.
- Performance history: monthly trend retained by reporting period; closed months cannot be silently rewritten.
- Staff event ledger: joining, probation, confirmation, promotion, transfer, recognition, warning, notice, exit and increment events.


## People payroll control
Employee records include current monthly salary, effective date, salary history and audited increment/adjustment records. Salary changes are Owner-only and require fresh MFA.

## Restaurant-chain control layer — v5

The Command Center deliberately adds only four owner-level controls beyond the original business/people/finance scope:

- **Month-end Forecast** — current run-rate projection, target gap, and daily revenue required for the remaining days.
- **Customer Experience** — monthly Google/Swiggy/Zomato ratings plus complaints received/unresolved. It is not a CRM.
- **Maintenance** — critical equipment register and maintenance incidents only; designed for refrigeration, fryers, exhaust, AC, POS and other service-critical assets.
- **Outlet Audits** — one monthly operating scorecard across hygiene, food quality, service, stock discipline, staff presentation, equipment condition and compliance.

The import station now accepts controlled CSVs for outlet master, daily sales, channel sales, expenses, staff/salary, monthly financials, inventory snapshots, vendors, purchases, menu performance and cash reconciliation.
