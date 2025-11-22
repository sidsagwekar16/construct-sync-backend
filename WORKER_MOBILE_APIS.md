# Worker Mobile APIs Documentation

## Overview

Worker mobile APIs provide endpoints specifically designed for construction workers to access their assigned jobs, sites, report safety incidents, view schedules, and manage their profiles. All endpoints require authentication and worker role.

**Base Path**: `/api/mobile/worker/*`

**Authentication**: Bearer token required for all endpoints

**Authorization**: Worker role (`UserRole.WORKER`) required for all endpoints

## API Endpoints

### Jobs

#### List Worker's Assigned Jobs
```
GET /api/mobile/worker/jobs
```

Query Parameters:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `status` (string, optional): Filter by job status
- `siteId` (string, optional): Filter by site ID
- `startDate` (string, optional): Filter by start date
- `endDate` (string, optional): Filter by end date

Response: Paginated list of jobs assigned to the worker

#### Get Job Details
```
GET /api/mobile/worker/jobs/:id
```

Response: Detailed information about a specific job (only if worker is assigned)

#### Get Job Tasks
```
GET /api/mobile/worker/jobs/:id/tasks
```

Response: List of tasks for the job

#### Update Task Status
```
PATCH /api/mobile/worker/jobs/:id/tasks/:taskId
```

Body:
```json
{
  "status": "in_progress" | "completed" | "pending" | "cancelled" | "blocked",
  "notes": "Optional notes"
}
```

Response: Updated task information

### Sites

#### List Worker's Sites
```
GET /api/mobile/worker/sites
```

Query Parameters:
- `page` (number, optional)
- `limit` (number, optional)
- `status` (string, optional)
- `search` (string, optional)

Response: Paginated list of sites where worker has assigned jobs

#### Get Site Details
```
GET /api/mobile/worker/sites/:id
```

Response: Detailed site information (only if worker has jobs there)

#### Get Worker's Jobs at Site
```
GET /api/mobile/worker/sites/:id/jobs
```

Response: List of worker's jobs at the specific site

### Safety

#### List Worker's Safety Incidents
```
GET /api/mobile/worker/safety/incidents
```

Query Parameters:
- `page` (number, optional)
- `limit` (number, optional)
- `severity` (string, optional): minor | moderate | major | critical | fatal
- `status` (string, optional): open | investigating | resolved | closed
- `jobId` (string, optional)
- `startDate` (string, optional)
- `endDate` (string, optional)

Response: Paginated list of incidents reported by the worker

#### Get Incident Details
```
GET /api/mobile/worker/safety/incidents/:id
```

Response: Detailed incident information (only if reported by worker)

#### Report Safety Incident
```
POST /api/mobile/worker/safety/incidents
```

Body:
```json
{
  "jobId": "uuid",
  "incidentDate": "ISO 8601 date-time string",
  "description": "string",
  "severity": "minor" | "moderate" | "major" | "critical" | "fatal",
  "location": "string (optional)"
}
```

Response: Created incident details

#### Get Safety Statistics
```
GET /api/mobile/worker/safety/incidents/statistics
```

Response:
```json
{
  "totalIncidents": number,
  "bySeverity": {
    "minor": number,
    "moderate": number,
    ...
  },
  "byStatus": {
    "open": number,
    "investigating": number,
    ...
  }
}
```

### Schedule

#### Get Worker's Schedule
```
GET /api/mobile/worker/schedule
```

Query Parameters:
- `startDate` (string, optional): ISO 8601 date-time
- `endDate` (string, optional): ISO 8601 date-time

Response: List of jobs within the date range

#### Get Today's Jobs
```
GET /api/mobile/worker/schedule/today
```

Response: List of jobs scheduled for today

#### Get This Week's Jobs
```
GET /api/mobile/worker/schedule/week
```

Response: List of jobs scheduled for this week

### Profile

#### Get Worker Profile
```
GET /api/mobile/worker/profile
```

Response:
```json
{
  "id": "uuid",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "worker",
  "phone": "string",
  "hourlyRate": number,
  "companyId": "uuid",
  "companyName": "string",
  "isActive": boolean,
  "createdAt": "ISO 8601 date-time"
}
```

#### Update Worker Profile
```
PATCH /api/mobile/worker/profile
```

Body:
```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "phone": "string (optional)"
}
```

Response: Updated profile

#### Get Worker Statistics
```
GET /api/mobile/worker/profile/stats
```

Response:
```json
{
  "totalJobsAssigned": number,
  "completedJobs": number,
  "activeJobs": number,
  "safetyIncidentsReported": number,
  "tasksCompleted": number
}
```

## Data Filtering Rules

### Jobs
- Workers can only see jobs they are assigned to (via `job_workers` table)
- Assignment is determined by company admins/managers

### Sites
- Workers can only see sites where they have assigned jobs
- Site access is derived from job assignments

### Safety Incidents
- Workers can only see incidents they reported
- Workers can only report incidents for jobs they are assigned to

### Tasks
- Workers can see all tasks for jobs they're assigned to
- Workers can update task status for any task on their assigned jobs

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Access token is required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied. worker role required."
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Job not found or you are not assigned to this job"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "You are not assigned to this job or job not found"
}
```

## Testing

Comprehensive test suites are available in:
- `backend/tests/middlewares/rbac.test.ts`
- `backend/tests/mobile/worker/jobs.test.ts`
- `backend/tests/mobile/worker/sites.test.ts`
- `backend/tests/mobile/worker/safety.test.ts`
- `backend/tests/mobile/worker/schedule.test.ts`
- `backend/tests/mobile/worker/profile.test.ts`

Run tests with:
```bash
npm test -- tests/mobile/worker
npm test -- tests/middlewares/rbac.test.ts
```

## Implementation Notes

1. **Role-Based Access Control**: All worker routes use the `requireWorker` middleware which checks for `UserRole.WORKER`

2. **Data Security**: Workers can only access data related to their assigned jobs and their own reports

3. **Read-Only Restrictions**: Workers have limited update capabilities:
   - Can update: Task status, their own profile (limited fields)
   - Cannot update: Job details, site details, hourly rates

4. **Future Enhancements** (Not yet implemented):
   - Time tracking (clock in/out)
   - Timesheet management
   - Earnings calculation
   - Worker notifications
   - Worker chat/messaging



