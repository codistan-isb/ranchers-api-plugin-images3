// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// const path = require("path");
// import { fileURLToPath } from "url";
// import { dirname } from "path";
// const __dirname = dirname(fileURLToPath(import.meta.url));
// import multer from "multer";
// import sharp from "sharp";
// const { Storage } = require("@google-cloud/storage");
// const bucketName = process.env.BUCKET_NAME;
// let imgTransforms = [
//   {
//     name: "original",
//     transform: { size: 1600, fit: "inside", format: "jpg", type: "image/jpeg" },
//   },
//   {
//     name: "large",
//     transform: { size: 1000, fit: "inside", format: "jpg", type: "image/jpeg" },
//   },
//   {
//     name: "medium",
//     transform: { size: 600, fit: "inside", format: "jpg", type: "image/jpeg" },
//   },
//   {
//     name: "small",
//     transform: { size: 300, fit: "inside", format: "jpg", type: "image/jpeg" },
//   },
//   {
//     name: "thumbnail",
//     transform: { size: 120, fit: "inside", format: "png", type: "image/png" },
//   },
// ];

// // Configure multer to store uploaded files in a temporary folder
// const upload = multer({ storage: multer.memoryStorage() });

// export default async function gcpUpload(req, res) {
//   //   console.log("req", req);
//   let file = req.files.photos;
//   let isMulti = req.body.isMulti;
//   let uploadPath = req.body.uploadPath;
//   console.log("file ", file);
//   if (!file) {
//     res.status(400).send("No file uploaded.");
//     return;
//   }

//   const storageObject = new Storage({
//     keyFilename: path.join(
//       __dirname,
//       "../",
//       "configs",
//       "key-file-from-service-account.json"
//     ),
//   });

//   // const storageObject = new Storage({
//   //   keyFilename: path.join(__dirname, "../", "specific_env_variables.json"),
//   // });
//   const bucket = storageObject.bucket(bucketName);

//   let data = [];
//   let urls = [];
//   let availableSizes = {};
//   let uploads = [];
//   console.log("imgTransforms", imgTransforms);
//   for (let i = 0; i <= 4; i++) {
//     let name = imgTransforms[i].name;
//     let { size, fit, format, type } = imgTransforms[i].transform;
//     const resizedImage = await sharp(file.data)
//       .resize({
//         height: size,
//         fit: sharp.fit[fit],
//         withoutEnlargement: true,
//       })
//       .webp({ lossless: false, alphaQuality: 50, quality: 80 })
//       .toBuffer();
//     console.log("size", size);
//     console.log("resizedImage", resizedImage);
//     console.log("name ", `${req.body.uploadPath}${name}-${file.name}`);
//     const blob = bucket.file(`${req.body.uploadPath}${name}-${file.name}`);
// console.log("blob",blob);
//     const blobStream = blob.createWriteStream({
//       metadata: {
//         contentType: file.mimetype,
//       },
//       public: true,
//     });
//     console.log("blobStream", blobStream);
//     blobStream.on("error", (err) => {
//       console.log("err here", err);
//       res.status(500).json({
//         error: err,
//       });
//     });

//     uploads.push(
//       new Promise((resolve, reject) => {
//         blobStream.on("finish", async (_) => {
//           await blob.makePublic();
//           const publicUrl = blob.publicUrl();
//           console.log("publicUrl", publicUrl);
//           urls.push(publicUrl);
//           availableSizes[name] = publicUrl;
//           resolve();
//         });
//         blobStream.end(resizedImage);
//       })
//     );
//     console.log("uploads", uploads);
//   }
//   console.log("availableSizes", availableSizes);
//   await Promise.all(uploads);

//   data.push({
//     name: file.name,
//     mimetype: file.mimetype,
//     size: file.size,
//     url: urls,
//     availableSizes: availableSizes,
//   });

//   res.status(200).json({
//     code: 200,
//     status: true,
//     message: "File is uploaded!!!",
//     data: data,
//   });
// }

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

// import ExifParser from "exif-parser";

let imgTransforms = [
  {
    name: "original",
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
    name: "small",
    transform: { size: 300, fit: "inside", format: "jpg", type: "image/jpeg" },
  },
  {
    name: "thumbnail",
    transform: { size: 120, fit: "inside", format: "png", type: "image/png" },
  },
];

// Configure multer to store uploaded files in a temporary folder
const upload = multer({ storage: multer.memoryStorage() });

export default async function gcpUpload(req, res) {
  try {
    // Read the uploaded image data from req.files.photos
    let file = req.files.photos;

    let isMulti = req.body.isMulti;
    let uploadPath = req.body.uploadPath;
    let uploadName = file.name;

    const currentTime = Date.now();
    if (!file) {
      res.status(400).send("No file uploaded.");
      return;
    }

    // Create a Google Cloud Storage object
    // const storageObject = new Storage({
    //   keyFilename: path.join(__dirname, "../", "specific_env_variables.json"),
    // });

    const storageObject = new Storage({
      keyFilename: path.join(
        __dirname,
        "../",
        "configs",
        "key-file-from-service-account.json"
      ),
    });
    const bucket = storageObject.bucket(bucketName);

    let data = [];
    let urls = [];
    let availableSizes = {};
    let uploads = [];

    // Parse the EXIF data from the image buffer
    // const exifParser = ExifParser.create(file.data);
    // const exifResult = exifParser.parse();
    // const orientation = exifResult.tags.Orientation;

    // console.log("exifResult is ", exifResult);

    // console.log("orientation is ", orientation);

    let rotationAngle = 0;

    // switch (orientation) {
    //   case 6:
    //     rotationAngle = 90; // Rotate 90 degrees clockwise
    //     break;
    //   case 8:
    //     rotationAngle = -90; // Rotate 90 degrees counterclockwise
    //     break;
    //   // Add cases for other orientation values if needed
    // }

    for (let i = 0; i <= 4; i++) {
      let name = imgTransforms[i].name;
      let { size, fit, format, type } = imgTransforms[i].transform;
      let imageBuffer = file.data;

      // if (rotationAngle !== 0) {
      //   imageBuffer = await sharp(imageBuffer).rotate(rotationAngle).toBuffer();
      // }

      const resizedImage = await sharp(imageBuffer)
        .rotate()
        .resize({
          height: size,
          fit: sharp.fit[fit],
          withoutEnlargement: true,
        })
        .webp({ lossless: true, alphaQuality: 50, quality: 80 })
        .toBuffer();

      const fileURI = `${uploadPath}${name}-${currentTime}-${
        uploadName.split(".")[0]
      }.webp`;
      const blob = bucket.file(fileURI);

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
            // const publicUrl = `${process.env.CANONICAL_URL}${fileURI}`;
            const publicUrl = blob.publicUrl();
//           console.log("publicUrl", publicUrl);
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
    res.status(500).json({
      error: err,
    });
  }
}
