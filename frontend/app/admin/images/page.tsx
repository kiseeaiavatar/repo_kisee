import fs from "fs";
import AdminJobGallery from "./jobGallery";

function listJobImages(): Promise<string[]> {
  const jobFolder = "./public/jobs";
  return new Promise((resolve, _reject) => {
    fs.readdir(jobFolder, (_err, files) => {
      resolve(files.map((i) => `/jobs/${i}`));
    });
  });
}

export default async function AdminImagePage() {
  const jobImages = await listJobImages();
  return <AdminJobGallery images={jobImages} />;
}
