export default interface FileDetails {
    fileType: { type: String };
    fileName: { type: String };
    size: { type: Number };
    data?: { type: Buffer };
  }
