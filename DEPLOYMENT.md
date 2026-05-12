# Production Deployment Guide

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing: `python manage.py test && npm run build`
- [ ] No console errors or warnings
- [ ] All environment variables documented
- [ ] Secret values never committed to version control
- [ ] Linting passes: `npm run lint` (or eslint)

### Security Review
- [ ] `DJANGO_SECRET_KEY` is strong and unique
- [ ] `DJANGO_DEBUG=False` in production
- [ ] CORS origins restricted to production domains
- [ ] CSRF tokens enabled
- [ ] HTTPS enforced everywhere
- [ ] API key rotation plan in place
- [ ] No credentials in error messages or logs

### Performance
- [ ] Frontend builds successfully: `npm run build`
- [ ] Backend handles expected load
- [ ] Database queries optimized
- [ ] Caching strategy implemented
- [ ] Static files optimized (minified CSS/JS)

### Database
- [ ] Migrations tested and verified
- [ ] Backup strategy defined
- [ ] Database credentials rotated
- [ ] PostgreSQL replaces SQLite in production

### Monitoring & Logging
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring enabled
- [ ] Log aggregation set up
- [ ] Alert thresholds defined

## Backend Deployment (Django)

### Option 1: Render.com

1. **Connect Repository**
   - Go to render.com
   - New Web Service → GitHub
   - Select repository

2. **Configure Environment**
   ```
   Build Command: pip install -r backend/requirements.txt && python backend/manage.py migrate
   Start Command: cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
   ```

3. **Set Environment Variables**
   ```
   DJANGO_DEBUG=False
   DJANGO_SECRET_KEY=<generate-strong-key>
   DJANGO_ALLOWED_HOSTS=<your-render-domain>
   DJANGO_CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>
   DJANGO_CSRF_TRUSTED_ORIGINS=https://<your-frontend-domain>
   DATABASE_URL=postgres://<database-url>
   ORS_API_KEY=<your-openrouteservice-key>
   ```

4. **Add PostgreSQL Database**
   - Create new PostgreSQL service
   - Note the connection string
   - Add as `DATABASE_URL` environment variable

5. **Deploy**
   - Click "Deploy"
   - Monitor build and deployment logs

### Option 2: Railway.app

1. **Deploy with GitHub**
   - New project → Deploy from GitHub
   - Select repository

2. **Add PostgreSQL**
   - Add PostgreSQL service
   - Environment variables auto-populated

3. **Configure Django Service**
   ```
   Start Command: cd backend && gunicorn config.wsgi:application
   PYTHONUNBUFFERED=1
   ```

4. **Add Environment Variables**
   - Same as Render.com configuration

5. **Deploy**
   - Automatic deployment on push

### Option 3: Fly.io

1. **Install Fly CLI**
   ```bash
   curl https://fly.io/install.sh | sh
   ```

2. **Initialize**
   ```bash
   cd backend
   fly launch
   ```

3. **Create Postgres Database**
   ```bash
   fly postgres create
   ```

4. **Set Environment Variables**
   ```bash
   fly secrets set DJANGO_SECRET_KEY=<value>
   fly secrets set DJANGO_DEBUG=False
   fly secrets set ORS_API_KEY=<value>
   # ... other variables
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

### Gunicorn Configuration

**Procfile** (or in deployment settings):
```
web: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 4 --worker-class sync --timeout 60
```

**config/wsgi.py** (no changes needed, Django default works)

### Database Migration in Production

```bash
# One-time after deployment
manage.py migrate

# Add to deploy process before starting server
```

## Frontend Deployment (React/Vite)

### Option 1: Vercel

1. **Connect Repository**
   - Sign up at vercel.com
   - Import project → GitHub
   - Select repository

2. **Configure Build**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `frontend/dist`

3. **Set Environment Variables**
   ```
   VITE_API_BASE_URL=https://<your-backend-domain>/api
   ```

4. **Deploy**
   - Automatic on push to main branch

### Option 2: Netlify

1. **Connect Repository**
   - netlify.com → New site from Git
   - Select GitHub repo

2. **Configure Deployment**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```

