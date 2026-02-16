# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 2.1.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

We take the security of Axiom-OMC Integration seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do Not

- **Do not** open a public GitHub issue for security vulnerabilities
- **Do not** disclose the vulnerability publicly until it has been addressed

### Please Do

**Report security vulnerabilities via GitHub Security Advisories:**

1. Go to the [Security tab](https://github.com/liangjie559567/axiom-omc-integration/security) of the repository
2. Click "Report a vulnerability"
3. Fill out the form with details about the vulnerability

**Or email us directly at:**

[INSERT SECURITY EMAIL ADDRESS]

### What to Include

Please include the following information in your report:

- **Type of vulnerability** (e.g., XSS, SQL injection, command injection, etc.)
- **Full paths of source file(s)** related to the vulnerability
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the vulnerability** including how an attacker might exploit it

### What to Expect

After you submit a report, we will:

1. **Acknowledge receipt** within 48 hours
2. **Provide an initial assessment** within 5 business days
3. **Keep you informed** about our progress
4. **Credit you** in the security advisory (unless you prefer to remain anonymous)

### Security Update Process

1. **Confirmation**: We confirm the vulnerability and determine its severity
2. **Fix Development**: We develop a fix in a private repository
3. **Testing**: We thoroughly test the fix
4. **Release**: We release a security patch
5. **Disclosure**: We publish a security advisory with details

### Security Best Practices

When using Axiom-OMC Integration, please follow these security best practices:

#### 1. Protect Sensitive Information

- **Never commit** `.mcp.json` or other files containing API keys
- **Use environment variables** for sensitive configuration
- **Rotate API keys** regularly
- **Use `.gitignore`** to exclude sensitive files

#### 2. Keep Dependencies Updated

```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix
```

#### 3. Secure Configuration

- **Review permissions** before granting access to agents
- **Limit agent capabilities** to what's necessary
- **Use least privilege principle** for file system access
- **Validate all inputs** from external sources

#### 4. Safe Agent Execution

- **Review agent code** before execution
- **Sandbox agent execution** when possible
- **Monitor agent behavior** for suspicious activity
- **Set execution timeouts** to prevent infinite loops

#### 5. Network Security

- **Use HTTPS** for all external API calls
- **Validate SSL certificates**
- **Implement rate limiting** for API requests
- **Use secure authentication** methods

### Known Security Considerations

#### 1. Command Injection

The CLI system executes commands. Ensure:
- Input validation is performed
- Commands are properly escaped
- User input is sanitized

#### 2. File System Access

The system has file system access. Ensure:
- Paths are validated and normalized
- Access is restricted to allowed directories
- Symbolic links are handled safely

#### 3. API Keys and Secrets

The system uses API keys. Ensure:
- Keys are stored securely
- Keys are not logged or exposed
- Keys have appropriate permissions

#### 4. Agent Execution

Agents execute code. Ensure:
- Agent code is reviewed
- Execution is sandboxed
- Resources are limited

### Security Checklist for Contributors

Before submitting code, ensure:

- [ ] No hardcoded credentials or API keys
- [ ] Input validation for all user inputs
- [ ] Proper error handling (no sensitive info in errors)
- [ ] Dependencies are up to date
- [ ] No known vulnerabilities in dependencies
- [ ] Code follows secure coding practices
- [ ] Tests include security test cases

### Vulnerability Disclosure Timeline

- **Day 0**: Vulnerability reported
- **Day 1-2**: Acknowledgment sent
- **Day 3-7**: Initial assessment completed
- **Day 8-30**: Fix developed and tested
- **Day 31**: Security patch released
- **Day 32**: Public disclosure (if appropriate)

### Hall of Fame

We would like to thank the following individuals for responsibly disclosing security vulnerabilities:

<!-- List will be updated as vulnerabilities are reported and fixed -->

*No vulnerabilities reported yet.*

---

## Questions?

If you have questions about this security policy, please open a discussion in the [Discussions](https://github.com/liangjie559567/axiom-omc-integration/discussions) section.

---

**Last Updated**: 2026-02-17
