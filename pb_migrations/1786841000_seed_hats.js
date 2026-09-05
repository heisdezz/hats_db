/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const productsCol = app.findCachedCollectionByNameOrId("products");
  const tagsCol = app.findCachedCollectionByNameOrId("tags");
  const categoryRec = app.findFirstRecordByData("category", "name", "facinator");
  const categoryId = categoryRec ? categoryRec.id : "irf6qi9sctz69mo";

  function getOrCreateTag(tagName) {
    const normalized = tagName.trim().toLowerCase();
    try {
      const existing = app.findFirstRecordByData("tags", "name", normalized);
      return existing.id;
    } catch (_) {
      const tagRecord = new Record(tagsCol);
      tagRecord.set("name", normalized);
      app.save(tagRecord);
      return tagRecord.id;
    }
  }

  const hatsData = [
    {
      title: "Teal Rhinestone Fascinator Top Hat",
      description: "<p>Handcrafted structured teal fascinator top hat accented with shimmering silver rhinestone bands and an exquisite ribbon bow with pearl and crystal floral centerpiece. Perfect for weddings, church services, and high-fashion occasions.</p>",
      mainColor: "Teal",
      secondaryColor: "Silver",
      price: 25000,
      cartSpace: 4,
      colorSelection: true,
      published: true,
      tags: ["fascinator", "teal hat", "church hat", "wedding hat"],
      images: [
        "/home/destiny/Documents/projects/hats_db/temp_files/hats_1/WhatsApp Image 2026-09-05 at 7.27.35 PM.jpeg",
        "/home/destiny/Documents/projects/hats_db/temp_files/hats_1/WhatsApp Image 2026-09-05 at 7.27.35 PM (1).jpeg"
      ]
    },
    {
      title: "Burgundy & Gold Embellished Auto Gele",
      description: "<p>Stunning ready-to-wear Auto Gele in rich burgundy wine fabric adorned with gleaming gold thread embroidery and crystal stone embellishments. Features a tailored rosette crown and pre-formed pleats for effortless, regal traditional styling.</p>",
      mainColor: "Burgundy",
      secondaryColor: "Gold",
      price: 25000,
      cartSpace: 4,
      colorSelection: true,
      published: true,
      tags: ["auto gele", "burgundy gele", "aso oke", "african headwrap", "traditional wedding"],
      images: [
        "/home/destiny/Documents/projects/hats_db/temp_files/hats_2/WhatsApp Image 2026-09-05 at 7.26.20 PM.jpeg",
        "/home/destiny/Documents/projects/hats_db/temp_files/hats_2/WhatsApp Image 2026-09-05 at 7.26.20 PM (1).jpeg",
        "/home/destiny/Documents/projects/hats_db/temp_files/hats_2/WhatsApp Image 2026-09-05 at 7.26.20 PM (2).jpeg"
      ]
    },
    {
      title: "Royal Purple & Lime Green Patterned Auto Gele",
      description: "<p>Eye-catching modern Auto Gele crafted in deep royal purple fabric with vivid lime green geometric accents and delicate sparkling stones. Designed with an artistic front bow detail and pre-stitched structured folds for comfortable, instant celebration wear.</p>",
      mainColor: "Purple",
      secondaryColor: "Lime Green",
      price: 25000,
      cartSpace: 4,
      colorSelection: true,
      published: true,
      tags: ["auto gele", "purple gele", "party wear", "african headwrap", "owambe"],
      images: [
        "/home/destiny/Documents/projects/hats_db/temp_files/hats_3/WhatsApp Image 2026-09-05 at 7.27.19 PM.jpeg",
        "/home/destiny/Documents/projects/hats_db/temp_files/hats_3/WhatsApp Image 2026-09-05 at 7.27.19 PM (1).jpeg",
        "/home/destiny/Documents/projects/hats_db/temp_files/hats_3/WhatsApp Image 2026-09-05 at 7.27.20 PM.jpeg",
        "/home/destiny/Documents/projects/hats_db/temp_files/hats_3/WhatsApp Image 2026-09-05 at 7.27.20 PM (1).jpeg"
      ]
    }
  ];

  for (const item of hatsData) {
    const record = new Record(productsCol);
    record.set("title", item.title);
    record.set("description", item.description);
    record.set("category", categoryId);
    record.set("mainColor", item.mainColor);
    record.set("secondaryColor", item.secondaryColor);
    record.set("price", item.price);
    record.set("cart_space", item.cartSpace);
    record.set("color_selection", item.colorSelection);
    record.set("published", item.published);

    const tagIds = item.tags.map(t => getOrCreateTag(t));
    record.set("tags", tagIds);

    const files = [];
    for (const imgPath of item.images) {
      files.push($filesystem.fileFromPath(imgPath));
    }
    record.set("images", files);

    app.save(record);
  }
}, (app) => {
  const titles = [
    "Teal Rhinestone Fascinator Top Hat",
    "Burgundy & Gold Embellished Auto Gele",
    "Royal Purple & Lime Green Patterned Auto Gele"
  ];
  for (const title of titles) {
    try {
      const record = app.findFirstRecordByData("products", "title", title);
      if (record) {
        app.delete(record);
      }
    } catch (_) {}
  }
});
