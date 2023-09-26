import { createRequire } from "module";
const require = createRequire(import.meta.url);
const path = require("path");
import { fileURLToPath } from "url";
import { dirname } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
import multer from "multer";
import sharp from "sharp";
const { Storage } = require("@google-cloud/storage");
const bucketName = process.env.BUCKET_NAME;
let imgTransforms = [
  {
    name: "image",
    transform: { size: 1600, fit: "inside", format: "jpg", type: "image/jpeg" },
  },
  {
    name: "large",
    transform: { size: 1000, fit: "inside", format: "jpg", type: "image/jpeg" },
  },
  {
    name: "medium",
    transform: { size: 600, fit: "inside", format: "jpg", type: "image/jpeg" },
  },
  {
    name: "thumbnail",
    transform: { size: 235, fit: "inside", format: "png", type: "image/png" },
  },
];

// Configure multer to store uploaded files in a temporary folder
const upload = multer({ storage: multer.memoryStorage() });

export default async function gcpUpload(req, res) {
  try {
    //   console.log("req", req);
    let file = req.files.photos;
    console.log("file name is ", file.name);

    let isMulti = req.body.isMulti;
    let uploadPath = req.body.uploadPath;
    let uploadName = file.name;
    //   console.log("file ", file);

    const currentTime = Date.now();
    if (!file) {
      res.status(400).send("No file uploaded.");
      return;
    }

    // const storageObject = new Storage({
    //   keyFilename: path.join(
    //     __dirname,
    //     "../",
    //     "configs",
    //     "key-file-from-service-account.json"
    //   ),
    // });

    const storageObject = new Storage({
      keyFilename: path.join(__dirname, "../", "specific_env_variables.json"),
    });

    const bucket = storageObject.bucket(bucketName);

    let data = [];
    let urls = [];
    let availableSizes = {};
    let uploads = [];

    for (let i = 0; i < 4; i++) {
      let name = imgTransforms[i].name;
      let { size, fit, format, type } = imgTransforms[i].transform;
      const resizedImage = await sharp(file.data)
        .resize({
          height: size,
          fit: sharp.fit[fit],
          withoutEnlargement: true,
        })
        .webp({ lossless: true, alphaQuality: 50, quality: 80 })
        .toBuffer();
      // console.log("name ", `${req.body.uploadPath}${name}-${file.name}`);
      const fileURI = `${uploadPath}${name}-${currentTime}-${
        uploadName.split(".")[0]
      }.webp`;
      const blob = bucket.file(fileURI);

      console.log("blob created is ", blob);

      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
        public: true,
      });

      blobStream.on("error", (err) => {
        console.log("err here", err);
        res.status(500).json({
          error: err,
        });
      });

      uploads.push(
        new Promise((resolve, reject) => {
          blobStream.on("finish", async (_) => {
            await blob.makePublic();
            const publicUrl = `${process.env.CANONICAL_URL}${fileURI}`;

            urls.push(publicUrl);
            availableSizes[name] = publicUrl;
            resolve();
          });
          blobStream.end(resizedImage);
        })
      );
    }

    await Promise.all(uploads);

    data.push({
      name: file.name,
      mimetype: file.mimetype,
      size: file.size,
      url: urls,
      availableSizes: availableSizes,
    });

    res.status(200).json({
      code: 200,
      status: true,
      message: "File is uploaded!!!",
      data: data,
    });
  } catch (err) {
    console.log("gcp upload error is ", err);
  }
}
