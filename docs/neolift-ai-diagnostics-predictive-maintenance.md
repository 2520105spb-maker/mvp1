# НеоЛифт ERP/PWA — AI Diagnostics & Predictive Maintenance Module

## 0. Назначение модуля

AI Diagnostics & Predictive Maintenance — промышленный модуль ERP/PWA системы «НеоЛифт» для диагностики лифтового оборудования, выявления повторных ремонтов, прогнозирования отказов, контроля качества обслуживания, анализа расхода материалов и поддержки управленческих решений.

Это не chatbot UI, не AI demo, не generic analytics dashboard и не маркетинговая страница. Модуль проектируется как production predictive maintenance platform для реальной сервисной лифтовой компании с тысячами лифтов, миллионами событий, историей ремонтов, фотофиксацией, материалами, аварийными вызовами и будущими IoT-потоками.

Стек модуля:

- Frontend: Next.js, React, TypeScript, Tailwind, shadcn/ui, WebSockets;
- Core ERP backend: NestJS, PostgreSQL, Redis, WebSockets;
- AI services: Python, FastAPI;
- Time-series storage: TimescaleDB;
- Event streaming: Kafka или RabbitMQ;
- Feature store/cache: PostgreSQL/TimescaleDB + Redis;
- Background processing: queue workers;
- Model registry и model artifact storage;
- Object storage для фото и AI artifacts.

---

# 1. AI architecture

## 1.1 High-level system boundaries

AI-модуль состоит из 6 производственных контуров:

1. **Data ingestion layer**
   - события заказ-нарядов;
   - история ремонтов;
   - списания материалов;
   - результаты фото/AI validation;
   - аварийные заявки;
   - простои;
   - механик performance events;
   - будущие IoT telemetry events.

2. **Feature engineering layer**
   - агрегаты по лифтам;
   - временные признаки отказов;
   - признаки повторных ремонтов;
   - признаки расхода материалов;
   - признаки качества механиков;
   - признаки фотофиксации;
   - time-series features для сенсоров.

3. **ML inference layer**
   - failure risk scoring;
   - component remaining useful life estimation;
   - repeated repair detection;
   - mechanic anomaly scoring;
   - material anomaly detection;
   - photo reuse/tampering checks;
   - elevator health scoring.

4. **Decision layer**
   - risk classification;
   - recommendations;
   - escalation rules;
   - alerts;
   - suggested preventive work orders;
   - suggested purchase requests.

5. **Operational UX layer**
   - AI monitoring center;
   - elevator health workspace;
   - high-risk object queue;
   - anomaly alerts;
   - recommendations;
   - explainability panels.

6. **Governance layer**
   - AI audit logs;
   - model versioning;
   - explainability;
   - role permissions;
   - sensitive analytics protection;
   - feedback loop from dispatchers/managers.

## 1.2 Service topology

```text
Next.js ERP/PWA
  ├─ AI Monitoring Workspace
  ├─ Elevator Health Cards
  ├─ Anomaly Alert Queue
  └─ Recommendation Panels

NestJS ERP API
  ├─ AI Gateway Module
  ├─ WorkOrders Module
  ├─ Materials/Warehouse Module
  ├─ Notifications Module
  └─ WebSocket Gateway

Python FastAPI AI Services
  ├─ predictive-maintenance-service
  ├─ repeated-repair-service
  ├─ mechanic-performance-service
  ├─ material-anomaly-service
  ├─ photo-analytics-service
  ├─ health-score-service
  └─ recommendation-service

Data Platform
  ├─ PostgreSQL transactional data
  ├─ TimescaleDB time-series/events
  ├─ Redis cache/features/locks
  ├─ Kafka/RabbitMQ event bus
  └─ S3-compatible model/photo/artifact storage
```

## 1.3 AI service principles

- AI-сервисы не изменяют транзакционные ERP-данные напрямую.
- AI-сервисы пишут predictions, anomalies, risk assessments и recommendations.
- Все AI outputs имеют model version, input snapshot id и explanation.
- Любая рекомендация должна быть actionable: создать заявку, проверить объект, назначить ТО, запросить фото, заблокировать списание.
- Critical alerts должны проходить escalation policy.
- Backend остается source of truth для прав доступа, маршрутов, статусов и подтверждений.

---

# 2. AI data sources

## 2.1 Work Orders

