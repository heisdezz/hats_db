onRecordUpdateRequest((e) => {
  if (e.auth?.isSuperuser) return e.next();

  console.log("requesting update products");
  const body = e.requestInfo().body;

  console.log("body", JSON.stringify(body));
  const tags = JSON.parse(body?.tags);

  if (tags?.length) {
    console.log("checking_tags");

    const tags_col = e.app.findCachedCollectionByNameOrId("tags");
    //@ts-ignore
    const tag_ids = tags.map((tag) => {
      console.log("tag", tag);
      if (tag.tagId) return tag.tagId;
      const normalized_tag = tag.tagName.trim().toLowerCase();
      const new_tag = new Record(tags_col);
      new_tag.set("name", normalized_tag);
      e.app.save(new_tag);
      return new_tag.id;
    });
    console.log(tag_ids);
    e.record?.set("tags", tag_ids);
  }
  e.next();
}, "products");

onRecordCreateRequest((e) => {
  if (e.auth?.isSuperuser) return e.next();

  const body = e.requestInfo().body;
  const tags = JSON.parse(body?.tags);

  // console.log(tags);
  if (tags?.length) {
    const tags_col = e.app.findCachedCollectionByNameOrId("tags");
    //@ts-ignore
    const tag_ids = tags.map((tag) => {
      // console.log(tag, "tag");
      if (tag.tagId) return tag.tagId;
      // console.log("found_tags", tag.tagName);
      const normalized_tag = tag.tagName.trim().toLowerCase();
      // console.log("normalized tag", normalized_tag);
      const new_tag = new Record(tags_col);
      new_tag.set("name", normalized_tag);
      e.app.save(new_tag);
      return new_tag.id;
    });
    console.log(tag_ids);
    e.record?.set("tags", tag_ids);
  }
  e.next();
}, "products");
