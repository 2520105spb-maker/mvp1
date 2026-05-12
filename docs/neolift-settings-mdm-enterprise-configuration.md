# НеоЛифт ERP/PWA — Настройки, НСИ и корпоративная конфигурация

Этот модуль является production-ready платформой управления мастер-данными и конфигурацией ERP для лифтовой сервисной компании. Это не страница настроек и не CRUD-админка; это центр операционного governance для справочников, SLA, ролей, workflow, approvals, шаблонов, локализации, бизнес-правил и аудита.

## 1. MDM architecture

НСИ управляет доменами лифтов, материалов, типов работ, классификаций отказов, заказчиков, регионов, техников и поставщиков. Все записи имеют владельца, версию, статус публикации, статус валидации и зависимости.

## 2. Settings architecture

Системные настройки разделены по группам безопасности, синхронизации, уведомлений, документов и склада. Критические изменения требуют подтверждения, impact analysis и неизменяемой записи аудита.

## 3. RBAC architecture

RBAC поддерживает роли механика, старшего механика, диспетчера, склада, руководителя, директора и администратора. Права могут быть granular, объектными, региональными и approval-oriented.

## 4. SLA configuration engine

SLA-профили задают время реакции, время решения, критичность, цепочку эскалации, календарь праздников и приоритетную логику. Профили привязываются к типам работ и объектам.

## 5. Business rules engine

Бизнес-правила выполняют динамическую валидацию, предотвращают дубли, сломанные workflow, некорректный SLA и orphan references. Правила могут запускать автоматизации и блокировать публикацию.

## 6. Approval chain engine

Цепочки согласования поддерживают многоуровневые approvals, условия по стоимости/риску, таймауты, эскалации и права согласования по ролям.

## 7. Localization architecture

Интерфейс полностью русскоязычный. Переводы, доменные термины, шаблоны уведомлений и документы проходят через централизованный словарь и проверку терминологии.

## 8. Terminology management system

Словарь фиксирует термины вроде `Work Order → Заказ-наряд`, `Sync Failed → Ошибка синхронизации`, `Inventory → Склад`. Публикация UI и шаблонов блокируется при неутвержденных терминах.

## 9. Audit logging architecture

Аудит логирует изменения настроек, SLA, ролей, справочников, workflow, imports и exports. Записи имеют immutable hash и защищены от редактирования.

## 10. Import/export architecture

Поддерживаются Excel import, bulk update, template import и configuration export. Импорт проходит предварительную валидацию, deduplication, dependency checks и rollback-план.

## 11. Mobile admin UX

Мобильный доступ ограничен approvals, быстрыми исправлениями и alerts. Критические настройки редактируются только на desktop с подтверждением.

## 12. Desktop admin UX

Desktop UX выглядит как enterprise ERP administration center: левая навигация по доменам, центральный реестр конфигурации и правая панель dependencies, impact analysis, validation warnings и audit history.

## 13. Security architecture

Безопасность включает permission isolation, критические подтверждения, immutable audit, ограничения по ролям/регионам/объектам и защиту от публикации опасной конфигурации.

## 14. Performance architecture

Платформа рассчитана на тысячи master records, realtime validation, concurrent administrators и большие configuration trees через caching, dependency indexing и async validation.

## 15. Production enterprise administration platform architecture

Архитектура готова к интеграции с backend MDM API, workflow engine, RBAC service, audit storage, Excel import workers, template registries и будущими AI-assisted configuration, smart SLA recommendations, anomaly detection и dynamic workflows.