Используются признаки:

- тип работ;
- статус;
- длительность выполнения;
- механик;
- объект;
- лифт;
- повторность;
- возвраты диспетчером;
- комментарии;
- AI validation status;
- время между созданием, отправкой, подтверждением.

## 2.2 Repair History

Признаки:

- частота ремонтов по лифту;
- частота ремонтов по узлу;
- повторные ремонты по одной категории;
- интервалы между отказами;
- сезонность;
- связь с возрастом оборудования;
- связь с предыдущими материалами.

## 2.3 Material Usage

Признаки:

- расход по заказ-наряду;
- расход по механику;
- расход по объекту;
- расход по типу лифта;
- превышение нормы;
- частота замены одной детали;
- списание без подтверждающих фото;
- складской источник.

## 2.4 Elevator Failures

Признаки:

- тип отказа;
- критичность;
- аварийность;
- простой;
- повторность;
- компонент;
- последствия;
- история аналогичных отказов.

## 2.5 Mechanic Performance

Признаки:

- среднее время ремонта;
- процент возвратов;
- качество фото;
- частота повторных вызовов после механика;
- расход материалов относительно нормы;
- доля ручных/нестандартных работ;
- SLA нарушения;
- подтвержденные/оспоренные замечания.

## 2.6 Photo Validation Results

Признаки:

- blur score;
- OCR confidence;
- signature detection;
- duplicate/reuse score;
- object match score;
- tampering suspicion;
- mismatch между фото и типом работ.

## 2.7 Downtime Statistics

Признаки:

- длительность простоев;
- число простоев за период;
- SLA impact;
- повторяемость по объекту;
- корреляция с материалами/узлами.

## 2.8 Emergency Calls

Признаки:

- аварийный вызов после планового ТО;
- аварийный вызов после ремонта;
- интервал от последней работы;
- механик/бригада последней работы;
- компонентная причина.

## 2.9 Sensor Data future-ready

Будущие потоки:

- вибрация;
- двери: циклы, ошибки закрытия/открытия;
- контроллер: error codes;
- температура;
- токи двигателя;
- скорость/рывки;
- частота остановок;
- telemetry heartbeat.

---

# 3. Predictive maintenance logic

## 3.1 Цель

Predictive Maintenance прогнозирует вероятные отказы и деградацию узлов до возникновения аварии. Результат должен помогать диспетчеру и руководителю принимать операционные решения: назначить профилактику, заменить узел, выдать материалы, усилить контроль объекта.

## 3.2 Input features

Для каждого лифта и компонента формируются признаки:

- `repair_count_7d/30d/90d/365d`;
- `emergency_call_count_30d/90d`;
- `repeat_repair_count_30d`;
- `avg_days_between_failures`;
- `last_failure_days_ago`;
- `downtime_minutes_30d`;
- `material_usage_by_component_90d`;
- `elevator_age_years`;
- `manufacturer/model/type`;
- `component_replacement_frequency`;
- `photo_quality_average`;
- `maintenance_compliance_score`;
- future `sensor_anomaly_score`.

## 3.3 Models

Recommended model classes:

1. **Risk classification**
   - binary/multiclass failure risk: low, medium, high, critical;
   - gradient boosting, random forest, calibrated logistic regression or production ML platform equivalent.

2. **Time-to-failure / survival model**
   - прогноз времени до вероятного отказа;
   - Cox model, Weibull/AFT, survival forest or deep survival model.

3. **Component RUL model**
   - remaining useful life по узлам;
   - initially rules + statistical model;
   - later sensor-enhanced model.

4. **Anomaly detection**
   - isolation forest, robust z-score, seasonal decomposition;
   - для редких отказов, необычного расхода и sensor anomalies.

## 3.4 Output

Prediction output:

- `risk_score` 0–100;
- `risk_level` low/medium/high/critical;
- `predicted_failure_window` например 7/14/30 дней;
- `probable_component`;
- `failure_probability`;
- `confidence`;
- `top_risk_factors[]`;
- `recommended_actions[]`;
- `model_version`;
- `valid_until`.

## 3.5 Recommendations

Примеры рекомендаций:

- «Проверить двери шахты в течение 7 дней»;
- «Выдать механику ролики D45 и контакт ДК-1 перед выездом»;
- «Назначить внеплановое ТО»;
- «Проверить объект на повторные неисправности дверей»;
- «Заменить узел до вероятной аварии»;
- «Запросить фото подтверждения повторного ремонта».

