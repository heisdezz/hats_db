/// <reference path="../pb_data/types.d.ts" />

function processProductTags(e) {
  if (e.auth?.isSuperuser) return e.next();

  const body = e.requestInfo().body;
  if (!body || body.tags == null) {
    return e.next();
  }

  let tags = body.tags;
  if (typeof tags === "string") {
    try {
      tags = JSON.parse(tags);
    } catch (_) {
      tags = null;
    }
  }

  if (Array.isArray(tags) && tags.length > 0) {
    const tagsCol = e.app.findCachedCollectionByNameOrId("tags");
    const tagIdsSet = new Set();

    for (const tag of tags) {
      if (!tag) continue;
      if (tag.tagId) {
        tagIdsSet.add(tag.tagId);
        continue;
      }
      if (tag.tagName && typeof tag.tagName === "string") {
        const normalized = tag.tagName.trim().toLowerCase();
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

    e.record?.set("tags", Array.from(tagIdsSet));
  }

  e.next();
}

onRecordUpdateRequest((e) => {
  processProductTags(e);
}, "products");

onRecordCreateRequest((e) => {
  processProductTags(e);
}, "products");
