import mongoose, { Document, Schema } from 'mongoose'

export interface IRefreshToken extends Document {
    userId: mongoose.Types.ObjectId
    token: string
    expiresAt: Date
    isValid: boolean
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        token: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true },
        isValid: { type: Boolean, default: true },
    },
    { timestamps: true }
)

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshTokens', RefreshTokenSchema);