---

# 4. Repeated repair detection

## 4.1 Цель

Repeated Repair Detection выявляет ремонты, которые не решили проблему, циклические неисправности и хронические проблемы объекта.

## 4.2 Detection rules

Initial rules:

- тот же лифт + тот же компонент + повторный ремонт в течение N дней;
- аварийный вызов после ремонта в течение N дней;
- та же работа + тот же материал повторяется больше X раз за период;
- разные механики выполняют однотипный ремонт на одном лифте;
- возврат диспетчером по одному и тому же блоку несколько раз.

## 4.3 ML enhancement

- clustering repair narratives/actions/elements;
- semantic matching of work item descriptions;
- anomaly detection по frequency/time interval;
- graph analysis: elevator ↔ mechanic ↔ material ↔ failure type.

## 4.4 Output

- repeated repair risk;
- likely unresolved root cause;
- affected component;
- linked work orders;
- responsible object/elevator;
- recommended escalation;
- suggested senior mechanic inspection.

---

# 5. Mechanic performance AI

## 5.1 Цель

Оценивать качество работы механиков объективно и операционно: не для «рейтинга ради рейтинга», а для контроля повторных вызовов, перерасхода, качества фото и соблюдения регламентов.

## 5.2 Signals

- average repair time by work type;
- return rate;
- dispatcher rejection reasons;
- repeat call rate after mechanic;
- material usage vs norm;
- suspicious repeated part replacements;
- photo quality score;
- missing photo rate;
- signature missing rate;
- late submission rate;
- work order completeness.

## 5.3 Scores

Mechanic AI Score состоит из:

- `quality_score`;
- `repeat_repair_score`;
- `material_discipline_score`;
- `photo_compliance_score`;
- `sla_score`;
- `risk_flags[]`.

## 5.4 Detected issues

AI выявляет:

- механик часто меняет одну деталь без устойчивого результата;
- расход материалов выше группы;
- много возвратов на доработку;
- низкое качество фото;
- повторные аварии после работ;
- подозрительные ремонты без подтверждающих фото;
- возможная потребность в обучении или контроле.

## 5.5 UX usage

- dispatcher видит warning на заказ-наряде;
- руководитель видит mechanic risk profile;
- склад видит material overuse by mechanic;
- система предлагает mentoring/audit, а не автоматическое наказание без проверки.

---

# 6. Elevator Health Score

## 6.1 Назначение

Elevator Health Score — агрегированная оценка технического состояния лифта, которая помогает приоритизировать обслуживание.

## 6.2 Score dimensions

- `failure_frequency`;
- `emergency_call_weight`;
- `repeat_repair_weight`;
- `downtime_weight`;
- `age_weight`;
- `component_wear_weight`;
- `maintenance_compliance`;
- `material_usage_anomaly`;
- future `sensor_health`.

## 6.3 Score formula v1

```text
health_score = 100
  - failure_frequency_penalty
  - emergency_penalty
  - downtime_penalty
  - repeat_repair_penalty
  - component_wear_penalty
  - maintenance_noncompliance_penalty
  - sensor_anomaly_penalty
  + recent_successful_maintenance_bonus
```

Score bands:

- 85–100: healthy;
- 70–84: watch;
- 50–69: degraded;
- 0–49: critical.

## 6.4 Health Score UI

Для каждого лифта показывать:

- score;
- risk band;
- критичность;
- вероятные узлы риска;
- прогноз ближайшего отказа;
- рекомендации;
- contributing factors;
- timeline последних событий;
- сравнение с лифтами аналогичного типа/возраста.

---

# 7. Failure heatmaps

## 7.1 Heatmap types

- heatmap проблемных объектов;
- heatmap аварий;
- heatmap повторных ремонтов;
- heatmap износа компонентов;
- material overuse heatmap;
- mechanic repeat-repair heatmap;
- future sensor anomaly heatmap.

## 7.2 Data dimensions

- geography;
- customer;
- building;
- elevator;
- component;
- failure type;
- time window;
- mechanic/brigade;
- material category.

## 7.3 UX rules

