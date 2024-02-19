import fs from "fs";
import AWS from "aws-sdk";
import sharp from "sharp";
import ReactionError from "@reactioncommerce/reaction-error";
const BUCKET_NAME = process.env.BUCKET_NAME;
const s3 = new AWS.S3({
  accessKeyId: process.env.ID,
  secretAccessKey: process.env.SECRET,
  region: process.env.REGION,
});
const promises = [];

const imgTransforms = [
  {
    name: "image",
    transform: { size: 1600, fit: "inside", format: "webp", type: "image/webp" },
  },
  {
    name: "large",
    transform: { size: 1000, fit: "inside", format: "webp", type: "image/webp" },
  },
  {
    name: "original",
    transform: { size: 1800, fit: "inside", format: "webp", type: "image/webp" },
  },
  {
    name: "medium",
    transform: { size: 600, fit: "inside", format: "webp", type: "image/webp" },
  },
  {
    name: "thumbnail",
    transform: { size: 235, fit: "inside", format: "png", type: "image/png" },
  },
];

export async function generateThumbs(filename, uploadName, key) {
  // for (i = 0; i < 4; i++) {
  //   promises.push(await imageTransformAndUpload(filename, i, uploadName, key));
  // }
  await Promise.all(promises)
    .then((results) => {
      console.log("All done", results);
      return true;
    })
    .catch((e) => {
      // Handle errors here
      throw new ReactionError("access-denied", e);
      // return e;
    });
}

export async function S3UploadImage(
  fileContent,
  uploadName,
  key,
  fileType,
  uploadPath
) {
  try {
    const currentTime = Date.now();
    const urlsArray = [];
    let urlsArrayObj = {
      image: {},
      large: {},
      medium: {},
      small: {},
      original: {},
      thumbnail: {},
    };
    if (fileType === "image") {
      const resizedImages = await Promise.all(
        imgTransforms.map(async (transform) => {
          let { name, size, fit, format, type } = transform;
          return await sharp(fileContent)
            .resize({
              height: size,
              fit: sharp.fit[fit],
              withoutEnlargement: true,
            })
            .webp({ lossless: false, alphaQuality: 50, quality: 80 })
            .toBuffer();
        })
      );
      await Promise.all(
        resizedImages.map(async (image, index) => {
          console.log("map count is ", image);
          const params = {
            Bucket: BUCKET_NAME,
            Key: `${uploadPath}/${imgTransforms[index].name}-${currentTime}-${
              uploadName.split(".")[0]
            }.webp`,
            Body: image,
          };
          const { Location } = await s3.upload(params).promise();
          console.log("location is ", index, Location);
          urlsArray.push(Location);
        })
      );
    } else {
      const params = {
        Bucket: BUCKET_NAME,
        Key: `${uploadPath}/${uploadName}`,
        Body: fileContent,
      };
      const { Location } = await s3.upload(params).promise();
      urlsArray.push(Location);
    }
    urlsArrayObj = urlToDictonary(urlsArray);
    return {
      status: true,
      msg: `All files uploaded successfully.`,
      url: urlsArray,
      urlObject: urlsArrayObj,
    };
  } catch (err) {
    console.log(err);
    // throw new ReactionError("access-denied", err);
    return {
      status: false,
      msg: err.message,
    };
  }
}
function urlToDictonary(urlsArray) {
  let imageType = "none";
  let urlsArrayObj = {};
  urlsArray.map((item) => {
    if (item.includes("/small-")) {
      imageType = "small";
    }
    if (item.includes("/original-")) {
      imageType = "original";
    }
    if (item.includes("/medium-")) {
      imageType = "medium";
    }
    if (item.includes("/large-")) {
      imageType = "large";
    }
    if (item.includes("/thumbnail-")) {
      imageType = "thumbnail";
    }
    if (item.includes("/image-")) {
      imageType = "image";
    }

    urlsArrayObj[imageType] = item;
  });
  return urlsArrayObj;
}

export async function S3UploadDocument(fileContent, uploadName, key) {
  return new Promise(async function (resolve, reject) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: `documents/${uploadName}`, // File name you want to save as in S3
        Body: result,
      };
      console.log({
        accessKeyId: process.env.ID,
        secretAccessKey: process.env.SECRET,
        region: process.env.REGION,
        bucketName: BUCKET_NAME,
      });
      // Uploading files to the bucket
      s3.upload(params, function (err, data) {
        console.log("data is ", data, "iteration no. ", i);
        if (err) {
          console.log("reaching error");
          // reject(err);
          throw new ReactionError("access-denied", err);
        }
        resolve({
          status: true,
          msg: `File uploaded successfully. ${data.Location}`,
          key,
          url: data.Location,
        });
      });
    } catch (err) {
      console.log("S3 Upload Handler");
      throw new ReactionError("access-denied", err);
      // console.log(err);
      // reject(err);
    }
  });
}
