"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePresignedUploadUrl = generatePresignedUploadUrl;
exports.initiateMultipartUpload = initiateMultipartUpload;
exports.getPresignedUrlForPart = getPresignedUrlForPart;
exports.completeMultipartUpload = completeMultipartUpload;
exports.getFileUrl = getFileUrl;
exports.deleteFile = deleteFile;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const aws_config_1 = require("./aws-config");
let _s3Client = null;
function getS3Client() {
    if (!_s3Client) {
        _s3Client = (0, aws_config_1.createS3Client)();
    }
    return _s3Client;
}
async function generatePresignedUploadUrl(fileName, contentType, isPublic = false) {
    const { bucketName, folderPrefix } = (0, aws_config_1.getBucketConfig)();
    const prefix = isPublic ? `${folderPrefix}public/uploads` : `${folderPrefix}uploads`;
    const cloud_storage_path = `${prefix}/${Date.now()}-${fileName}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: bucketName,
        Key: cloud_storage_path,
        ContentType: contentType,
        ContentDisposition: isPublic ? 'attachment' : undefined,
    });
    const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(getS3Client(), command, { expiresIn: 3600 });
    return { uploadUrl, cloud_storage_path };
}
async function initiateMultipartUpload(fileName, isPublic) {
    const { bucketName, folderPrefix } = (0, aws_config_1.getBucketConfig)();
    const prefix = isPublic ? `${folderPrefix}public/uploads` : `${folderPrefix}uploads`;
    const cloud_storage_path = `${prefix}/${Date.now()}-${fileName}`;
    const command = new client_s3_1.CreateMultipartUploadCommand({
        Bucket: bucketName,
        Key: cloud_storage_path,
        ContentDisposition: isPublic ? 'attachment' : undefined,
    });
    const response = await getS3Client().send(command);
    return { uploadId: response.UploadId, cloud_storage_path };
}
async function getPresignedUrlForPart(cloud_storage_path, uploadId, partNumber) {
    const { bucketName } = (0, aws_config_1.getBucketConfig)();
    const command = new client_s3_1.UploadPartCommand({
        Bucket: bucketName,
        Key: cloud_storage_path,
        UploadId: uploadId,
        PartNumber: partNumber,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(getS3Client(), command, { expiresIn: 3600 });
}
async function completeMultipartUpload(cloud_storage_path, uploadId, parts) {
    const { bucketName } = (0, aws_config_1.getBucketConfig)();
    const command = new client_s3_1.CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: cloud_storage_path,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
    });
    await getS3Client().send(command);
}
async function getFileUrl(cloud_storage_path, isPublic) {
    const { bucketName } = (0, aws_config_1.getBucketConfig)();
    if (isPublic) {
        const region = await getS3Client().config.region();
        return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
    }
    const command = new client_s3_1.GetObjectCommand({
        Bucket: bucketName,
        Key: cloud_storage_path,
        ResponseContentDisposition: 'attachment',
    });
    return (0, s3_request_presigner_1.getSignedUrl)(getS3Client(), command, { expiresIn: 3600 });
}
async function deleteFile(cloud_storage_path) {
    const { bucketName } = (0, aws_config_1.getBucketConfig)();
    const command = new client_s3_1.DeleteObjectCommand({
        Bucket: bucketName,
        Key: cloud_storage_path,
    });
    await getS3Client().send(command);
}
//# sourceMappingURL=s3.js.map