- heatmap is operational, not decorative;
- every hot zone must allow drill-down to object/elevator/work orders;
- color scale must show thresholds and counts;
- no fake chart data;
- empty/insufficient data state must be explicit.

---

# 8. AI photo analytics

## 8.1 Photo checks

AI analyzes:

- blur;
- darkness/glare;
- required object presence;
- detail category match;
- installation traces;
- document OCR readability;
- signature presence;
- duplicate image hash;
- perceptual hash reuse;
- EXIF/time/location mismatch;
- tampering suspicion.

## 8.2 Use cases

- block work order submit if required photo is missing;
- warn dispatcher about reused photo;
- identify repair without real installed/demounted detail evidence;
- connect poor photo quality to mechanic performance;
- detect mismatch between claimed material and photographed part.

## 8.3 Output

- `photo_quality_score`;
- `object_match_score`;
- `duplicate_score`;
- `tamper_score`;
- `ocr_confidence`;
- `signature_detected`;
- `blocking_issues[]`;
- `warnings[]`.

---

# 9. Recommendation engine

## 9.1 Recommendation categories

- materials to take before visit;
- elevators requiring preventive attention;
- components likely to fail;
- objects requiring senior inspection;
- suspicious write-offs requiring audit;
- purchase suggestions;
- mechanic training/control suggestions.

## 9.2 Recommendation format

Each recommendation includes:

- `recommendation_id`;
- `type`;
- `target_entity`;
- `priority`;
- `reason`;
- `evidence[]`;
- `expected_impact`;
- `actions[]`;
- `expires_at`;
- `model_version`.

## 9.3 Human-in-the-loop

Users can:

- accept recommendation;
- dismiss with reason;
- escalate;
- create work order;
- create purchase request;
- assign senior mechanic;
- mark false positive.

Feedback returns to model evaluation dataset.

---

# 10. Realtime AI monitoring center

## 10.1 Purpose

Realtime AI Monitoring Center — operational workspace for critical elevators, active anomalies, emergency trends and mass failures.

## 10.2 Monitored streams

- new emergency calls;
- work_order_submitted;
- photo_validation_failed;
- material_writeoff_anomaly;
- repeated_repair_detected;
- health_score_changed;
- prediction_escalated;
- future sensor_anomaly_detected.

## 10.3 Operational cards

Cards should represent actual actions:

- critical elevator alert;
- repeated repair cluster;
- suspicious mechanic/material anomaly;
- photo fraud suspicion;
- purchase shortage risk;
- sensor anomaly.

Each card contains:

- severity;
- object/elevator;
- root factors;
- evidence;
- recommended action;
- owner;
- SLA timer;
- escalation state.

---

# 11. AI workspace UI architecture

## 11.1 Route structure

```text
/app/(manager)/ai
  /monitoring
  /elevators/[elevatorId]
  /objects/[buildingId]
  /mechanics/[mechanicId]
  /anomalies/[anomalyId]
  /recommendations
```

## 11.2 Left panel

Left panel is an operational queue:

- critical objects;
- emergency alerts;
- high-risk elevators;
- repeated repair clusters;
- anomaly alerts;
- suspicious material operations.

Filters:

- severity;
- object;
- component;
- model type;
- status;
- assigned owner;
- time window.

## 11.3 Center panel

Center panel shows analytics for selected target:

- risk trends;
- health score timeline;
- prediction timeline;
- repair pattern timeline;
- repeated repair evidence;
- work order links;
- downtime context;
- material usage context.

No decorative fake charts: each visualization must support drill-down and decisions.

## 11.4 Right panel

Right panel shows AI insights:

- recommendations;
- anomaly explanation;
- top risk factors;
- predicted failures;
- model confidence;
- related work orders;
- suggested actions;
- feedback controls.

## 11.5 Mobile AI UX

Mobile mode is for supervisors in the field:

- alert queue;
- elevator health summary;
- evidence list;
- recommended action buttons;
- call/assign/escalate;
- no dense multi-chart workspace.

---

# 12. AI alert system

## 12.1 Alert channels

- in-app push;
- WebSocket live alert;
- mobile notification;
- Telegram alert for critical operations if approved by company policy;
- email summary for managers;
- escalation task in ERP.

## 12.2 Escalation policy

Severity levels:

1. `info` — dashboard only;
2. `warning` — queue + owner notification;
3. `high` — supervisor notification + SLA timer;
4. `critical` — immediate push/Telegram + escalation chain;
5. `safety_critical` — emergency protocol.