3. **Set Environment Variables**
   - Site settings → Build & Deploy → Environment
   - Add `VITE_API_BASE_URL=https://<your-backend-domain>/api`

4. **Configure Redirects** (for SPA routing)
   - Create `frontend/public/_redirects`:
   ```
   /* /index.html 200
   ```

5. **Deploy**
   - Automatic on push

### Option 3: Cloudflare Pages

1. **Connect Repository**
   - pages.cloudflare.com
   - Connect Git → GitHub
   - Select repository

2. **Configure Build**
   ```
   Build command: npm run build --prefix frontend
   Build output directory: frontend/dist
   ```

3. **Set Environment Variables**
   - VITE_API_BASE_URL

4. **Deploy**
   - Automatic deployment

## Complete Deployment Workflow

### Step 1: Prepare Backend

```bash
# Update dependencies
cd backend
pip freeze > requirements.txt

# Test migrations work
python manage.py migrate --run-syncdb --dry-run

# Collect static files
python manage.py collectstatic --noinput

# Run tests
python manage.py test

# Create super user for admin access
python manage.py createsuperuser
```

### Step 2: Prepare Frontend

```bash
# Update dependencies
cd frontend
npm update

# Build and test
npm run build
npm run lint

# Test production build locally
npm run preview
```

### Step 3: Deploy Backend

```bash
# Option 1: Manual deployment via git push
git push origin main  # Triggers Render/Railway/Fly.io deploy

# Option 2: Deploy button in service dashboard
# Option 3: Manual deployment via CLI
```

**Verify Backend**:
- [ ] API responds: `curl https://<your-backend>/api/trips/create/`
- [ ] Admin accessible: `https://<your-backend>/admin/`
- [ ] Migrations applied: Check database
- [ ] Environment variables loaded

### Step 4: Deploy Frontend

```bash
# Option 1: Automatic via git push
git push origin main  # Triggers Vercel/Netlify deploy

# Option 2: Manual via dashboard
# Upload dist/ folder directly
```

**Verify Frontend**:
- [ ] Site loads: `https://<your-frontend>`
- [ ] API calls work
- [ ] Form submission succeeds
- [ ] Map renders
- [ ] No console errors

### Step 5: Monitor & Maintain

```bash
# Check logs
# Vercel: Dashboard → Logs
# Render: Dashboard → Logs
# Railway: Dashboard → Logs

# Monitor performance
# Check error rate, response time, uptime
```

## Post-Deployment Configuration

### DNS Setup

**Example for custom domain**:
```
A record: points to CDN/hosting provider
CNAME record: www subdomain
```

### HTTPS Certificate

- Automatic with Vercel, Netlify, Cloudflare Pages
- Automatic with Render, Railway, Fly.io
- No action needed in most cases

### Performance Optimization

1. **CDN Configuration**
   - Enable in platform settings
   - Vercel/Netlify/Cloudflare automatically use global CDN

2. **Caching Headers**
   - Static files: 1 year cache
   - API responses: no cache

3. **Compression**
   - Enabled by default on most platforms

## Monitoring & Alerts

### Error Tracking (Sentry Example)

1. **Backend Integration**
   ```bash
   pip install sentry-sdk
   ```

   **settings.py**:
   ```python
   import sentry_sdk
   sentry_sdk.init(
       dsn="https://xxx@xxx.ingest.sentry.io/xxx",
       traces_sample_rate=0.1,
       profiles_sample_rate=0.1,
   )
   ```

2. **Frontend Integration**
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

   **App.jsx**:
   ```jsx
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     tracesSampleRate: 0.1,
   });
   ```

3. **Set up alerts**
   - Error rate threshold
   - Email notifications
   - Slack integration

### Performance Monitoring

**Backend** (via platform):
- Response time
- Error rate
- CPU/Memory usage

