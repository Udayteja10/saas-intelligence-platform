# SubTrack AI

Enterprise-grade Multi-Tenant SaaS Intelligence Platform for managing subscriptions, licenses, vendors, budgets, renewals, forecasting, reporting, and AI-powered cost optimization.

---

## Overview

SubTrack AI helps organizations gain visibility into their SaaS ecosystem by tracking software subscriptions, licenses, vendor relationships, budgets, and renewal schedules.

The platform provides analytics, forecasting, reporting, and AI-powered recommendations to reduce unnecessary software spending and improve SaaS governance.

Designed as a real-world enterprise SaaS application, the platform supports multi-tenancy, role-based access control, JWT authentication, organization isolation, and scalable cloud-native deployment.

---

## Key Features

### Multi-Tenant Architecture

* Organization-based tenant isolation
* One user belongs to exactly one organization
* Secure tenant-aware data access
* Organization onboarding and provisioning

### Authentication & Security

* JWT Authentication
* Google OAuth2 Login
* Role-Based Access Control (RBAC)
* BCrypt Password Hashing
* Secure API Authorization

### Subscription Management

* Manage SaaS subscriptions
* Track subscription costs
* Monitor renewal dates
* Vendor relationship management
* Contract tracking

### License Management

* License inventory tracking
* License utilization monitoring
* Unused license detection
* Assignment management

### Budget Management

* Department budgets
* Budget utilization analysis
* Cost tracking
* Overspending alerts

### AI-Powered Insights

* Cost optimization recommendations
* Renewal advisor
* Budget advisor
* Vendor risk analysis
* SaaS health scoring
* Forecast analysis
* AI assistant chatbot

### Reporting

* PDF Report Generation
* Excel Export
* Executive summaries
* Analytics reports
* Cost reports

### Analytics & Forecasting

* Spending trends
* Vendor distribution analysis
* Budget forecasting
* SaaS health metrics
* Cost forecasting engine

### Audit & Governance

* Audit logs
* Activity tracking
* Change history
* Compliance support

---

## System Architecture

```text
React + TypeScript
        │
        ▼
      Nginx
        │
        ▼
Spring Boot 3
        │
        ▼
 Service Layer
        │
        ▼
 Spring Data JPA
        │
        ▼
 Hibernate ORM
        │
 ┌──────┴──────┐
 ▼             ▼
MySQL       Redis
```

---

## Tech Stack

### Frontend

* React 18
* TypeScript
* Tailwind CSS
* React Router DOM
* Axios
* Lucide React
* Vite

### Backend

* Java 21
* Spring Boot 3
* Spring Security
* Spring Data JPA
* Hibernate 6
* Maven
* JWT Authentication
* OAuth2

### Database & Cache

* MySQL 8
* Redis 7

### Infrastructure

* Docker
* Docker Compose
* Nginx

### Reporting

* PDF Generation
* Excel Export

### AI Layer

* AI Assistant
* Cost Optimization Engine
* Forecast Engine
* Budget Advisor
* Renewal Advisor
* Vendor Risk Analyzer

---

## Database Design

Core entities:

* Organization
* User
* Subscription
* Vendor
* License
* Budget
* Contract
* Forecast
* HealthScore
* Report
* PurchaseRequest
* Notification
* AuditLog

---

## User Roles

### ORG_ADMIN

* Manage organization
* Manage users
* Manage budgets
* Generate reports
* Access analytics
* Configure settings

### MANAGER

* Manage subscriptions
* Manage licenses
* Approve requests
* View reports

### EMPLOYEE

* View assigned licenses
* Submit purchase requests
* Access personal dashboard

---

## Running with Docker

### Start Application

```bash
docker-compose up --build -d
```

### Access Services

Frontend

```text
http://localhost:5173
```

Backend

```text
http://localhost:8080
```

MySQL

```text
localhost:3307
```

Redis

```text
localhost:6379
```

### Stop Application

```bash
docker-compose down
```

---

## Local Development

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Security Features

* JWT Access Tokens
* Refresh Tokens
* BCrypt Password Encryption
* Organization Isolation
* Role-Based Authorization
* Secure API Access

---

## Future Enhancements

* Real Google OAuth Integration
* Stripe Billing Integration
* Email Notifications
* Slack Integration
* Microsoft Teams Integration
* OpenAI-Powered Cost Optimization
* Advanced Forecasting Models
* Kubernetes Deployment
* CI/CD Pipelines

---

## Screenshots

### Dashboard

*Add dashboard screenshot here*

### AI Assistant

*Add AI assistant screenshot here*

### Subscription Management

*Add subscription management screenshot here*

---

## Project Goals

This project demonstrates enterprise-level software engineering concepts including:

* Multi-Tenant SaaS Architecture
* Secure Authentication & Authorization
* Domain-Driven Design
* REST API Development
* Database Design
* Dockerized Deployment
* Analytics & Reporting
* AI-Powered Business Insights

---

## Author

Uday Teja

Built as a portfolio project demonstrating modern Java Full Stack development using Java 21, Spring Boot, React, TypeScript, MySQL, Redis, Docker, and enterprise SaaS architecture.