## 12.3 Alert deduplication

- group alerts by elevator/component/time window;
- suppress duplicates while incident is open;
- update existing alert with new evidence;
- escalate if risk increases.

## 12.4 Alert lifecycle

```text
created → acknowledged → assigned → action_taken → resolved → reviewed
```

All transitions audited.

---

# 13. ML pipeline

## 13.1 Data ingestion

Sources publish events to Kafka/RabbitMQ:

- `work_order_closed`;
- `material_written_off`;
- `photo_validation_completed`;
- `emergency_call_created`;
- `elevator_downtime_recorded`;
- `dispatcher_returned_work_order`;
- future `sensor_telemetry_received`.

Consumers write normalized records to PostgreSQL/TimescaleDB.

## 13.2 Feature engineering

Feature jobs:

- daily elevator aggregates;
- rolling 7/30/90 day windows;
- mechanic performance aggregates;
- material usage norms;
- repeated repair clusters;
- photo quality aggregates;
- sensor rolling windows.

Feature quality checks:

- missing values;
- late events;
- outlier detection;
- schema version compatibility;
- data freshness SLA.

## 13.3 Inference pipeline

Modes:

1. **Batch scoring**
   - nightly or hourly health/risk scores;
   - all active elevators;
   - manager dashboards.

2. **Event-driven scoring**
   - after emergency call;
   - after work order close;
   - after suspicious material movement;
   - after photo validation fail.

3. **Realtime scoring future**
   - sensor stream anomaly detection;
   - controller telemetry events.

## 13.4 Model retraining

Retraining triggers:

- scheduled monthly/quarterly;
- data drift;
- model performance degradation;
- new equipment category;
- enough feedback labels collected.

Retraining steps:

1. build training dataset snapshot;
2. validate labels and leakage;
3. train candidate models;
4. evaluate against baseline;
5. explainability and bias checks;
6. shadow deploy;
7. promote with approval;
8. monitor in production.

## 13.5 Model registry

Store:

- model id;
- version;
- training dataset snapshot;
- feature schema;
- metrics;
- calibration;
- explainability config;
- approval status;
- artifact URI;
- rollback version.

---

# 14. IoT-ready architecture

## 14.1 Future telemetry sources

- vibration sensors;
- door cycle counters;
- door motor current;
- controller error codes;
- cabin movement events;
- temperature;
- power anomalies;
- maintenance mode events.

## 14.2 Stream processing

```text
IoT Gateway → Kafka topic → Stream processor → TimescaleDB hypertables → AI anomaly service → Alerts/Predictions
```

## 14.3 TimescaleDB hypertables

- `sensor_readings`;
- `controller_events`;
- `door_cycles`;
- `vibration_features`;
- `iot_device_health`.

## 14.4 Sensor feature examples

- vibration RMS;
- vibration kurtosis;
- door open/close failure rate;
- average door close time;
- motor current spikes;
- controller fault frequency;
- heartbeat gaps;
- trend slope over rolling windows.

## 14.5 IoT security

- device identity;
- signed telemetry;
- gateway authentication;
- replay protection;
- separate ingestion network;
- device health monitoring.

---

# 15. Database architecture

## 15.1 AIEvents

Purpose: normalized AI-related events.

Fields:

- `id UUID PK`;
- `event_type TEXT NOT NULL`;
- `entity_type TEXT NOT NULL`;
- `entity_id UUID NOT NULL`;
- `severity TEXT NOT NULL`;
- `payload JSONB NOT NULL`;
- `source TEXT NOT NULL`;
- `created_at TIMESTAMPTZ NOT NULL`;
- `processed_at TIMESTAMPTZ NULL`.

Indexes:

- `(event_type, created_at DESC)`;
- `(entity_type, entity_id, created_at DESC)`;
- GIN on `payload`.

## 15.2 Predictions

Fields:

- `id UUID PK`;
- `target_type TEXT NOT NULL`;
- `target_id UUID NOT NULL`;
- `model_name TEXT NOT NULL`;
- `model_version TEXT NOT NULL`;
- `risk_score NUMERIC(5,2) NOT NULL`;
- `risk_level TEXT NOT NULL`;
- `prediction_window INTERVAL NULL`;
- `predicted_component TEXT NULL`;
- `probability NUMERIC(5,4) NULL`;
- `confidence NUMERIC(5,4) NULL`;
- `explanation JSONB NOT NULL`;
- `recommendations JSONB NOT NULL`;
- `valid_until TIMESTAMPTZ NULL`;
- `created_at TIMESTAMPTZ NOT NULL`.