**Frontend** (via Vercel Analytics or similar):
- Core Web Vitals
- Page load time
- User interactions

## Database Management

### PostgreSQL Backup Strategy

1. **Automated Backups**
   - Render: Automatic daily backups retained 30 days
   - Railway: Point-in-time recovery available
   - Fly.io: Via `fly backup`

2. **Manual Backups**
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```

3. **Restore**
   ```bash
   psql $DATABASE_URL < backup.sql
   ```

### Database Scaling

- **Initial**: Small PostgreSQL (dev tier)
- **Growth**: Standard PostgreSQL (production tier)
- **High Load**: Multi-region replication

## Version Management

### Semantic Versioning

```
MAJOR.MINOR.PATCH

1.0.0 - Initial release
1.1.0 - Add new feature (backwards compatible)
1.1.1 - Bug fix
2.0.0 - Breaking change
```

### Release Process

1. Tag release: `git tag v1.0.0`
2. Push tags: `git push origin v1.0.0`
3. Create release notes on GitHub
4. Monitor deployment
5. Verify functionality in production

## Rollback Procedure

### If Deployment Fails

1. **Check logs** for errors
2. **Verify environment variables** are set correctly
3. **Check database migrations** ran successfully
4. **Revert to previous version**:
   ```bash
   git revert HEAD
   git push origin main
   ```

5. **Platform should auto-redeploy**
   - Vercel: Auto-redeploy on push
   - Railway: Auto-redeploy on push
   - Render: Manual redeploy via dashboard

### Zero-Downtime Deployments

- Vercel/Netlify: Automatic blue-green deployment
- Railway/Render: Single-instance may have brief downtime
- Fly.io: Zero-downtime with multiple regions

## Cost Optimization

### Backend Costs
- Render starter ($7/mo): Good for hobby
- Render standard ($25/mo): Good for production
- Consider: Fly.io ($5-10/mo for small apps)

### Frontend Costs
- Vercel: Free tier included, per-function pricing
- Netlify: Free tier, then per-build pricing
- Cloudflare Pages: $20/mo or free with Cloudflare

### Database Costs
- PostgreSQL on Render: $7-25/mo depending on size
- PostgreSQL on Railway: Hourly billing (~$5-20/mo)

### Total Estimated Monthly Cost
- Small: $15-25/month
- Medium: $40-60/month
- Large: $100+/month

## Disaster Recovery Plan

### Scenario 1: Database Corruption

```bash
1. Restore from recent backup
2. Re-run migrations if needed
3. Test data integrity
4. Notify users if data loss
5. Monitor for recurrence
```

### Scenario 2: API Key Compromised

```bash
1. Revoke current OpenRouteService API key
2. Generate new API key
3. Update environment variable
4. Restart backend
5. Monitor for abuse
6. Consider rate limiting
```

### Scenario 3: Frontend Deployment Issue

```bash
1. Check build logs for errors
2. Verify environment variables
3. Roll back to previous version
4. Test locally before re-deploying
5. Monitor deployment closely
```

## Maintenance Schedule

### Weekly
- Check error tracking for patterns
- Review performance metrics
- Monitor disk usage

### Monthly
- Update dependencies: `pip list --outdated`, `npm outdated`
- Review security advisories
- Test backup/restore procedure
- Check SSL certificate expiration

### Quarterly
- Load testing
- Disaster recovery drill
- Security audit
- Cost analysis and optimization

## Support & Documentation

### User Support
- FAQs document
- Email support channel
- Community forum (optional)

### Developer Documentation
- README.md - Quick start
- SETUP.md - Configuration
- TECHNICAL.md - Architecture
- API documentation (Swagger/OpenAPI)

### Runbooks
- How to scale database
- How to add new features
- How to debug common issues
- How to handle outages

## Conclusion

This deployment guide provides a complete path from development to production. Choose hosting platforms that match your needs, follow the security checklist, and implement monitoring for reliability.

For questions or issues, refer to platform-specific documentation or community forums.
