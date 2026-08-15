/// <reference path="../pb_data/types.d.ts" />

onRecordUpdateRequest((e) => {
  const body = e.requestInfo().body;
  if (body && body.tags != null) {
    let tags = body.tags;
    if (typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
      } catch (_) {
        tags = [tags];
      }
    }

    if (Array.isArray(tags)) {
      const tagsCol = e.app.findCachedCollectionByNameOrId("tags");
      const tagIdsSet = new Set();

      for (const tag of tags) {
        if (!tag) continue;

        if (typeof tag === "string") {
          const trimmed = tag.trim();
          if (!trimmed) continue;
          try {
            const rec = e.app.findRecordById("tags", trimmed);
            if (rec) {
              tagIdsSet.add(rec.id);
              continue;
            }
          } catch (_) {}

          const normalized = trimmed.toLowerCase();
          let tagRecord;
          try {
            tagRecord = e.app.findFirstRecordByData("tags", "name", normalized);
          } catch (_) {
            tagRecord = new Record(tagsCol);
            tagRecord.set("name", normalized);
            e.app.save(tagRecord);
          }
          tagIdsSet.add(tagRecord.id);
          continue;
        }

        const idCandidate = tag.tagId || tag.id;
        if (idCandidate && typeof idCandidate === "string") {
          try {
            const rec = e.app.findRecordById("tags", idCandidate);
            if (rec) {
              tagIdsSet.add(rec.id);
              continue;
            }
          } catch (_) {}
        }

        const nameCandidate = tag.tagName || tag.name || tag.label;
        if (nameCandidate && typeof nameCandidate === "string") {
          const normalized = nameCandidate.trim().toLowerCase();
          if (!normalized) continue;
          let tagRecord;
          try {
            tagRecord = e.app.findFirstRecordByData("tags", "name", normalized);
          } catch (_) {
            tagRecord = new Record(tagsCol);
            tagRecord.set("name", normalized);
            e.app.save(tagRecord);
          }
          tagIdsSet.add(tagRecord.id);
        }
      }

      e.record.set("tags", Array.from(tagIdsSet));
    }
  }

  e.next();
}, "products");

onRecordCreateRequest((e) => {
  const body = e.requestInfo().body;
  if (body && body.tags != null) {
    let tags = body.tags;
    if (typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
      } catch (_) {
        tags = [tags];
      }
    }

    if (Array.isArray(tags)) {
      const tagsCol = e.app.findCachedCollectionByNameOrId("tags");
      const tagIdsSet = new Set();

      for (const tag of tags) {
        if (!tag) continue;

        if (typeof tag === "string") {
          const trimmed = tag.trim();
          if (!trimmed) continue;
          try {
            const rec = e.app.findRecordById("tags", trimmed);
            if (rec) {
              tagIdsSet.add(rec.id);
              continue;
            }
          } catch (_) {}

          const normalized = trimmed.toLowerCase();
          let tagRecord;
          try {
            tagRecord = e.app.findFirstRecordByData("tags", "name", normalized);
          } catch (_) {
            tagRecord = new Record(tagsCol);
            tagRecord.set("name", normalized);
            e.app.save(tagRecord);
          }
          tagIdsSet.add(tagRecord.id);
          continue;
        }

        const idCandidate = tag.tagId || tag.id;
        if (idCandidate && typeof idCandidate === "string") {
          try {
            const rec = e.app.findRecordById("tags", idCandidate);
            if (rec) {
              tagIdsSet.add(rec.id);
              continue;
            }
          } catch (_) {}
        }

        const nameCandidate = tag.tagName || tag.name || tag.label;
        if (nameCandidate && typeof nameCandidate === "string") {
          const normalized = nameCandidate.trim().toLowerCase();
          if (!normalized) continue;
          let tagRecord;
          try {
            tagRecord = e.app.findFirstRecordByData("tags", "name", normalized);
          } catch (_) {
            tagRecord = new Record(tagsCol);
            tagRecord.set("name", normalized);
            e.app.save(tagRecord);
          }
          tagIdsSet.add(tagRecord.id);
        }
      }

      e.record.set("tags", Array.from(tagIdsSet));
    }
  }

  e.next();
}, "products");
