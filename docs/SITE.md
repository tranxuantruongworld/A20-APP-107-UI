# Documentation Index

Muc tieu cua bo docs la giup nguoi moi vao du an hieu nhanh theo 2 lop: Product va Architecture.

## Folder Structure

| Folder | Muc dich |
|---|---|
| [01-product](01-product) | Tai lieu yeu cau san pham, use case, task planning |
| [02-architecture](02-architecture) | Tai lieu ky thuat theo thu tu phu thuoc |

## 1) Product Docs

| Doc | Noi dung |
|---|---|
| [01-product/PRD.md](01-product/PRD.md) | Product requirements document |
| [01-product/PRD-Review.md](01-product/PRD-Review.md) | Danh gia PRD va risk |
| [01-product/use-cases.md](01-product/use-cases.md) | Use case theo boi canh su dung |
| [01-product/task-breakdown.md](01-product/task-breakdown.md) | Phan cong task theo vai tro |
| [01-product/resources.md](01-product/resources.md) | Tai nguyen tham khao |

## 2) Architecture Docs

Doc ky thuat duoc danh so theo dependency, doc tu thap len cao:

| # | Doc | Muc dich |
|---|---|---|
| 00 | [02-architecture/00-architecture-overview.md](02-architecture/00-architecture-overview.md) | Tong quan he thong |
| 01 | [02-architecture/01-question-pipeline.md](02-architecture/01-question-pipeline.md) | Luong xu ly end-to-end |
| 02 | [02-architecture/02-api-layer.md](02-architecture/02-api-layer.md) | REST + WebSocket contracts |
| 03 | [02-architecture/03-database-schema.md](02-architecture/03-database-schema.md) | Data model + truy van |
| 04 | [02-architecture/04-asr-engine.md](02-architecture/04-asr-engine.md) | Voice to text (ASR) |
| 05 | [02-architecture/05-nlp-clustering.md](02-architecture/05-nlp-clustering.md) | Gom nhom cau hoi |
| 06 | [02-architecture/06-ranking-relevance.md](02-architecture/06-ranking-relevance.md) | Xep hang uu tien |
| 07 | [02-architecture/07-tts-engine.md](02-architecture/07-tts-engine.md) | Text to speech |
| 08 | [02-architecture/08-dashboard-ui.md](02-architecture/08-dashboard-ui.md) | Moderator dashboard |
| 09 | [02-architecture/09-deployment.md](02-architecture/09-deployment.md) | Deploy + scale + ops |

## Reading Paths

| Vai tro | Lo trinh goi y |
|---|---|
| PM/BA | PRD -> PRD-Review -> use-cases -> task-breakdown |
| Backend | 00 -> 01 -> 02 -> 03 -> 05 -> 06 |
| Frontend | 00 -> 02 -> 08 |
| Voice/AI | 00 -> 04 -> 05 -> 07 |
| DevOps | 00 -> 03 -> 09 |

## Maintenance Rules

1. Product thay doi thi cap nhat [01-product](01-product) truoc.
2. Ky thuat thay doi thi cap nhat file trong [02-architecture](02-architecture) theo dung domain.
3. Khi them doc moi, giu quy uoc danh so va cap nhat index nay.
