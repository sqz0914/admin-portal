'User Server'

import { S3Client, PutObjectCommand, S3ClientConfig } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

type SignedURLResponse = Promise<
  { failure?: undefined; success: { url: string } }
  | { failure: string; success?: undefined }
>

const allowedFileTypes = [
  "text/plain", // .txt
  "application/pdf", //.pdf
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", //.docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" //.xlsx
]

const maxFileSize = 1048576 * 1000 // 100 MB

/* environment varibales */
const awsRegion = process.env.NEXT_PUBLIC_AWS_BUCKET_REGION;
const awsAccessKeyId = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY;
const awsSecretAccessKey = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;
const awsBucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;

if (!awsRegion || !awsAccessKeyId || !awsSecretAccessKey) {
  throw new Error("AWS configuration is not properly set in environment variables");
}

const s3Config: S3ClientConfig = {
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
}

const s3Client = new S3Client(s3Config);

export async function getSignedURL(file: File): SignedURLResponse {
    if(!allowedFileTypes.includes(file.type)) {
      return {failure: "File type not allowed"}
    }

    if(file.size > maxFileSize) {
      return {failure: "File size too large"}
    }

    const putObjectCommand = new PutObjectCommand({
      Bucket: awsBucketName,
      Key: file.name,
    })

    const url = await getSignedUrl(
      s3Client,
      putObjectCommand,
      { expiresIn: 360 } // 360 seconds
    )

    return {success: {url}}
}