Indexes:

- `(target_type, target_id, created_at DESC)`;
- `(risk_level, created_at DESC)`;
- `(model_name, model_version)`.

## 15.3 ElevatorHealth

Fields:

- `id UUID PK`;
- `elevator_id UUID NOT NULL`;
- `health_score INT NOT NULL`;
- `risk_band TEXT NOT NULL`;
- `component_scores JSONB NOT NULL`;
- `top_factors JSONB NOT NULL`;
- `recommendations JSONB NOT NULL`;
- `calculated_at TIMESTAMPTZ NOT NULL`;
- `model_version TEXT NOT NULL`.

Indexes:

- `(elevator_id, calculated_at DESC)`;
- `(risk_band, calculated_at DESC)`;
- BRIN/partition by calculated_at at scale.

## 15.4 FailurePatterns

Fields:

- `id UUID PK`;
- `building_id UUID NULL`;
- `elevator_id UUID NULL`;
- `component TEXT NOT NULL`;
- `pattern_type TEXT NOT NULL`;
- `linked_work_order_ids UUID[] NOT NULL`;
- `first_seen_at TIMESTAMPTZ NOT NULL`;
- `last_seen_at TIMESTAMPTZ NOT NULL`;
- `severity TEXT NOT NULL`;
- `status TEXT NOT NULL`;
- `explanation JSONB NOT NULL`.

## 15.5 MechanicScores

Fields:

- `id UUID PK`;
- `mechanic_id UUID NOT NULL`;
- `period_start DATE NOT NULL`;
- `period_end DATE NOT NULL`;
- `quality_score NUMERIC(5,2) NOT NULL`;
- `repeat_repair_score NUMERIC(5,2) NOT NULL`;
- `material_discipline_score NUMERIC(5,2) NOT NULL`;
- `photo_compliance_score NUMERIC(5,2) NOT NULL`;
- `sla_score NUMERIC(5,2) NOT NULL`;
- `risk_flags JSONB NOT NULL`;
- `created_at TIMESTAMPTZ NOT NULL`.

## 15.6 Anomalies

Fields:

- `id UUID PK`;
- `anomaly_type TEXT NOT NULL`;
- `entity_type TEXT NOT NULL`;
- `entity_id UUID NOT NULL`;
- `severity TEXT NOT NULL`;
- `score NUMERIC(6,3) NOT NULL`;
- `status TEXT NOT NULL`;
- `evidence JSONB NOT NULL`;
- `recommended_actions JSONB NOT NULL`;
- `assigned_to_user_id UUID NULL`;
- `created_at TIMESTAMPTZ NOT NULL`;
- `acknowledged_at TIMESTAMPTZ NULL`;
- `resolved_at TIMESTAMPTZ NULL`.

## 15.7 RiskAssessments

Fields:

- `id UUID PK`;
- `assessment_type TEXT NOT NULL`;
- `scope_type TEXT NOT NULL`;
- `scope_id UUID NOT NULL`;
- `risk_level TEXT NOT NULL`;
- `risk_score NUMERIC(5,2) NOT NULL`;
- `factors JSONB NOT NULL`;
- `decision JSONB NULL`;
- `created_by TEXT NOT NULL`;
- `created_at TIMESTAMPTZ NOT NULL`.

---

# 16. AI event system

## 16.1 Event topics

Kafka/RabbitMQ topics:

- `erp.work-orders`;
- `erp.materials`;
- `erp.photos`;
- `erp.emergency-calls`;
- `ai.predictions`;
- `ai.anomalies`;
- `ai.health-scores`;
- `ai.recommendations`;
- future `iot.telemetry`.

## 16.2 AI output events

- `prediction_created`;
- `health_score_updated`;
- `repeated_repair_detected`;
- `mechanic_anomaly_detected`;
- `material_anomaly_detected`;
- `photo_fraud_suspected`;
- `critical_failure_risk_detected`;
- `recommendation_created`;
- `ai_alert_escalated`.

## 16.3 Idempotency

