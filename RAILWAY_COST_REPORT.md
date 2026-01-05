# Railway Hosting Cost Analysis for EdCon App
**Generated:** November 29, 2025  
**Excludes:** Free $5 trial credits

---

## Railway Pricing Structure

| Resource | Cost per Month (730 hrs) |
|----------|--------------------------|
| **Memory (RAM)** | $10.14/GB |
| **CPU (vCPU)** | $20.29/vCPU |
| **Volume Storage** | $0.158/GB |
| **Network Egress** | $0.05/GB |

*Railway bills by the second for actual usage, not reserved capacity.*

---

## Cost Summary

| Students | Monthly Cost | Annual Cost | Cost per Student/Year |
|----------|--------------|-------------|----------------------|
| **300** | $18.84 | $226.08 | **$0.75** |
| **1,000** | $46.50 | $558.00 | **$0.56** |
| **10,000** | $238.84 | $2,866.08 | **$0.29** |

---

## Scenario 1: 300 Students

### Resource Requirements
- **Backend API:** 0.2 vCPU, 0.5 GB RAM
- **PostgreSQL Database:** 0.1 vCPU, 0.38 GB RAM
- **Volume Storage:** 10 GB
- **Network Egress:** 45 GB/month
- **Peak Concurrent Users:** ~20-30 students (10% of total)

### Monthly Cost: **$18.84**

| Service | Cost |
|---------|------|
| Backend API (CPU + RAM) | $9.13 |
| Database (CPU + RAM) | $5.88 |
| Volume Storage | $1.58 |
| Network Egress | $2.25 |

**Per Student:** $0.063/month = **$0.75/year**

---

## Scenario 2: 1,000 Students

### Resource Requirements
- **Backend API:** 0.4 vCPU, 1.2 GB RAM
- **PostgreSQL Database:** 0.25 vCPU, 0.8 GB RAM
- **Volume Storage:** 35 GB
- **Network Egress:** 150 GB/month
- **Peak Concurrent Users:** ~80-100 students (10% of total)

### Monthly Cost: **$46.50**

| Service | Cost |
|---------|------|
| Backend API (CPU + RAM) | $20.29 |
| Database (CPU + RAM) | $13.18 |
| Volume Storage | $5.53 |
| Network Egress | $7.50 |

**Per Student:** $0.047/month = **$0.56/year**

---

## Scenario 3: 10,000 Students

### Resource Requirements
- **Backend API:** 0.8 vCPU, 2.5 GB RAM
- **PostgreSQL Database:** 0.5 vCPU, 1.5 GB RAM
- **Volume Storage:** 350 GB
- **Network Egress:** 1,500 GB/month (1.5 TB)
- **Peak Concurrent Users:** ~800-1,000 students (10% of total)

### Monthly Cost: **$238.84**

| Service | Cost |
|---------|------|
| Backend API (CPU + RAM) | $41.59 |
| Database (CPU + RAM) | $25.35 |
| Volume Storage | $55.30 |
| Network Egress | $75.00 |

**Per Student:** $0.024/month = **$0.29/year**

---

## Plan Recommendations

| Student Count | Plan | Monthly Payment | Notes |
|---------------|------|-----------------|-------|
| **300** | Hobby | $18.84 | Perfect fit under $20! |
| **1,000** | Hobby/Pro | $46.50 | Consider Pro for priority support |
| **10,000** | Pro | $238.84 | Priority support & unlimited seats |

---

## Why This Works

✅ **Low concurrent usage:** Only 5-10% of students active simultaneously  
✅ **Efficient queries:** Prisma ORM with proper indexing  
✅ **Compression:** 30-40% reduction in storage and bandwidth  
✅ **Caching:** Railway's edge caching reduces API calls  
✅ **Usage-based billing:** Pay only for active CPU/RAM, not idle time  
✅ **Natural patterns:** Peak during school hours, quiet evenings/weekends  

---

## Optimization Strategies

1. **Implement caching** (Redis) - reduces database CPU by 30-40%
2. **Compress file uploads** - saves 30-40% on storage and bandwidth
3. **Use Railway's private networking** - free internal service communication
4. **CDN integration** (at scale) - reduces egress costs by 50-70%
5. **Connection pooling** - optimizes database connections

---

## Conclusion

Railway's usage-based pricing makes EdCon extremely cost-effective:

- **300 students:** $18.84/month = **$0.75/student/year** 🎯
- **1,000 students:** $46.50/month = **$0.56/student/year**
- **10,000 students:** $238.84/month = **$0.29/student/year**

**Bottom line:** Start with Hobby Plan ($5/month minimum). With proper optimization, you can serve 300 students for under $20/month, 1,000 students for under $50/month, and 10,000 students for under $250/month.

---

*Estimates based on typical education platform usage patterns with 5-10% concurrent users and optimized caching/compression.*
