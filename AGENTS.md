# Security and Data Protection Policies
- STRICT: **NO GOOGLE SIGN IN**. Do not use Google Auth provider for login or saving user data under any circumstances.
- STRICT: **NO MICROSOFT ACCOUNT SAVING**. Do not connect or save data to any Microsoft account.
- **CUSTOMER DATA PROTECTION**: The utmost priority is protecting customer data by maintaining full control over the authentication lifecycle and not leaking telemetry or access to external third-party consumer Oauth flows.
- **LEVEL 10 PRIVILEGES**: Admin Level 10 (root/sys admin) has full unrestricted access to everything in the CRM.
- **CREDENTIAL ISSUANCE**: Admin Level 10 is the sole provider of login credentials to lower-level agents and admins. Users do not self-register; they are provisioned internally.

# System Unification
- Ensure that the dashboard and workspace UI flows intuitively. All aesthetic components should share the `bg-surface-main`, `border-border-subtle`, and accent variables for unified system flow.

# Terminal Creation Rules
Every time a new terminal is added (like an Onboarding Portal, a Lead Management Terminal, or a Training Hub), apply these three rules before finalizing it:

1. **The Context Inheritance Rule**: Does the new terminal have access to the AgentPerformanceContext? Ensure the new terminal inherits the global state of the user. If an Admin opens the new terminal, it should automatically filter by the same tenant_id and permission levels used in the "Company Home Terminal."
2. **The Event Emission Rule**: Does the new terminal notify the Incentive Engine of relevant actions? Any terminal that handles agent activity must be configured to "Publish" events to the central EventBus that feeds the Incentive Engine.
3. **The UI/UX Parity Rule**: Does it look and feel like the rest of the ecosystem? Standardize the "Sidebar Navigation" and "Global Command" headers across all terminals. The UI must match the ecosystem's clean, dark-themed, and glassmorphic look to reduce cognitive load.