AI event processing uses:

- event id;
- model version;
- target id;
- input snapshot hash;
- deduplication key.

---

# 17. Security and governance

## 17.1 RBAC

Roles:

- dispatcher: view operational AI warnings for work orders;
- manager: view health scores, mechanic scores, risk dashboards;
- warehouse manager: view material anomalies;
- admin: configure thresholds and model access;
- AI service account: write predictions/anomalies only.

## 17.2 AI audit logs

Audit:

- model inference;
- model version;
- inputs snapshot id;
- recommendation display;
- user accepted/dismissed feedback;
- alert escalation;
- manual override.

## 17.3 Explainability

Every critical prediction must show:

- top risk factors;
- related work orders;
- data freshness;
- model confidence;
- model version;
- recommended action;
- limitations if confidence is low.

## 17.4 Sensitive analytics protection

- mechanic scores visible only to authorized roles;
- raw model features hidden unless admin/debug permission;
- personal data minimized in AI services;
- logs redact personal and signed URL data;
- model artifacts access restricted.

---

# 18. Performance and scaling

## 18.1 Target scale

- thousands of elevators;
- millions of work order/material/photo events;
- high-volume time-series telemetry future;
- continuous scoring;
- realtime AI alerting.

## 18.2 Scaling strategy

- TimescaleDB hypertables for time-series;
- PostgreSQL partitions for predictions/anomalies history;
- Redis caching for latest health scores and active alerts;
- Kafka partitions by elevator/building;
- separate AI worker pools by model type;
- batch scoring with chunking;
- async UI loading and virtualization;
- WebSocket throttling/deduplication.

## 18.3 Frontend performance

- virtualized alert queues;
- incremental loading of timelines;
- lazy-loaded maps/heatmaps;
- cached latest health score per elevator;
- drill-down fetch on demand;
- no rendering of large raw event streams.

## 18.4 AI service performance

- precomputed features;
- vectorized batch inference;
- model warm pools;
- Redis cache for latest predictions;
- timeout budgets;
- graceful degradation: show stale score with warning.

---

# 19. Production AI infrastructure

## 19.1 Services

```text
/services/ai
  /predictive-maintenance-service
  /health-score-service
  /repeated-repair-service
  /mechanic-performance-service
  /material-anomaly-service
  /photo-analytics-service
  /recommendation-service
  /feature-engineering-workers
  /model-training-pipelines
```

## 19.2 FastAPI endpoints

Internal endpoints:

- `POST /internal/ai/predict/elevator-risk`;
- `POST /internal/ai/score/elevator-health`;
- `POST /internal/ai/detect/repeated-repairs`;
- `POST /internal/ai/detect/material-anomalies`;
- `POST /internal/ai/score/mechanic`;
- `POST /internal/ai/recommendations/generate`;
- `GET /internal/ai/models/:modelName/versions`.

Endpoints are internal only, authenticated by service identity, and never exposed directly to browser clients.

## 19.3 Observability

Metrics:

- prediction latency;
- batch scoring duration;
- event lag;
- feature freshness;
- model error rate;
- alert volume;
- false positive feedback rate;
- model drift indicators.

Logs/traces:

- correlation id from ERP event;
- model version;
- target id;
- inference duration;
- outcome severity.

## 19.4 Failure modes

If AI service is unavailable:

- ERP continues operating;
- queue retries inference;
- UI shows stale/unknown AI status;
- critical manual workflows remain available;
- alerts are not silently dropped.

---

# 20. Production readiness checklist

1. AI outputs include model version and explainability.
2. Critical predictions are actionable, not decorative.
3. AI services do not mutate ERP state directly.
4. Event processing is idempotent.
5. Repeated repair detection links evidence work orders.
6. Mechanic scoring is permission-protected.
7. Health score has data freshness and confidence indicators.
8. Alerts have lifecycle, owner, escalation and audit trail.
9. Heatmaps support drill-down to real objects/elevators.
10. Photo analytics detects missing, low quality, mismatch and reuse cases.
11. Purchase/material recommendations connect to warehouse workflows.
12. IoT ingestion is isolated and future-ready.
13. Model retraining has registry, evaluation and approval gates.
14. Frontend handles stale/unavailable AI gracefully.
15. No AI prediction is treated as unquestionable truth without human review for high-impact actions.
