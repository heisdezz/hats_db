/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const fs = app.newFilesystem();
  try {
    const basePath = "/home/destiny/Documents/projects/hats_db/pb_data/storage";
    const filesToUpload = [
      "pbc_4092854851/l8rvaqwxjs1sqoq/whats_app_image_2026_08_12_at_4_58_vf12zh8x9d.27PM2.jpeg",
      "pbc_4092854851/l8rvaqwxjs1sqoq/whats_app_image_2026_08_12_at_4_58_s5j8dmp5g4.27PM14.jpeg",
      "pbc_4092854851/l8rvaqwxjs1sqoq/whats_app_image_2026_08_12_at_4_58_vo6idaq4eb.27PM13.jpeg",
      "pbc_4092854851/l8rvaqwxjs1sqoq/whats_app_image_2026_08_12_at_4_58_jy04nccc58.27PM7.jpeg",
      "pbc_4092854851/l8rvaqwxjs1sqoq/thumbs_whats_app_image_2026_08_12_at_4_58_vf12zh8x9d.27PM2.jpeg/100x100_whats_app_image_2026_08_12_at_4_58_vf12zh8x9d.27PM2.jpeg",
      "pbc_4092854851/l8rvaqwxjs1sqoq/thumbs_whats_app_image_2026_08_12_at_4_58_s5j8dmp5g4.27PM14.jpeg/100x100_whats_app_image_2026_08_12_at_4_58_s5j8dmp5g4.27PM14.jpeg",
      "pbc_4092854851/l8rvaqwxjs1sqoq/thumbs_whats_app_image_2026_08_12_at_4_58_vo6idaq4eb.27PM13.jpeg/100x100_whats_app_image_2026_08_12_at_4_58_vo6idaq4eb.27PM13.jpeg",
      "pbc_4092854851/l8rvaqwxjs1sqoq/thumbs_whats_app_image_2026_08_12_at_4_58_jy04nccc58.27PM7.jpeg/100x100_whats_app_image_2026_08_12_at_4_58_jy04nccc58.27PM7.jpeg"
    ];

    for (const relPath of filesToUpload) {
      const fullPath = basePath + "/" + relPath;
      const file = $filesystem.fileFromPath(fullPath);
      fs.uploadFile(file, relPath);
    }
  } finally {
    fs.close();
  }

  try {
    const record = app.findRecordById("products", "l8rvaqwxjs1sqoq");
    record.set("mainColor", "Black");
    record.set("secondaryColor", "Black");
    record.set("color_selection", true);
    record.set("description", "<p>Sophisticated handcrafted black sinamay fascinator hat featuring dramatic sculpted loops, delicate feathers, and a central floral accent. An iconic statement piece for weddings, gala events, and royal ascot styles.</p>");
    app.save(record);
  } catch (_) {}
}, (app) => {
  // rollback
});
